import {
  IconBooks,
  IconDeviceGamepad2,
  IconEdit as Pencil,
  IconPlus as Plus,
  IconRotateClockwise as RefreshCcw,
  IconAdjustments as Settings2,
  IconTrash as Trash2,
  IconX as X
} from '@tabler/icons-react';
import type { BridgeSnapshot, GameProfile, RunningProcessInfo } from '../../../shared/types';
import { DEFAULT_CONTROLLER_PROFILE_ID } from '../../../shared/protocol';
import { CustomSelect } from '../ui/CustomSelect';

export interface GameProfilesModalProps {
  isOpen: boolean;
  editingGameProfile: Partial<GameProfile> | null;
  setEditingGameProfile: (profile: Partial<GameProfile> | null) => void;
  snapshot: BridgeSnapshot;
  pendingAction: string | null;
  runAction: (label: string, action: () => Promise<BridgeSnapshot>) => Promise<void>;
  openAddGameProfile: () => void;
  openEditGameProfile: (profile: GameProfile) => void;
  closeGameProfileForm: () => void;
  saveCurrentGameProfile: () => Promise<void> | void;
  refreshRunningProcesses: () => Promise<void> | void;
  runningProcessesLoading: boolean;
  runningProcesses: RunningProcessInfo[];
  setGameProfileDeleteConfirmId: (id: string | null) => void;
  onClose: () => void;
}

export function GameProfilesModal({
  isOpen,
  editingGameProfile,
  setEditingGameProfile,
  snapshot,
  pendingAction,
  runAction,
  openAddGameProfile,
  openEditGameProfile,
  closeGameProfileForm,
  saveCurrentGameProfile,
  refreshRunningProcesses,
  runningProcessesLoading,
  runningProcesses,
  setGameProfileDeleteConfirmId,
  onClose
}: GameProfilesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="settings-menu bridge-settings-modal game-profiles-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Game Profiles"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="settings-menu-heading bridge-settings-modal-heading">
          <div className="modal-heading-copy">
            <IconBooks size={18} />
            <span>Game Profiles Library</span>
          </div>
          <button
            className="modal-close-button"
            type="button"
            aria-label="Close game profiles dialog"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="game-profiles-top-bar">
          <div className="game-profiles-auto-switch-bar">
            <span>Auto-switch profile when game launches</span>
            <button
              type="button"
              role="switch"
              aria-checked={snapshot.settings.gameProfileAutoSwitchEnabled}
              aria-label="Toggle auto-switch game profiles"
              className={`switch switch-orange ${snapshot.settings.gameProfileAutoSwitchEnabled ? 'on' : ''}`}
              disabled={pendingAction !== null}
              onClick={() => void runAction('game-profile-autoswitch', () => (
                window.bridge.setGameProfileAutoSwitchEnabled(!snapshot.settings.gameProfileAutoSwitchEnabled)
              ))}
            >
              <span />
            </button>
          </div>
          {!editingGameProfile && (
            <button
              type="button"
              className="primary-action add-game-btn"
              onClick={openAddGameProfile}
            >
              <Plus size={16} />
              Add Game Profile
            </button>
          )}
        </div>

        {editingGameProfile ? (
          <form
            className="game-profile-editor"
            onSubmit={(e) => {
              e.preventDefault();
              void saveCurrentGameProfile();
            }}
          >
            <h4>{editingGameProfile.id ? 'Edit Game Profile' : 'Add New Game Profile'}</h4>

            <div className="game-profile-form-grid">
              <div className="game-profile-field">
                <label htmlFor="game-profile-name-input">Game Title</label>
                <input
                  id="game-profile-name-input"
                  type="text"
                  placeholder="e.g. Cyberpunk 2077"
                  value={editingGameProfile.name ?? ''}
                  maxLength={64}
                  onChange={(e) => setEditingGameProfile({ ...editingGameProfile, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="game-profile-field">
                <label htmlFor="game-profile-exe-input">Executable Name (.exe)</label>
                <input
                  id="game-profile-exe-input"
                  type="text"
                  placeholder="e.g. Cyberpunk2077.exe"
                  value={editingGameProfile.executableName ?? ''}
                  maxLength={128}
                  onChange={(e) => setEditingGameProfile({ ...editingGameProfile, executableName: e.target.value })}
                />
              </div>
            </div>

            <div className="game-profile-field">
              <div className="game-profile-field-header">
                <label>Select from running games / applications</label>
                <button
                  type="button"
                  className="game-profile-refresh-btn"
                  onClick={() => void refreshRunningProcesses()}
                  title="Scan running processes"
                  disabled={runningProcessesLoading}
                >
                  <RefreshCcw size={13} className={runningProcessesLoading ? 'spin' : ''} />
                  Scan Running Apps
                </button>
              </div>
              {runningProcesses.length > 0 ? (
                <CustomSelect<string>
                  className="game-profile-process-select"
                  ariaLabel="Running applications"
                  floatingMenu
                  value=""
                  options={[
                    ['-- Choose a running application --', ''],
                    ...runningProcesses.map((proc) => [`${proc.name} (${proc.executableName})`, proc.executableName] as [string, string]),
                  ]}
                  onChange={(selectedExe) => {
                    if (!selectedExe) return;
                    const proc = runningProcesses.find((p) => p.executableName.toLowerCase() === selectedExe.toLowerCase());
                    setEditingGameProfile({
                      ...editingGameProfile,
                      executableName: selectedExe,
                      name: editingGameProfile.name?.trim() ? editingGameProfile.name : (proc?.name || selectedExe.replace(/\.exe$/i, ''))
                    });
                  }}
                />
              ) : (
                <span className="game-profile-scan-hint">
                  {runningProcessesLoading ? 'Scanning active processes...' : 'Click "Scan Running Apps" to auto-detect running games.'}
                </span>
              )}
            </div>

            <div className="game-profile-form-grid">
              <div className="game-profile-field">
                <label htmlFor="game-profile-controller-select">Controller Profile</label>
                <CustomSelect<string>
                  id="game-profile-controller-select"
                  ariaLabel="Controller Profile"
                  floatingMenu
                  value={editingGameProfile.controllerProfileId ?? DEFAULT_CONTROLLER_PROFILE_ID}
                  options={snapshot.settings.controllerProfiles.map((profile) => [profile.name, profile.id])}
                  onChange={(value) => setEditingGameProfile({ ...editingGameProfile, controllerProfileId: value })}
                />
              </div>

              <div className="game-profile-field">
                <label htmlFor="game-profile-remap-select">Button Remapping (Optional)</label>
                <CustomSelect<string>
                  id="game-profile-remap-select"
                  ariaLabel="Button Remapping (Optional)"
                  floatingMenu
                  value={editingGameProfile.buttonRemappingProfileId ?? ''}
                  options={[
                    ['(Keep current / None)', ''],
                    ...snapshot.settings.buttonRemappingProfiles.map((profile) => [profile.name, profile.id] as [string, string]),
                  ]}
                  onChange={(value) => setEditingGameProfile({ ...editingGameProfile, buttonRemappingProfileId: value || null })}
                />
              </div>
            </div>

            <div className="game-profile-form-actions">
              <button type="button" className="secondary-action" onClick={closeGameProfileForm}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-action"
                disabled={!editingGameProfile.name?.trim() || !editingGameProfile.executableName?.trim() || pendingAction !== null}
              >
                {editingGameProfile.id ? 'Save Changes' : 'Add Profile'}
              </button>
            </div>
          </form>
        ) : (
          <div className="game-profiles-content">
            {snapshot.settings.gameProfiles.length === 0 ? (
              <div className="game-profiles-empty">
                <IconDeviceGamepad2 size={42} className="game-profiles-empty-icon" />
                <strong>No Game Profiles Configured</strong>
                <p>Map your favorite games to custom controller configurations. When auto-switch is enabled, profiles will switch automatically as games gain focus.</p>
                <button type="button" className="primary-action" onClick={openAddGameProfile}>
                  <Plus size={16} />
                  Add First Game
                </button>
              </div>
            ) : (
              <div className="game-profiles-list">
                {snapshot.settings.gameProfiles.map((profile) => {
                  const isActive = snapshot.activeGame?.matchedProfileId === profile.id
                    || snapshot.activeGame?.executableName?.toLowerCase() === profile.executableName?.toLowerCase();
                  const ctrlProfile = snapshot.settings.controllerProfiles.find((p) => p.id === profile.controllerProfileId);
                  const remapProfile = profile.buttonRemappingProfileId
                    ? snapshot.settings.buttonRemappingProfiles.find((p) => p.id === profile.buttonRemappingProfileId)
                    : null;

                  return (
                    <div key={profile.id} className={`game-profile-item ${isActive ? 'active' : ''}`}>
                      <div className="game-profile-info">
                        <div className="game-profile-title-row">
                          <strong className="game-profile-title">{profile.name}</strong>
                          <code className="game-profile-exe-badge">{profile.executableName}</code>
                          {isActive && (
                            <span className="game-profile-active-badge">
                              <span className="active-dot" />
                              Active Now
                            </span>
                          )}
                        </div>
                        <div className="game-profile-meta-row">
                          <span className="game-profile-meta-tag">
                            <IconDeviceGamepad2 size={13} />
                            {ctrlProfile?.name ?? 'Default Profile'}
                          </span>
                          {remapProfile && (
                            <span className="game-profile-meta-tag">
                              <Settings2 size={13} />
                              {remapProfile.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="game-profile-actions">
                        <button
                          type="button"
                          className="icon-action-button"
                          title="Edit profile"
                          onClick={() => openEditGameProfile(profile)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-action-button danger"
                          title="Delete profile"
                          onClick={() => setGameProfileDeleteConfirmId(profile.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
