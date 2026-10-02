import { IconEdit as Pencil, IconTrash as Trash2, IconX as X } from '@tabler/icons-react';
import { MAX_CHORD_FUNCTION_NAME_LENGTH } from '../../../shared/protocol';
import type { ChordFunction } from '../../../shared/protocol';
import type { ChordFunctionDialogMode } from '../../types/chords';

export interface ChordFunctionModalProps {
  dialog: { mode: ChordFunctionDialogMode } | null;
  targetFunction: ChordFunction | null;
  nameDraft: string;
  setNameDraft: (name: string) => void;
  pendingAction: string | null;
  onClose: () => void;
  onSubmit: () => void;
}

export function ChordFunctionModal({
  dialog,
  targetFunction,
  nameDraft,
  setNameDraft,
  pendingAction,
  onClose,
  onSubmit
}: ChordFunctionModalProps) {
  if (!dialog) return null;

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
        aria-label="Chord function"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="settings-menu-heading bridge-settings-modal-heading">
          <div className="modal-heading-copy">
            {dialog.mode === 'delete' ? <Trash2 size={16} /> : <Pencil size={16} />}
            <span>
              {dialog.mode === 'delete' ? 'Delete Function' : 'Rename Function'}
            </span>
          </div>
          <button
            className="modal-close-button"
            type="button"
            aria-label="Close chord function dialog"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        {dialog.mode === 'delete' ? (
          <p className="remap-profile-dialog-copy">
            Delete {targetFunction?.name ?? 'this function'}?
          </p>
        ) : (
          <label className="remap-profile-name-field">
            <span>Function Name</span>
            <input
              autoFocus
              value={nameDraft}
              maxLength={MAX_CHORD_FUNCTION_NAME_LENGTH}
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
            className={`primary-action ${dialog.mode === 'delete' ? 'danger' : ''}`}
            disabled={pendingAction !== null || (dialog.mode !== 'delete' && nameDraft.trim().length === 0)}
          >
            {dialog.mode === 'delete' ? 'Delete' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
