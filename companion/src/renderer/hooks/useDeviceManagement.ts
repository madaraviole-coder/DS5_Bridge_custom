import { useMemo, useState } from 'react';
import type { BridgeSnapshot } from '../../shared/types';
import {
  buildDevicesModel,
  loadControllerDeviceCache,
  observeControllerDevice,
  renameControllerDevice,
  saveControllerDeviceCache,
  type CachedControllerDevice
} from '../controller-devices';
import type {
  ControllerDeviceForgetDialog,
  ControllerDeviceRenameDialog
} from '../ControllerDevicesPage';

export interface UseDeviceManagementParams {
  snapshot: BridgeSnapshot | null;
  connected: boolean;
  controllerConnected: boolean;
  pendingAction: string | null;
  setPendingAction: (action: string | null) => void;
  applySnapshot: (snapshot: BridgeSnapshot) => void;
}

export function useDeviceManagement({
  snapshot,
  connected,
  controllerConnected,
  pendingAction,
  setPendingAction,
  applySnapshot
}: UseDeviceManagementParams) {
  const [controllerDevices, setControllerDevices] = useState<CachedControllerDevice[]>(() =>
    loadControllerDeviceCache(window.localStorage)
  );
  const [openControllerDeviceMenuKey, setOpenControllerDeviceMenuKey] = useState<string | null>(null);
  const [controllerDeviceRenameDialog, setControllerDeviceRenameDialog] =
    useState<ControllerDeviceRenameDialog | null>(null);
  const [controllerDeviceForgetDialog, setControllerDeviceForgetDialog] =
    useState<ControllerDeviceForgetDialog | null>(null);
  const [controllerDeviceActionError, setControllerDeviceActionError] = useState<string | null>(null);

  const [deviceCleanupConfirmVisible, setDeviceCleanupConfirmVisible] = useState(false);
  const [deviceCleanupMessage, setDeviceCleanupMessage] = useState<string | null>(null);
  const [deviceCleanupError, setDeviceCleanupError] = useState<string | null>(null);
  const [picoFirmwareMessage, setPicoFirmwareMessage] = useState<string | null>(null);
  const [picoFirmwareError, setPicoFirmwareError] = useState<string | null>(null);

  const controllerDevicesModel = useMemo(
    () =>
      buildDevicesModel({
        bridgeConnected: connected,
        status: snapshot?.status ?? null,
        identity: snapshot?.diagnostics.deviceIdentity ?? null,
        cachedDevices: controllerDevices,
        pendingAction
      }),
    [
      connected,
      controllerDevices,
      pendingAction,
      snapshot?.diagnostics.deviceIdentity,
      snapshot?.status
    ]
  );

  const sidebarControllerCard = controllerDevicesModel.cards.find(
    (device) => device.label === 'Current controller'
  ) ?? controllerDevicesModel.cards[0] ?? null;

  async function refreshSnapshotAfterControllerDeviceError() {
    try {
      applySnapshot(await window.bridge.getStatus());
    } catch {
      // Preserve the last usable snapshot when the bridge is no longer reachable.
    }
  }

  async function startControllerPairing() {
    if (controllerDevicesModel.pairingAction.disabled || pendingAction !== null) {
      return;
    }
    setOpenControllerDeviceMenuKey(null);
    setControllerDeviceActionError(null);
    setPendingAction('controller-pairing');
    try {
      applySnapshot(await window.bridge.requestControllerScan());
    } catch (error) {
      setControllerDeviceActionError(
        error instanceof Error ? error.message : 'Controller pairing could not start.'
      );
      await refreshSnapshotAfterControllerDeviceError();
    } finally {
      setPendingAction(null);
    }
  }

  function toggleControllerDeviceMenu(key: string) {
    setOpenControllerDeviceMenuKey((current) => (current === key ? null : key));
  }

  function openControllerDeviceRename(key: string) {
    const device = controllerDevicesModel.cards.find((candidate) => candidate.key === key);
    if (!device) {
      return;
    }
    setOpenControllerDeviceMenuKey(null);
    setControllerDeviceActionError(null);
    setControllerDeviceRenameDialog({
      key,
      title: device.title,
      value: device.title
    });
  }

  function confirmControllerDeviceRename() {
    const request = controllerDeviceRenameDialog;
    const nextName = request?.value.trim() ?? '';
    if (!request || !nextName) {
      return;
    }
    let baseDevices = controllerDevices;
    if (
      !baseDevices.some((device) => device.key === request.key) &&
      connected &&
      snapshot?.status?.controllerConnected
    ) {
      baseDevices = observeControllerDevice(
        baseDevices,
        snapshot.status,
        snapshot.diagnostics.deviceIdentity
      );
    }
    const nextDevices = renameControllerDevice(baseDevices, request.key, nextName);
    setControllerDevices(nextDevices);
    if (!saveControllerDeviceCache(window.localStorage, nextDevices)) {
      setControllerDeviceActionError('The controller name could not be saved to local storage.');
    }
    setControllerDeviceRenameDialog(null);
  }

  function openControllerDeviceForgetAll() {
    if (controllerDevicesModel.forgetAllAction.disabled) {
      return;
    }
    setOpenControllerDeviceMenuKey(null);
    setControllerDeviceActionError(null);
    setControllerDeviceForgetDialog({ kind: 'all' });
  }

  function openControllerDeviceForgetOne(key: string) {
    const device = controllerDevicesModel.cards.find((candidate) => candidate.key === key);
    if (!device?.bluetoothAddress || device.forgetDisabled) {
      return;
    }
    setOpenControllerDeviceMenuKey(null);
    setControllerDeviceActionError(null);
    setControllerDeviceForgetDialog({
      kind: 'controller',
      key,
      title: device.title,
      bluetoothAddress: device.bluetoothAddress
    });
  }

  function closeControllerDeviceForget() {
    if (pendingAction === 'controller-forget-all' || pendingAction === 'controller-forget-one') {
      return;
    }
    setControllerDeviceForgetDialog(null);
    setControllerDeviceActionError(null);
  }

  async function confirmControllerDeviceForget() {
    const request = controllerDeviceForgetDialog;
    if (!request || !connected || pendingAction !== null) {
      return;
    }
    const actionLabel = request.kind === 'all' ? 'controller-forget-all' : 'controller-forget-one';
    setControllerDeviceActionError(null);
    setPendingAction(actionLabel);
    try {
      const nextSnapshot =
        request.kind === 'all'
          ? await window.bridge.forgetControllerPairings()
          : await window.bridge.forgetControllerPairing(request.bluetoothAddress);
      applySnapshot(nextSnapshot);
      setControllerDevices((current) => {
        const nextDevices =
          request.kind === 'all' ? [] : current.filter((device) => device.key !== request.key);
        saveControllerDeviceCache(window.localStorage, nextDevices);
        return nextDevices;
      });
      setControllerDeviceForgetDialog(null);
    } catch (error) {
      setControllerDeviceActionError(
        error instanceof Error ? error.message : 'The controller pairing could not be forgotten.'
      );
      await refreshSnapshotAfterControllerDeviceError();
    } finally {
      setPendingAction(null);
    }
  }

  function openDeviceCleanupConfirm() {
    setDeviceCleanupMessage(null);
    setDeviceCleanupError(null);
    setDeviceCleanupConfirmVisible(true);
  }

  function closeDeviceCleanupConfirm() {
    if (pendingAction === 'device-cleanup') {
      return;
    }
    setDeviceCleanupConfirmVisible(false);
  }

  async function runWindowsDeviceCleanup() {
    if (!snapshot || pendingAction) {
      return;
    }
    setDeviceCleanupMessage(null);
    if (controllerConnected) {
      setDeviceCleanupError('Disconnect the controller from the bridge before running emergency repair.');
      return;
    }

    setPendingAction('device-cleanup');
    setDeviceCleanupError(null);
    try {
      const result = await window.bridge.repairWindowsDeviceCache();
      setDeviceCleanupMessage(result.message);
    } catch (error) {
      setDeviceCleanupError(error instanceof Error ? error.message : 'Emergency device repair could not run.');
    } finally {
      try {
        applySnapshot(await window.bridge.getStatus());
      } catch {
        // Keep the existing snapshot if status refresh fails after the repair process.
      }
      setPendingAction(null);
    }
  }

  async function runPicoFirmwareAction(
    label: string,
    action: () => Promise<{ ok: boolean; cancelled?: boolean; message: string }>
  ) {
    if (pendingAction !== null) {
      return;
    }
    setPendingAction(label);
    setPicoFirmwareMessage(null);
    setPicoFirmwareError(null);
    try {
      const result = await action();
      if (!result.cancelled) {
        if (result.ok) {
          setPicoFirmwareMessage(result.message);
        } else {
          setPicoFirmwareError(result.message);
        }
      }
    } catch (error) {
      setPicoFirmwareError(error instanceof Error ? error.message : 'Firmware update failed.');
    } finally {
      try {
        applySnapshot(await window.bridge.getStatus());
      } catch {
        // Keep the existing snapshot if status refresh fails.
      }
      setPendingAction(null);
    }
  }

  return {
    controllerDevices,
    setControllerDevices,
    openControllerDeviceMenuKey,
    setOpenControllerDeviceMenuKey,
    controllerDeviceRenameDialog,
    setControllerDeviceRenameDialog,
    controllerDeviceForgetDialog,
    setControllerDeviceForgetDialog,
    controllerDeviceActionError,
    setControllerDeviceActionError,
    deviceCleanupConfirmVisible,
    setDeviceCleanupConfirmVisible,
    deviceCleanupMessage,
    setDeviceCleanupMessage,
    deviceCleanupError,
    setDeviceCleanupError,
    picoFirmwareMessage,
    setPicoFirmwareMessage,
    picoFirmwareError,
    setPicoFirmwareError,
    controllerDevicesModel,
    sidebarControllerCard,
    startControllerPairing,
    toggleControllerDeviceMenu,
    openControllerDeviceRename,
    confirmControllerDeviceRename,
    openControllerDeviceForgetAll,
    openControllerDeviceForgetOne,
    closeControllerDeviceForget,
    confirmControllerDeviceForget,
    openDeviceCleanupConfirm,
    closeDeviceCleanupConfirm,
    runWindowsDeviceCleanup,
    runPicoFirmwareAction
  };
}
