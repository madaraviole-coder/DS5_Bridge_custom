import {
  ACK_RESULT,
  REPORT_ID,
  REPORT_LENGTH,
  ackUserMessage,
  buildCommandReport,
  parseAckReport,
  parseDeviceIdentityReport,
  parseStatusReport,
  type BridgeAckPayload
} from '../shared/protocol';
import type { BridgeSnapshot, CompanionSettings } from '../shared/types';
import {
  WEBHID_DEVICE_FILTERS,
  WEBUSB_DEVICE_FILTERS,
  createEmptyDiagnostics,
  loadWebSettings,
  type WebHidDevice,
  type WebNavigatorWithHid,
  type WebNavigatorWithUsb,
  type WebUsbDevice
} from './web-bridge-types';

export class WebBridgeTransport {
  protected usbDevice: WebUsbDevice | null = null;
  protected usbInterfaceNumber = 5;
  protected usbOutEndpointNumber: number | null = null;
  protected hidDevice: WebHidDevice | null = null;
  protected activeTransport: 'none' | 'webusb' | 'webhid' = 'none';
  protected pollIntervalHandle: number | null = null;
  protected sequenceCounter = 1;
  protected listeners = new Set<(snapshot: BridgeSnapshot) => void>();
  protected settings: CompanionSettings;
  protected snapshot: BridgeSnapshot;

  protected get device(): any {
    return this.hidDevice || this.usbDevice;
  }

  constructor() {
    this.settings = loadWebSettings();
    this.snapshot = {
      state: 'no-bridge',
      message: 'Connect DS5 Bridge via WebUSB or WebHID',
      status: null,
      settings: this.settings,
      diagnostics: createEmptyDiagnostics(),
      personaTransition: null,
      bridgeDevices: null
    };

    if (typeof navigator !== 'undefined') {
      if ('usb' in navigator) {
        const usb = (navigator as unknown as WebNavigatorWithUsb).usb;
        usb.addEventListener('disconnect', (event: any) => {
          if (event.device === this.usbDevice) {
            this.handleDisconnect();
          }
        });
      }
      if ('hid' in navigator) {
        const hid = (navigator as unknown as WebNavigatorWithHid).hid;
        hid.addEventListener('disconnect', (event: any) => {
          if (event.device === this.hidDevice) {
            this.handleDisconnect();
          }
        });
      }
      void this.autoConnect();
    }
  }

  get activeTransportName(): string {
    if (this.usbDevice && this.usbDevice.opened) return 'WebUSB';
    if (this.hidDevice && this.hidDevice.opened) return 'WebHID';
    return '';
  }

  protected async autoConnect(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'usb' in navigator) {
      try {
        const usb = (navigator as unknown as WebNavigatorWithUsb).usb;
        const devices = await usb.getDevices();
        const matched = devices.find((d) => this.matchesUsbFilter(d));
        if (matched) {
          await this.attachUsbDevice(matched);
          return;
        }
      } catch {
        // Ignored
      }
    }

    if (typeof navigator !== 'undefined' && 'hid' in navigator) {
      try {
        const hid = (navigator as unknown as WebNavigatorWithHid).hid;
        const devices = await hid.getDevices();
        const matched = devices.find((d) => this.matchesHidFilter(d));
        if (matched) {
          await this.attachHidDevice(matched);
        }
      } catch {
        // Ignored
      }
    }
  }

  protected matchesUsbFilter(device: WebUsbDevice): boolean {
    return device.vendorId === 0x054c || device.vendorId === 0x1209 || device.vendorId === 0x2e8a;
  }

  protected matchesHidFilter(device: WebHidDevice): boolean {
    if (device.vendorId !== 0x054c && device.vendorId !== 0x2e8a) return false;
    for (const collection of device.collections) {
      if (collection.usagePage === 1 && collection.usage === 5) {
        return true;
      }
    }
    return false;
  }

  async connectBridge(): Promise<BridgeSnapshot> {
    if (typeof navigator !== 'undefined' && 'usb' in navigator) {
      try {
        return await this.connectWebUsb();
      } catch {
        // Fallback to WebHID
      }
    }
    return await this.connectWebHid();
  }

  async connectWebUsb(): Promise<BridgeSnapshot> {
    if (typeof navigator === 'undefined' || !('usb' in navigator)) {
      this.snapshot.message = 'WebUSB API is not supported in this browser. Please use Chrome, Edge, or Brave.';
      this.snapshot.state = 'error';
      this.emitSnapshot();
      return this.snapshot;
    }

    try {
      const usb = (navigator as unknown as WebNavigatorWithUsb).usb;
      const device = await usb.requestDevice({ filters: WEBUSB_DEVICE_FILTERS });
      if (device) {
        await this.attachUsbDevice(device);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.snapshot.diagnostics.lastError = message;
      this.emitSnapshot();
    }
    return this.snapshot;
  }

  async connectWebHid(): Promise<BridgeSnapshot> {
    if (typeof navigator === 'undefined' || !('hid' in navigator)) {
      this.snapshot.message = 'WebHID API is not supported in this browser. Please use Chrome, Edge, or Brave.';
      this.snapshot.state = 'error';
      this.emitSnapshot();
      return this.snapshot;
    }

    try {
      const hid = (navigator as unknown as WebNavigatorWithHid).hid;
      const devices = await hid.requestDevice({ filters: WEBHID_DEVICE_FILTERS });
      if (devices && devices.length > 0) {
        await this.attachHidDevice(devices[0]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.snapshot.diagnostics.lastError = message;
      this.emitSnapshot();
    }
    return this.snapshot;
  }

  protected async attachUsbDevice(device: WebUsbDevice): Promise<void> {
    if (!device.opened) {
      await device.open();
    }
    if (!device.configuration) {
      try {
        await device.selectConfiguration(1);
      } catch {
        // Ignore if already configured
      }
    }

    let targetInterfaceNumber = 5;
    let outEndpointNumber: number | null = null;

    if (device.configuration && Array.isArray(device.configuration.interfaces)) {
      for (const itf of device.configuration.interfaces) {
        const isVendor = itf.alternates?.some((alt) => alt.interfaceClass === 0xff);
        if (isVendor) {
          targetInterfaceNumber = itf.interfaceNumber;
          const alt = itf.alternates.find((a) => a.interfaceClass === 0xff);
          const ep = alt?.endpoints?.find((e) => e.direction === 'out');
          if (ep) {
            outEndpointNumber = ep.endpointNumber;
          }
          break;
        }
      }
    }

    try {
      await device.claimInterface(targetInterfaceNumber);
    } catch (claimErr) {
      console.warn(`Could not claim WebUSB interface ${targetInterfaceNumber}:`, claimErr);
    }

    this.usbDevice = device;
    this.usbInterfaceNumber = targetInterfaceNumber;
    this.usbOutEndpointNumber = outEndpointNumber;
    this.activeTransport = 'webusb';

    this.snapshot.state = 'connected';
    this.snapshot.message = `Connected to ${device.productName || 'DualSense Wireless Controller'} via WebUSB`;
    this.snapshot.diagnostics.hidPath = `WebUSB:${device.vendorId.toString(16)}:${device.productId.toString(16)}:if${targetInterfaceNumber}`;
    this.startPolling();
    await this.poll();
  }

  protected async attachHidDevice(device: WebHidDevice): Promise<void> {
    if (!device.opened) {
      await device.open();
    }
    this.hidDevice = device;
    this.activeTransport = 'webhid';
    this.snapshot.state = 'connected';
    this.snapshot.message = `Connected to ${device.productName || 'DualSense Wireless Controller'} via WebHID`;
    this.snapshot.diagnostics.hidPath = `WebHID:${device.vendorId.toString(16)}:${device.productId.toString(16)}`;
    this.startPolling();
    await this.poll();
  }

  protected handleDisconnect(): void {
    this.usbDevice = null;
    this.hidDevice = null;
    this.activeTransport = 'none';
    this.stopPolling();
    this.snapshot.state = 'no-bridge';
    this.snapshot.message = 'Bridge disconnected';
    this.snapshot.status = null;
    this.emitSnapshot();
  }

  protected startPolling(): void {
    this.stopPolling();
    this.pollIntervalHandle = window.setInterval(() => {
      void this.poll();
    }, 500);
  }

  protected stopPolling(): void {
    if (this.pollIntervalHandle !== null) {
      window.clearInterval(this.pollIntervalHandle);
      this.pollIntervalHandle = null;
    }
  }

  protected nextSequence(): number {
    const seq = this.sequenceCounter;
    this.sequenceCounter = (this.sequenceCounter + 1) & 0xff || 1;
    return seq;
  }

  protected async usbGetReport(reportId: number): Promise<Uint8Array> {
    if (!this.usbDevice || !this.usbDevice.opened) {
      throw new Error('No DS5 Bridge is connected via WebUSB.');
    }
    const result = await this.usbDevice.controlTransferIn(
      {
        requestType: 'vendor',
        recipient: 'interface',
        request: 0x31, // VENDOR_BRIDGE_CONTROL_GET_REPORT
        value: reportId,
        index: this.usbInterfaceNumber
      },
      64
    );
    if (!result.data || result.status !== 'ok') {
      throw new Error(`WebUSB GET_REPORT failed (${result.status})`);
    }
    const raw = new Uint8Array(64);
    raw[0] = reportId;
    raw.set(new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength), 0);
    return raw;
  }

  protected async usbSendReport(report: Uint8Array): Promise<void> {
    if (!this.usbDevice || !this.usbDevice.opened) {
      throw new Error('No DS5 Bridge is connected via WebUSB.');
    }
    if (this.usbOutEndpointNumber !== null) {
      try {
        const res = await this.usbDevice.transferOut(this.usbOutEndpointNumber, report as any);
        if (res.status === 'ok') return;
      } catch {
        // Fallback to controlTransferOut
      }
    }
    const res = await this.usbDevice.controlTransferOut(
      {
        requestType: 'vendor',
        recipient: 'interface',
        request: 0x32, // VENDOR_BRIDGE_CONTROL_SET_REPORT
        value: report[0],
        index: this.usbInterfaceNumber
      },
      report as any
    );
    if (res.status !== 'ok') {
      throw new Error(`WebUSB SET_REPORT failed (${res.status})`);
    }
  }

  protected async sendCommand(
    commandId: number,
    value: number,
    extraPayload?: ArrayLike<number>
  ): Promise<BridgeAckPayload> {
    if (
      (!this.usbDevice || !this.usbDevice.opened) &&
      (!this.hidDevice || !this.hidDevice.opened)
    ) {
      throw new Error('No DS5 Bridge is connected.');
    }

    const sequence = this.nextSequence();
    const commandReport = buildCommandReport(commandId, sequence, value, extraPayload);

    if (this.usbDevice && this.usbDevice.opened) {
      await this.usbSendReport(new Uint8Array(commandReport));
      const rawAckReport = await this.usbGetReport(REPORT_ID.ACK);
      const ack = parseAckReport(rawAckReport);
      this.snapshot.diagnostics.lastAck = ack;
      if (ack.resultCode !== ACK_RESULT.OK) {
        const msg = ackUserMessage(ack.resultCode);
        this.snapshot.diagnostics.lastError = msg;
        throw new Error(msg);
      }
      this.snapshot.diagnostics.settingsRevision = ack.settingsRevision;
      this.snapshot.diagnostics.lastError = null;
      return ack;
    }

    if (this.hidDevice && this.hidDevice.opened) {
      const reportId = commandReport[0];
      const data = new Uint8Array(commandReport.slice(1));
      await this.hidDevice.sendFeatureReport(reportId, data);

      const ackDataView = await this.hidDevice.receiveFeatureReport(REPORT_ID.ACK);
      const rawAckReport = new Uint8Array(REPORT_LENGTH);
      rawAckReport[0] = REPORT_ID.ACK;
      rawAckReport.set(new Uint8Array(ackDataView.buffer, ackDataView.byteOffset, ackDataView.byteLength), 1);

      const ack = parseAckReport(rawAckReport);
      this.snapshot.diagnostics.lastAck = ack;
      if (ack.resultCode !== ACK_RESULT.OK) {
        const msg = ackUserMessage(ack.resultCode);
        this.snapshot.diagnostics.lastError = msg;
        throw new Error(msg);
      }
      this.snapshot.diagnostics.settingsRevision = ack.settingsRevision;
      this.snapshot.diagnostics.lastError = null;
      return ack;
    }

    throw new Error('No DS5 Bridge device connected.');
  }

  protected async poll(): Promise<void> {
    if (this.usbDevice && this.usbDevice.opened) {
      try {
        const rawStatusReport = await this.usbGetReport(REPORT_ID.STATUS);
        const status = parseStatusReport(rawStatusReport);
        this.snapshot.status = status;
        this.snapshot.state = 'connected';
        this.snapshot.diagnostics.lastPollAt = Date.now();
        this.snapshot.diagnostics.uptimeSeconds = status.uptimeSeconds;
        this.snapshot.diagnostics.protocolVersion = status.protocolVersion;

        if (!this.snapshot.diagnostics.deviceIdentity) {
          try {
            const rawIdentReport = await this.usbGetReport(REPORT_ID.DEVICE_IDENTITY);
            this.snapshot.diagnostics.deviceIdentity = parseDeviceIdentityReport(rawIdentReport);
          } catch {
            // Optional
          }
        }
        this.emitSnapshot();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.snapshot.diagnostics.lastError = message;
        this.emitSnapshot();
      }
      return;
    }

    if (this.hidDevice && this.hidDevice.opened) {
      try {
        const statusDataView = await this.hidDevice.receiveFeatureReport(REPORT_ID.STATUS);
        const rawStatusReport = new Uint8Array(REPORT_LENGTH);
        rawStatusReport[0] = REPORT_ID.STATUS;
        rawStatusReport.set(
          new Uint8Array(statusDataView.buffer, statusDataView.byteOffset, statusDataView.byteLength),
          1
        );

        const status = parseStatusReport(rawStatusReport);
        this.snapshot.status = status;
        this.snapshot.state = 'connected';
        this.snapshot.diagnostics.lastPollAt = Date.now();
        this.snapshot.diagnostics.uptimeSeconds = status.uptimeSeconds;
        this.snapshot.diagnostics.protocolVersion = status.protocolVersion;

        if (!this.snapshot.diagnostics.deviceIdentity) {
          try {
            const identDataView = await this.hidDevice.receiveFeatureReport(REPORT_ID.DEVICE_IDENTITY);
            const rawIdentReport = new Uint8Array(REPORT_LENGTH);
            rawIdentReport[0] = REPORT_ID.DEVICE_IDENTITY;
            rawIdentReport.set(
              new Uint8Array(identDataView.buffer, identDataView.byteOffset, identDataView.byteLength),
              1
            );
            this.snapshot.diagnostics.deviceIdentity = parseDeviceIdentityReport(rawIdentReport);
          } catch {
            // Ignore optional report
          }
        }

        this.emitSnapshot();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.snapshot.diagnostics.lastError = message;
        this.emitSnapshot();
      }
    }
  }

  protected emitSnapshot(): void {
    this.snapshot = {
      ...this.snapshot,
      settings: { ...this.settings }
    };
    for (const listener of this.listeners) {
      try {
        listener(this.snapshot);
      } catch {
        // Ignore listener error
      }
    }
  }

  onSnapshot(callback: (snapshot: BridgeSnapshot) => void): any {
    this.listeners.add(callback);
    callback(this.snapshot);
    return () => this.listeners.delete(callback);
  }

  async getStatus(): Promise<BridgeSnapshot> {
    if (this.device && this.device.opened) {
      await this.poll();
    }
    return this.snapshot;
  }
}
