import type { BridgeSnapshot } from '../../shared/types';

export function batteryLabel(snapshot: BridgeSnapshot | null | undefined): string {
  const battery = snapshot?.status?.batteryPercent;
  return battery === null || battery === undefined ? '\u2014' : `${battery}%`;
}

export function isChargingPowerState(rawPowerState: number | undefined): boolean {
  return rawPowerState === 0x01;
}

export function isExternalPowerState(rawPowerState: number | undefined): boolean {
  return rawPowerState === 0x01 || rawPowerState === 0x02;
}

export function controllerName(type: string | undefined): string {
  if (type === 'dualsense-edge') return 'DualSense Edge';
  if (type === 'dualsense') return 'DualSense';
  return 'Controller';
}

export function healthLabel(snapshot: BridgeSnapshot | null | undefined): string {
  if (!snapshot) return 'Unavailable';
  if (snapshot.state !== 'connected') {
    return /^Firmware .+ update required$/i.test(snapshot.message)
      ? 'Update required: Bridge Settings > Firmware'
      : snapshot.message;
  }
  if (snapshot.diagnostics.lastError) return snapshot.diagnostics.lastError;
  if (snapshot.diagnostics.firmwareUpdateAvailable) {
    return `Firmware ${snapshot.diagnostics.firmwareUpdateAvailable.availableVersion} available`;
  }
  if (!snapshot.status?.controllerConnected && snapshot.settings.wakeOnConnectEnabled) {
    return 'Wake with controller enabled';
  }
  if (!snapshot.status?.controllerConnected) return 'Bridge online';
  return 'All systems normal';
}

export function healthTitle(snapshot: BridgeSnapshot | null | undefined): string | undefined {
  if (
    snapshot?.state !== 'connected' ||
    snapshot.diagnostics.lastError ||
    snapshot.diagnostics.firmwareUpdateAvailable ||
    snapshot.status?.controllerConnected
  ) {
    return undefined;
  }
  return snapshot.settings.wakeOnConnectEnabled
    ? 'The Pico bridge is online. Controller wake is enabled, but no controller is connected.'
    : 'The Pico bridge is online and waiting for a controller.';
}

export function hexByte(value: number): string {
  return value.toString(16).padStart(2, '0').toUpperCase();
}
