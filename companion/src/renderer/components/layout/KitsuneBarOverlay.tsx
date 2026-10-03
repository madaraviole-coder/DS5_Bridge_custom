import { useEffect, useState } from 'react';
import {
  IconDeviceGamepad2,
  IconSparkles,
  IconVolume,
  IconX,
  IconMinus,
  IconCpu
} from '@tabler/icons-react';
import type { BridgeSnapshot } from '../../../shared/types';
import kitsuneInputLogoUrl from '../../assets/kitsune-input-logo.svg';
import { batteryLabel, controllerName } from '../../utils/controller-status';

export function KitsuneBarOverlay() {
  const [snapshot, setSnapshot] = useState<BridgeSnapshot | null>(null);
  const [haptics, setHaptics] = useState(100);
  const [volume, setVolume] = useState(100);

  useEffect(() => {
    let unmounted = false;
    void window.bridge.getStatus().then((s) => {
      if (!unmounted && s) {
        setSnapshot(s);
        setHaptics(s.settings.hapticsGainPercent);
        setVolume(s.settings.speakerVolumePercent);
      }
    });

    const unsubscribe = window.bridge.onSnapshot((s) => {
      if (!unmounted && s) {
        setSnapshot(s);
        setHaptics(s.settings.hapticsGainPercent);
        setVolume(s.settings.speakerVolumePercent);
      }
    });

    return () => {
      unmounted = true;
      unsubscribe();
    };
  }, []);

  const handleClose = () => {
    void window.bridge.toggleKitsuneBar();
  };

  const handleHapticsChange = (val: number) => {
    setHaptics(val);
    void window.bridge.setHapticsGain(val);
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    void window.bridge.setSpeakerVolume(val);
  };

  const connected = Boolean(snapshot?.status?.controllerConnected);
  const activeProfile = snapshot?.settings.controllerProfiles.find(
    (p) => p.id === snapshot.settings.selectedControllerProfileId
  )?.name ?? 'Default';

  return (
    <div className="kitsune-bar-overlay-root">
      <div className="kitsune-bar-overlay-bar">
        <div className="kitsune-bar-drag-handle" title="Drag overlay">
          <img src={kitsuneInputLogoUrl} alt="DS5 Bar" className="kitsune-bar-logo" />
          <span className="kitsune-bar-title">DS5 Bar</span>
        </div>

        <div className="kitsune-bar-section status-section">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span className="controller-label">
            {connected ? controllerName(snapshot?.status?.controllerType) : 'Offline'}
          </span>
          {connected && (
            <span className="battery-badge">{batteryLabel(snapshot)}</span>
          )}
        </div>

        <div className="kitsune-bar-section profile-section">
          <IconCpu size={14} />
          <span className="profile-label" title={`Active Profile: ${activeProfile}`}>
            {activeProfile}
          </span>
        </div>

        <div className="kitsune-bar-section sliders-section">
          <div className="mini-slider-group" title={`Haptics: ${haptics}%`}>
            <IconSparkles size={14} />
            <input
              type="range"
              min="0"
              max="150"
              step="10"
              value={haptics}
              onChange={(e) => handleHapticsChange(Number(e.target.value))}
            />
            <span>{haptics}%</span>
          </div>

          <div className="mini-slider-group" title={`Speaker: ${volume}%`}>
            <IconVolume size={14} />
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
            />
            <span>{volume}%</span>
          </div>
        </div>

        <div className="kitsune-bar-actions">
          <button
            type="button"
            className="kitsune-bar-btn"
            onClick={handleClose}
            title="Minimize Overlay"
          >
            <IconMinus size={14} />
          </button>
          <button
            type="button"
            className="kitsune-bar-btn close-btn"
            onClick={handleClose}
            title="Close Overlay"
          >
            <IconX size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
