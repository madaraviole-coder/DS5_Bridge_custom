import { EventEmitter } from 'events';
import * as HID from 'node-hid';
import type { KitsuneBarSettings } from '../shared/types';

export const SONY_VENDOR_ID = 0x054c;
export const DUALSENSE_PID = 0x0ce6;
export const DUALSENSE_EDGE_PID = 0x0df2;
export const DUALSHOCK4_GEN1_PID = 0x05c4;
export const DUALSHOCK4_GEN2_PID = 0x09cc;

export const DEFAULT_SHORTCUT_DEBOUNCE_MS = 350;
export const MIN_SHORTCUT_DEBOUNCE_MS = 150;
export const MAX_SHORTCUT_DEBOUNCE_MS = 800;

export interface ControllerShortcutServiceEvents {
  'ps-button': () => void;
  'device-connected': (info: HID.Device) => void;
  'device-disconnected': () => void;
}

export class ControllerShortcutService extends EventEmitter {
  private activeDevice: HID.HID | null = null;
  private activeDevicePath: string | null = null;
  private scanTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private wasPsPressed = false;
  private lastTriggerTime = 0;
  private debounceMs = DEFAULT_SHORTCUT_DEBOUNCE_MS;
  private activePid = 0;

  constructor(settings?: KitsuneBarSettings) {
    super();
    if (settings) {
      this.updateSettings(settings);
    }
  }

  public updateSettings(settings?: KitsuneBarSettings): void {
    if (settings && Number.isFinite(settings.debounceMs)) {
      this.setDebounceMs(settings.debounceMs!);
    }
  }

  public setDebounceMs(ms: number): void {
    this.debounceMs = Math.max(MIN_SHORTCUT_DEBOUNCE_MS, Math.min(MAX_SHORTCUT_DEBOUNCE_MS, Math.round(ms)));
  }

  public getDebounceMs(): number {
    return this.debounceMs;
  }

  public isMonitoring(): boolean {
    return this.activeDevice !== null;
  }

  public getActiveDevicePath(): string | null {
    return this.activeDevicePath;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.pollForDevice();
    this.scanTimer = setInterval(() => {
      if (!this.activeDevice && this.isRunning) {
        this.pollForDevice();
      }
    }, 2000);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    this.disconnectActiveDevice();
  }

  public static parsePsButtonState(buf: Buffer, pid: number = DUALSENSE_PID): boolean {
    if (!buf || buf.length < 8) return false;

    const reportId = buf[0];
    const isDualSense = pid === DUALSENSE_PID || pid === DUALSENSE_EDGE_PID || pid === 0;

    if (isDualSense) {
      // Standard USB DualSense input report: len >= 64, reportId === 0x01
      // Byte 10 bit 0: PS Button (0x01)
      if (reportId === 0x01 && buf.length >= 11) {
        return (buf[10] & 0x01) !== 0;
      }
      // Bluetooth extended DualSense report: reportId === 0x31, len >= 78
      // Byte 12 bit 0: PS Button (0x01)
      if (reportId === 0x31 && buf.length >= 13) {
        return (buf[12] & 0x01) !== 0;
      }
      // Fallback: If 63 bytes without reportId (raw payload), byte 9 bit 0
      if (reportId !== 0x01 && buf.length >= 10) {
        return (buf[9] & 0x01) !== 0;
      }
    } else {
      // DualShock 4 USB input report: reportId === 0x01, len >= 64
      // Byte 7 bit 0: PS Button (0x01)
      if (reportId === 0x01 && buf.length >= 8) {
        return (buf[7] & 0x01) !== 0;
      }
      // DualShock 4 BT input report: reportId === 0x11, len >= 78
      // Byte 9 bit 0: PS Button (0x01)
      if (reportId === 0x11 && buf.length >= 10) {
        return (buf[9] & 0x01) !== 0;
      }
    }

    return false;
  }

  private pollForDevice(): void {
    if (this.activeDevice || !this.isRunning) return;

    try {
      const devices = HID.devices();
      const target = devices.find((d) => this.isMatchingController(d));
      if (target && target.path) {
        this.connectDevice(target);
      }
    } catch (err) {
      console.warn('[ControllerShortcutService] Error enumerating HID devices:', err);
    }
  }

  private isMatchingController(d: HID.Device): boolean {
    if (d.vendorId !== SONY_VENDOR_ID) return false;

    const isPlayStationPid =
      d.productId === DUALSENSE_PID ||
      d.productId === DUALSENSE_EDGE_PID ||
      d.productId === DUALSHOCK4_GEN1_PID ||
      d.productId === DUALSHOCK4_GEN2_PID;

    if (!isPlayStationPid) return false;

    // Filter out keyboard / mouse composite interfaces by path
    if (d.path) {
      const lower = d.path.toLowerCase();
      if (lower.includes('&mi_04') || lower.includes('&mi_05') || lower.includes('&mi_02') || lower.includes('&mi_01')) {
        return false;
      }
      if (lower.includes('&mi_03') || lower.includes('&mi_00')) {
        return true;
      }
    }

    // Filter out Bridge Keyboard / Mouse synthetic endpoints (Interface 4 or 2)
    if (d.interface !== undefined && d.interface !== -1) {
      return d.interface === 3 || d.interface === 0;
    }

    // Check usage page if interface is not specified
    if (d.usagePage !== undefined && d.usage !== undefined) {
      // Generic Desktop (1) + Gamepad (5) or Joystick (4)
      return d.usagePage === 1 && (d.usage === 5 || d.usage === 4);
    }

    return true;
  }

  private connectDevice(deviceInfo: HID.Device): void {
    if (!deviceInfo.path) return;

    try {
      const dev = new HID.HID(deviceInfo.path);
      this.activeDevice = dev;
      this.activeDevicePath = deviceInfo.path;
      this.activePid = deviceInfo.productId;
      this.wasPsPressed = false;

      dev.on('data', (data: Buffer) => {
        this.handleReport(data);
      });

      dev.on('error', (err: Error) => {
        console.warn('[ControllerShortcutService] HID device error:', err.message);
        this.disconnectActiveDevice();
      });

      this.emit('device-connected', deviceInfo);
    } catch (err) {
      console.warn('[ControllerShortcutService] Failed to open HID device:', err);
      this.activeDevice = null;
      this.activeDevicePath = null;
    }
  }

  public handleReport(data: Buffer): void {
    const isPressed = ControllerShortcutService.parsePsButtonState(data, this.activePid);

    if (!this.wasPsPressed && isPressed) {
      const now = Date.now();
      if (now - this.lastTriggerTime >= this.debounceMs) {
        this.lastTriggerTime = now;
        this.emit('ps-button');
      }
    }

    this.wasPsPressed = isPressed;
  }

  private disconnectActiveDevice(): void {
    if (this.activeDevice) {
      try {
        this.activeDevice.close();
      } catch {
        // ignore close errors
      }
      this.activeDevice = null;
      this.activeDevicePath = null;
      this.wasPsPressed = false;
      this.emit('device-disconnected');
    }
  }
}
