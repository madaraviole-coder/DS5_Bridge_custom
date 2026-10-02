import type { Dispatch, SetStateAction } from 'react';
import type { BridgeSnapshot, GameProfile, RunningProcessInfo } from '../../../shared/types';
import type { ChordFunction } from '../../../shared/protocol';
import type {
  ChordFunctionDialogState,
  ControllerProfileDialogMode,
  RemapProfileDialogMode,
  TriggerLabDraft,
  TriggerLabProfileDialogState,
  TriggerLabProfileId,
  TriggerLabSide
} from '../../types/app-types';
import type { SettingsFocusTarget } from '../ui/FeatureTipsPanel';
import { KitsuneInputPromotionDialog } from '../ui/KitsuneInputPromotionDialog';
import { StartupTutorial, type StartupTutorialStep } from '../ui/StartupTutorial';
import { DeviceCleanupConfirmModal } from './DeviceCleanupConfirmModal';
import { ChordFunctionModal } from './ChordFunctionModal';
import { ProfileDialogModal } from './ProfileDialogModal';
import { GameProfilesModal } from './GameProfilesModal';
import { GameProfileDeleteModal } from './GameProfileDeleteModal';
import { KitsuneBarModal } from './KitsuneBarModal';
import { BridgeSettingsPreferencesModal } from './BridgeSettingsPreferencesModal';
import { KITSUNE_INPUT_PURCHASE_URL, KITSUNE_INPUT_URL } from '../../constants/app-constants';

export interface AppModalsProps {
  snapshot: BridgeSnapshot | null;
  connected: boolean;
  pendingAction: string | null;
  runAction: (name: string, fn: () => Promise<any>) => Promise<any>;

  // Kitsune Input Promotion
  showKitsuneInputPromotion: boolean;
  setShowKitsuneInputPromotion: (show: boolean) => void;

  // Startup Tutorial
  startupTutorialStep: StartupTutorialStep;
  setStartupTutorialStep: (step: StartupTutorialStep) => void;
  startupTutorialFeatureActive: boolean;
  setStartupTutorialFeatureActive: Dispatch<SetStateAction<boolean>>;
  startupTutorialSupportCountdown: number;
  kofiBadgeUrl: string;
  saveStartupTutorialCompleted: () => void;

  // Device Cleanup
  deviceCleanupConfirmVisible: boolean;
  controllerConnected: boolean;
  deviceCleanupError: string | null;
  deviceCleanupMessage: string | null;
  closeDeviceCleanupConfirm: () => void;
  runWindowsDeviceCleanup: () => void;

  // Chord Function Modal
  chordFunctionDialog: ChordFunctionDialogState | null;
  chordFunctionDialogFunction: ChordFunction | null;
  chordFunctionNameDraft: string;
  setChordFunctionNameDraft: (draft: string) => void;
  closeChordFunctionDialog: () => void;
  submitChordFunctionDialog: () => void;

  // Trigger Lab Profile Modal
  triggerLabProfileDialog: TriggerLabProfileDialogState | null;
  triggerLabProfileNameDraft: string;
  setTriggerLabProfileNameDraft: (draft: string) => void;
  closeTriggerLabProfileDialog: () => void;
  submitTriggerLabProfileDialog: () => void;
  triggerLabDrafts: Record<TriggerLabSide, TriggerLabDraft>;
  triggerLabProfileName: (id: TriggerLabProfileId) => string;

  // Remap Profile Modal
  remapProfileDialogMode: RemapProfileDialogMode | null;
  remapProfileNameDraft: string;
  setRemapProfileNameDraft: (draft: string) => void;
  closeRemapProfileDialog: () => void;
  submitRemapProfileDialog: () => void;
  selectedRemapProfile: { id: string; name: string } | null | undefined;

  // Controller Profile Modal
  controllerProfileDialogMode: ControllerProfileDialogMode | null;
  controllerProfileNameDraft: string;
  setControllerProfileNameDraft: (draft: string) => void;
  closeControllerProfileDialog: () => void;
  submitControllerProfileDialog: () => void;
  selectedControllerProfile: { id: string; name: string } | null | undefined;

  // Game Profiles Modal
  isGameProfilesModalOpen: boolean;
  setIsGameProfilesModalOpen: (open: boolean) => void;
  editingGameProfile: Partial<GameProfile> | null;
  setEditingGameProfile: (profile: Partial<GameProfile> | null) => void;
  gameProfileDeleteConfirmId: string | null;
  setGameProfileDeleteConfirmId: (id: string | null) => void;
  runningProcesses: RunningProcessInfo[];
  runningProcessesLoading: boolean;
  refreshRunningProcesses: () => Promise<void>;
  openAddGameProfile: () => void;
  openEditGameProfile: (profile: GameProfile) => void;
  closeGameProfileForm: () => void;
  saveCurrentGameProfile: () => Promise<void>;
  confirmDeleteGameProfile: (id: string) => Promise<void>;

  // Kitsune Bar Modal
  isKitsuneBarInfoOpen: boolean;
  setIsKitsuneBarInfoOpen: (open: boolean) => void;

  // Bridge Settings Modal
  showBridgeSettings: boolean;
  setShowBridgeSettings: (show: boolean) => void;
  usbSuspendDisconnectSupported: boolean;
  wakeOnConnectSupported: boolean;
  sleepControllerSupported: boolean;
  settingsFocusTarget: SettingsFocusTarget | null;
  picoFirmwareMessage: string | null;
  picoFirmwareError: string | null;
  nukePicoFlash: () => void;
  mountPicoBootloader: () => void;
  flashPicoFirmware: () => void;
}

export function AppModals({
  snapshot,
  connected,
  pendingAction,
  runAction,
  showKitsuneInputPromotion,
  setShowKitsuneInputPromotion,
  startupTutorialStep,
  setStartupTutorialStep,
  startupTutorialFeatureActive,
  setStartupTutorialFeatureActive,
  startupTutorialSupportCountdown,
  kofiBadgeUrl,
  saveStartupTutorialCompleted,
  deviceCleanupConfirmVisible,
  controllerConnected,
  deviceCleanupError,
  deviceCleanupMessage,
  closeDeviceCleanupConfirm,
  runWindowsDeviceCleanup,
  chordFunctionDialog,
  chordFunctionDialogFunction,
  chordFunctionNameDraft,
  setChordFunctionNameDraft,
  closeChordFunctionDialog,
  submitChordFunctionDialog,
  triggerLabProfileDialog,
  triggerLabProfileNameDraft,
  setTriggerLabProfileNameDraft,
  closeTriggerLabProfileDialog,
  submitTriggerLabProfileDialog,
  triggerLabDrafts,
  triggerLabProfileName,
  remapProfileDialogMode,
  remapProfileNameDraft,
  setRemapProfileNameDraft,
  closeRemapProfileDialog,
  submitRemapProfileDialog,
  selectedRemapProfile,
  controllerProfileDialogMode,
  controllerProfileNameDraft,
  setControllerProfileNameDraft,
  closeControllerProfileDialog,
  submitControllerProfileDialog,
  selectedControllerProfile,
  isGameProfilesModalOpen,
  setIsGameProfilesModalOpen,
  editingGameProfile,
  setEditingGameProfile,
  gameProfileDeleteConfirmId,
  setGameProfileDeleteConfirmId,
  runningProcesses,
  runningProcessesLoading,
  refreshRunningProcesses,
  openAddGameProfile,
  openEditGameProfile,
  closeGameProfileForm,
  saveCurrentGameProfile,
  confirmDeleteGameProfile,
  isKitsuneBarInfoOpen,
  setIsKitsuneBarInfoOpen,
  showBridgeSettings,
  setShowBridgeSettings,
  usbSuspendDisconnectSupported,
  wakeOnConnectSupported,
  sleepControllerSupported,
  settingsFocusTarget,
  picoFirmwareMessage,
  picoFirmwareError,
  nukePicoFlash,
  mountPicoBootloader,
  flashPicoFirmware
}: AppModalsProps) {
  if (!snapshot) return null;

  return (
    <>
      {showKitsuneInputPromotion && !snapshot.settings.kitsuneInputPromotionDismissed && (
        <KitsuneInputPromotionDialog
          dismissing={pendingAction === 'dismiss-kitsune-input-promotion'}
          onClose={() => setShowKitsuneInputPromotion(false)}
          onPurchase={() => void window.bridge.openExternal(KITSUNE_INPUT_PURCHASE_URL)}
          onLearnMore={() => void window.bridge.openExternal(KITSUNE_INPUT_URL)}
          onDismissForever={() => {
            setShowKitsuneInputPromotion(false);
            void runAction(
              'dismiss-kitsune-input-promotion',
              () => window.bridge.setKitsuneInputPromotionDismissed(true)
            );
          }}
        />
      )}

      {startupTutorialStep !== 'done' && (
        <StartupTutorial
          step={startupTutorialStep}
          featureExampleActive={startupTutorialFeatureActive}
          supportCountdown={startupTutorialSupportCountdown}
          kofiBadgeUrl={kofiBadgeUrl}
          onFeatureExampleToggle={() => setStartupTutorialFeatureActive((active) => !active)}
          onFeatureStepComplete={() => setStartupTutorialStep('support')}
          onSupport={() => void window.bridge.openExternal('https://ko-fi.com/sundaymoments')}
          onFinish={() => {
            saveStartupTutorialCompleted();
            setStartupTutorialStep('done');
          }}
        />
      )}

      <DeviceCleanupConfirmModal
        isOpen={deviceCleanupConfirmVisible}
        pendingAction={pendingAction}
        controllerConnected={controllerConnected}
        deviceCleanupError={deviceCleanupError}
        deviceCleanupMessage={deviceCleanupMessage}
        onClose={closeDeviceCleanupConfirm}
        onConfirm={runWindowsDeviceCleanup}
      />

      <ChordFunctionModal
        dialog={chordFunctionDialog}
        targetFunction={chordFunctionDialogFunction}
        nameDraft={chordFunctionNameDraft}
        setNameDraft={setChordFunctionNameDraft}
        pendingAction={pendingAction}
        onClose={closeChordFunctionDialog}
        onSubmit={submitChordFunctionDialog}
      />

      <ProfileDialogModal
        isOpen={Boolean(triggerLabProfileDialog)}
        mode={triggerLabProfileDialog?.mode ?? null}
        titleSave="Save Trigger Profile"
        titleRename="Rename Trigger Profile"
        titleDelete="Delete Trigger Profile"
        ariaLabel="Trigger Lab profile"
        targetName={triggerLabProfileDialog ? triggerLabProfileName(triggerLabDrafts[triggerLabProfileDialog.side].profileId) : undefined}
        nameDraft={triggerLabProfileNameDraft}
        setNameDraft={setTriggerLabProfileNameDraft}
        pendingAction={pendingAction}
        onClose={closeTriggerLabProfileDialog}
        onSubmit={submitTriggerLabProfileDialog}
      />

      <ProfileDialogModal
        isOpen={Boolean(remapProfileDialogMode)}
        mode={remapProfileDialogMode}
        titleSave="Save New Profile"
        titleRename="Rename Profile"
        titleDelete="Delete Profile"
        ariaLabel="Button remapping profile"
        targetName={selectedRemapProfile?.name ?? 'this profile'}
        nameDraft={remapProfileNameDraft}
        setNameDraft={setRemapProfileNameDraft}
        pendingAction={pendingAction}
        onClose={closeRemapProfileDialog}
        onSubmit={submitRemapProfileDialog}
      />

      <ProfileDialogModal
        isOpen={Boolean(controllerProfileDialogMode)}
        mode={controllerProfileDialogMode}
        titleSave="Save New Profile"
        titleRename="Rename Profile"
        titleDelete="Delete Profile"
        ariaLabel="System profile"
        targetName={selectedControllerProfile?.name ?? 'this profile'}
        nameDraft={controllerProfileNameDraft}
        setNameDraft={setControllerProfileNameDraft}
        pendingAction={pendingAction}
        onClose={closeControllerProfileDialog}
        onSubmit={submitControllerProfileDialog}
      />

      <GameProfilesModal
        isOpen={isGameProfilesModalOpen}
        editingGameProfile={editingGameProfile}
        setEditingGameProfile={setEditingGameProfile}
        snapshot={snapshot}
        pendingAction={pendingAction}
        runAction={runAction}
        openAddGameProfile={openAddGameProfile}
        openEditGameProfile={openEditGameProfile}
        closeGameProfileForm={closeGameProfileForm}
        saveCurrentGameProfile={saveCurrentGameProfile}
        refreshRunningProcesses={refreshRunningProcesses}
        runningProcessesLoading={runningProcessesLoading}
        runningProcesses={runningProcesses}
        setGameProfileDeleteConfirmId={setGameProfileDeleteConfirmId}
        onClose={() => {
          setIsGameProfilesModalOpen(false);
          setEditingGameProfile(null);
        }}
      />

      <GameProfileDeleteModal
        deleteConfirmId={gameProfileDeleteConfirmId}
        pendingAction={pendingAction}
        onClose={() => setGameProfileDeleteConfirmId(null)}
        onConfirm={confirmDeleteGameProfile}
      />

      <KitsuneBarModal
        isOpen={isKitsuneBarInfoOpen}
        onClose={() => setIsKitsuneBarInfoOpen(false)}
      />

      <BridgeSettingsPreferencesModal
        isOpen={showBridgeSettings}
        onClose={() => setShowBridgeSettings(false)}
        snapshot={snapshot}
        connected={connected}
        pendingAction={pendingAction}
        runAction={runAction}
        usbSuspendDisconnectSupported={usbSuspendDisconnectSupported}
        wakeOnConnectSupported={wakeOnConnectSupported}
        sleepControllerSupported={sleepControllerSupported}
        settingsFocusTarget={settingsFocusTarget}
        picoFirmwareMessage={picoFirmwareMessage}
        picoFirmwareError={picoFirmwareError}
        nukePicoFlash={nukePicoFlash}
        mountPicoBootloader={mountPicoBootloader}
        flashPicoFirmware={flashPicoFirmware}
      />
    </>
  );
}
