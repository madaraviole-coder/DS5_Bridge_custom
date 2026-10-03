import { IconX as X } from '@tabler/icons-react';
import kitsuneInputLogoUrl from '../../assets/kitsune-input-logo.svg';
import psHomeGlyphUrl from '../../../../../assets/glyphs/ps5-buttons-outline-white/svg/Home.svg';

export interface KitsuneBarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KitsuneBarModal({ isOpen, onClose }: KitsuneBarModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="settings-menu bridge-settings-modal kitsune-bar-modal"
        role="dialog"
        aria-modal="true"
        aria-label="DS5 Bar Quick Overlay"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="settings-menu-heading bridge-settings-modal-heading">
          <div className="modal-heading-copy">
            <img src={kitsuneInputLogoUrl} alt="" className="kitsune-card-logo" />
            <span>DS5 Bar Quick Overlay</span>
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
        <div className="kitsune-bar-modal-body">
          <div className="kitsune-bar-badge-hero">
            <span className="shortcut-glyph-key ps-home-large">
              <img src={psHomeGlyphUrl} alt="PS Home" />
            </span>
            <span className="kitsune-bar-badge-hero-text">PS Home Button</span>
          </div>
          <p className="kitsune-bar-info-text">
            Press the <strong>PlayStation Home</strong> button on your controller at any time during gameplay to summon the quick overlay.
          </p>
          <ul className="kitsune-bar-features">
            <li>Instant game profile switching on the fly</li>
            <li>Haptics, trigger intensity, and audio volume sliders</li>
            <li>Live battery status and connection health</li>
            <li>Zero-interruption overlay designed for gamepads</li>
          </ul>
        </div>
        <div className="remap-profile-dialog-actions">
          <button
            type="button"
            className="primary-action"
            onClick={onClose}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
