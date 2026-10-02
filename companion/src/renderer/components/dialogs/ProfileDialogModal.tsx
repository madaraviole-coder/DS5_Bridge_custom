import { IconDeviceFloppy as Save, IconTrash as Trash2, IconX as X } from '@tabler/icons-react';

export interface ProfileDialogModalProps {
  isOpen: boolean;
  mode: 'save' | 'rename' | 'delete' | null;
  titleSave: string;
  titleRename: string;
  titleDelete: string;
  ariaLabel: string;
  closeAriaLabel?: string;
  targetName?: string;
  nameDraft: string;
  setNameDraft: (name: string) => void;
  pendingAction: string | null;
  maxLength?: number;
  onClose: () => void;
  onSubmit: () => void;
}

export function ProfileDialogModal({
  isOpen,
  mode,
  titleSave,
  titleRename,
  titleDelete,
  ariaLabel,
  closeAriaLabel,
  targetName,
  nameDraft,
  setNameDraft,
  pendingAction,
  maxLength = 48,
  onClose,
  onSubmit
}: ProfileDialogModalProps) {
  if (!isOpen || !mode) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <form
        className="settings-menu bridge-settings-modal remap-profile-modal"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="settings-menu-heading bridge-settings-modal-heading">
          <div className="modal-heading-copy">
            {mode === 'delete' ? <Trash2 size={16} /> : <Save size={16} />}
            <span>
              {mode === 'save'
                ? titleSave
                : mode === 'rename'
                  ? titleRename
                  : titleDelete}
            </span>
          </div>
          <button
            className="modal-close-button"
            type="button"
            aria-label={closeAriaLabel ?? `Close ${ariaLabel} dialog`}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        {mode === 'delete' ? (
          <p className="remap-profile-dialog-copy">
            Delete {targetName}?
          </p>
        ) : (
          <label className="remap-profile-name-field">
            <span>Profile Name</span>
            <input
              autoFocus
              value={nameDraft}
              maxLength={maxLength}
              onChange={(event) => setNameDraft(event.target.value)}
            />
          </label>
        )}
        <div className="remap-profile-dialog-actions">
          <button type="button" className="secondary-action" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={`primary-action ${mode === 'delete' ? 'danger' : ''}`}
            disabled={pendingAction !== null || (mode !== 'delete' && nameDraft.trim().length === 0)}
          >
            {mode === 'delete' ? 'Delete' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
