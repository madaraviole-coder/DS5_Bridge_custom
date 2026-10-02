import { IconTrash as Trash2, IconX as X } from '@tabler/icons-react';

export interface GameProfileDeleteModalProps {
  deleteConfirmId: string | null;
  pendingAction: string | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void> | void;
}

export function GameProfileDeleteModal({
  deleteConfirmId,
  pendingAction,
  onClose,
  onConfirm
}: GameProfileDeleteModalProps) {
  if (!deleteConfirmId) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="settings-menu bridge-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Confirm delete game profile"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="settings-menu-heading bridge-settings-modal-heading">
          <div className="modal-heading-copy">
            <Trash2 size={16} />
            <span>Delete Game Profile</span>
          </div>
          <button
            className="modal-close-button"
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <p className="remap-profile-dialog-copy">
          Are you sure you want to delete this game profile? This will not affect controller or remapping profiles.
        </p>
        <div className="remap-profile-dialog-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary-action danger"
            disabled={pendingAction !== null}
            onClick={() => void onConfirm(deleteConfirmId)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
