import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import {
  ControllerShortcutService,
  DUALSENSE_PID,
  DUALSENSE_EDGE_PID,
  DUALSHOCK4_GEN1_PID,
  DEFAULT_SHORTCUT_DEBOUNCE_MS
} from './controller-shortcut-service';

vi.mock('node-hid', () => ({
  devices: vi.fn(() => []),
  HID: vi.fn()
}));

describe('ControllerShortcutService', () => {
  let service: ControllerShortcutService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ControllerShortcutService();
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('parsePsButtonState', () => {
    it('detects PS button in DualSense USB 64-byte report', () => {
      const pressedReport = Buffer.alloc(64);
      pressedReport[0] = 0x01; // Report ID
      pressedReport[10] = 0x01; // PS button bit 0

      const releasedReport = Buffer.alloc(64);
      releasedReport[0] = 0x01;
      releasedReport[10] = 0x00;

      expect(ControllerShortcutService.parsePsButtonState(pressedReport, DUALSENSE_PID)).toBe(true);
      expect(ControllerShortcutService.parsePsButtonState(releasedReport, DUALSENSE_PID)).toBe(false);
    });

    it('detects PS button in DualSense Edge report', () => {
      const edgeReport = Buffer.alloc(64);
      edgeReport[0] = 0x01;
      edgeReport[10] = 0x01;

      expect(ControllerShortcutService.parsePsButtonState(edgeReport, DUALSENSE_EDGE_PID)).toBe(true);
    });

    it('detects PS button in DualSense Bluetooth 78-byte report', () => {
      const btReport = Buffer.alloc(78);
      btReport[0] = 0x31; // BT Report ID
      btReport[12] = 0x01; // PS button bit 0

      expect(ControllerShortcutService.parsePsButtonState(btReport, DUALSENSE_PID)).toBe(true);

      btReport[12] = 0x00;
      expect(ControllerShortcutService.parsePsButtonState(btReport, DUALSENSE_PID)).toBe(false);
    });

    it('detects PS button in DualShock 4 USB report', () => {
      const ds4Report = Buffer.alloc(64);
      ds4Report[0] = 0x01;
      ds4Report[7] = 0x01; // DS4 PS button bit 0

      expect(ControllerShortcutService.parsePsButtonState(ds4Report, DUALSHOCK4_GEN1_PID)).toBe(true);

      ds4Report[7] = 0x00;
      expect(ControllerShortcutService.parsePsButtonState(ds4Report, DUALSHOCK4_GEN1_PID)).toBe(false);
    });

    it('returns false for truncated or null buffers', () => {
      expect(ControllerShortcutService.parsePsButtonState(Buffer.alloc(4), DUALSENSE_PID)).toBe(false);
      expect(ControllerShortcutService.parsePsButtonState(Buffer.alloc(0), DUALSENSE_PID)).toBe(false);
    });
  });

  describe('Debounce and Hold Engine', () => {
    it('does not trigger on tap released before 1000ms', () => {
      const listener = vi.fn();
      service.on('ps-button', listener);

      const pressed = Buffer.alloc(64);
      pressed[0] = 0x01;
      pressed[10] = 0x01;

      const released = Buffer.alloc(64);
      released[0] = 0x01;
      released[10] = 0x00;

      service.handleReport(pressed);
      vi.advanceTimersByTime(450); // Single tap or turbo double tap released at 450ms
      service.handleReport(released);
      vi.advanceTimersByTime(1000);

      expect(listener).not.toHaveBeenCalled();
    });

    it('triggers ps-button after holding for 1000ms', () => {
      const listener = vi.fn();
      service.on('ps-button', listener);

      const pressed = Buffer.alloc(64);
      pressed[0] = 0x01;
      pressed[10] = 0x01;

      service.handleReport(pressed);
      vi.advanceTimersByTime(999);
      expect(listener).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(listener).toHaveBeenCalledTimes(1);

      // Holding the button further should NOT trigger again
      service.handleReport(pressed);
      vi.advanceTimersByTime(1000);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('suppresses second press within debounce window', () => {
      const listener = vi.fn();
      service.on('ps-button', listener);

      const pressed = Buffer.alloc(64);
      pressed[0] = 0x01;
      pressed[10] = 0x01;

      const released = Buffer.alloc(64);
      released[0] = 0x01;
      released[10] = 0x00;

      // First hold for 1000ms
      service.handleReport(pressed);
      vi.advanceTimersByTime(1000);
      expect(listener).toHaveBeenCalledTimes(1);

      // Release at t = 1050ms
      vi.advanceTimersByTime(50);
      service.handleReport(released);

      // Rapid second press at t = 1150ms (within 350ms debounce)
      vi.advanceTimersByTime(100);
      service.handleReport(pressed);
      vi.advanceTimersByTime(1000);
      expect(listener).toHaveBeenCalledTimes(1); // Suppressed by debounce!

      // Release
      service.handleReport(released);

      // Third press after debounce window
      vi.advanceTimersByTime(500);
      service.handleReport(pressed);
      vi.advanceTimersByTime(1000);
      expect(listener).toHaveBeenCalledTimes(2); // Allowed!
    });

    it('supports dynamic debounce configuration', () => {
      service.setDebounceMs(600);
      expect(service.getDebounceMs()).toBe(600);

      const listener = vi.fn();
      service.on('ps-button', listener);

      const pressed = Buffer.alloc(64);
      pressed[0] = 0x01;
      pressed[10] = 0x01;

      const released = Buffer.alloc(64);
      released[0] = 0x01;
      released[10] = 0x00;

      service.handleReport(pressed);
      vi.advanceTimersByTime(1000);
      expect(listener).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      service.handleReport(released);

      // Second press within 600ms debounce
      vi.advanceTimersByTime(200);
      service.handleReport(pressed);
      vi.advanceTimersByTime(1000);
      expect(listener).toHaveBeenCalledTimes(1); // Still suppressed because debounce is 600ms

      service.handleReport(released);
      vi.advanceTimersByTime(700);
      service.handleReport(pressed);
      vi.advanceTimersByTime(1000);
      expect(listener).toHaveBeenCalledTimes(2); // Now triggered!
    });

    it('clamps debounce between MIN and MAX', () => {
      service.setDebounceMs(50);
      expect(service.getDebounceMs()).toBe(150);

      service.setDebounceMs(2000);
      expect(service.getDebounceMs()).toBe(800);
    });

    it('updates debounce through updateSettings', () => {
      service.updateSettings({
        enabled: true,
        toggleShortcut: 'ps-button',
        debounceMs: 500,
        transparencyPercent: 90,
        alwaysOnTop: true,
        showQuickSettings: true,
        showBattery: true,
        showPresetPicker: true
      });
      expect(service.getDebounceMs()).toBe(500);
    });
  });

  describe('Lifecycle Management', () => {
    it('starts and stops cleanly', () => {
      service.start();
      expect(service.isMonitoring()).toBe(false); // No device mocked to connect yet

      service.stop();
      expect(service.isMonitoring()).toBe(false);
    });
  });
});
