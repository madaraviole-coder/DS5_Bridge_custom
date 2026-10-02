import { useState } from 'react';
import type { GameProfile, RunningProcessInfo } from '../../shared/types';
import { DEFAULT_CONTROLLER_PROFILE_ID } from '../../shared/protocol';

export interface UseGameProfilesStateParams {
  selectedControllerProfileId: string;
  selectedRemapProfileId: string;
  runAction: (name: string, fn: () => Promise<any>) => Promise<any>;
}

export function useGameProfilesState({
  selectedControllerProfileId,
  selectedRemapProfileId,
  runAction
}: UseGameProfilesStateParams) {
  const [isGameProfilesModalOpen, setIsGameProfilesModalOpen] = useState(false);
  const [editingGameProfile, setEditingGameProfile] = useState<Partial<GameProfile> | null>(null);
  const [gameProfileDeleteConfirmId, setGameProfileDeleteConfirmId] = useState<string | null>(null);
  const [runningProcesses, setRunningProcesses] = useState<RunningProcessInfo[]>([]);
  const [runningProcessesLoading, setRunningProcessesLoading] = useState(false);

  async function refreshRunningProcesses() {
    setRunningProcessesLoading(true);
    try {
      const list = await window.bridge.getRunningProcesses();
      setRunningProcesses(list);
    } catch (err) {
      console.error('Failed to get running processes', err);
    } finally {
      setRunningProcessesLoading(false);
    }
  }

  function openAddGameProfile() {
    setEditingGameProfile({
      name: '',
      executableName: '',
      controllerProfileId: selectedControllerProfileId,
      buttonRemappingProfileId: selectedRemapProfileId
    });
    void refreshRunningProcesses();
  }

  function openEditGameProfile(profile: GameProfile) {
    setEditingGameProfile({ ...profile });
    void refreshRunningProcesses();
  }

  function closeGameProfileForm() {
    setEditingGameProfile(null);
  }

  async function saveCurrentGameProfile() {
    if (
      !editingGameProfile ||
      !editingGameProfile.name?.trim() ||
      !editingGameProfile.executableName?.trim()
    ) {
      return;
    }
    const candidate: GameProfile = {
      id: editingGameProfile.id || '',
      name: editingGameProfile.name.trim(),
      executableName: editingGameProfile.executableName.trim(),
      controllerProfileId: editingGameProfile.controllerProfileId || DEFAULT_CONTROLLER_PROFILE_ID,
      buttonRemappingProfileId: editingGameProfile.buttonRemappingProfileId || null
    };

    if (candidate.id) {
      await runAction('update-game-profile', () => window.bridge.updateGameProfile(candidate));
    } else {
      await runAction('save-game-profile', () => window.bridge.saveGameProfile(candidate));
    }
    setEditingGameProfile(null);
  }

  async function confirmDeleteGameProfile(id: string) {
    await runAction('delete-game-profile', () => window.bridge.deleteGameProfile(id));
    setGameProfileDeleteConfirmId(null);
  }

  return {
    isGameProfilesModalOpen,
    setIsGameProfilesModalOpen,
    editingGameProfile,
    setEditingGameProfile,
    gameProfileDeleteConfirmId,
    setGameProfileDeleteConfirmId,
    runningProcesses,
    setRunningProcesses,
    runningProcessesLoading,
    refreshRunningProcesses,
    openAddGameProfile,
    openEditGameProfile,
    closeGameProfileForm,
    saveCurrentGameProfile,
    confirmDeleteGameProfile
  };
}
