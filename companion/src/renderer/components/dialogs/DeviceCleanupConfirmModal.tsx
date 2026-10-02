import { IconTool, IconX as X } from '@tabler/icons-react';

export interface DeviceCleanupConfirmModalProps {
  isOpen: boolean;
  pendingAction: string | null;
  controllerConnected: boolean;
  deviceCleanupError: string | null;
  deviceCleanupMessage: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function DeviceCleanupConfirmModal({
  isOpen,
  pendingAction,
  controllerConnected,
  deviceCleanupError,
  deviceCleanupMessage,
  onClose,
  onConfirm
}: DeviceCleanupConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <form
        className="settings-menu bridge-settings-modal device-cleanup-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Emergency device repair"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          void onConfirm();
        }}
      >
        <div className="settings-menu-heading bridge-settings-modal-heading">
          <div className="modal-heading-copy">
            <IconTool size={16} />
            <span>Emergency Device Repair</span>
          </div>
          <button
            className="modal-close-button"
            type="button"
            aria-label="Close emergency device repair dialog"
            disabled={pendingAction === 'device-cleanup'}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="device-cleanup-copy">
          <p>
            Only run this if you are running into persistent odd controller, rumble, haptics, audio, or Windows device issues.
          </p>
          <p>
            Disconnect the controller from the bridge before running this repair.
          </p>
          <ul>
            <li>Removes stale Windows DualSense, DualSense Edge, DS5 Bridge USB/HID, audio endpoint, and Bluetooth pairing records.</li>
            <li>Controller identity based profiles in Steam, emulators, or other tools may need to be assigned again.</li>
            <li>DualSense controllers paired directly to Windows over Bluetooth may need to be paired again.</li>
          </ul>
          {controllerConnected && (
            <div className="device-cleanup-alert bad">
              Controller is still connected to the bridge.
            </div>
          )}
          {deviceCleanupError && (
            <div className="device-cleanup-alert bad">
              {deviceCleanupError}
            </div>
          )}
          {deviceCleanupMessage && (
            <div className="device-cleanup-alert good">
              {deviceCleanupMessage}
            </div>
          )}
        </div>
        <div className="remap-profile-dialog-actions">
          <button
            type="button"
            className="secondary-action"
            disabled={pendingAction === 'device-cleanup'}
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="submit"
            className="primary-action danger"
            disabled={pendingAction !== null || controllerConnected}
          >
            {pendingAction === 'device-cleanup' ? 'Running...' : 'Run Repair'}
          </button>
        </div>
      </form>
    </div>
  );
}
