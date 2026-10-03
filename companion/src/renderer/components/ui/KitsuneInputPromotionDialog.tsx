import {
  IconArrowRight as ArrowRight,
  IconExternalLink,
  IconEyeOff,
  IconX as X
} from '@tabler/icons-react';
import kitsuneInputLogoUrl from '../../assets/kitsune-input-logo.svg';

export function KitsuneInputWordmark() {
  return (
    <span className="kitsune-promotion-wordmark" aria-label="DS5 Bridge">
      <span className="kitsune-promotion-wordmark-kitsune">DS5</span>
      <span className="kitsune-promotion-wordmark-input">Bridge</span>
    </span>
  );
}

export type KitsuneInputPromotionDialogProps = {
  dismissing: boolean;
  onClose(): void;
  onDismissForever(): void;
  onLearnMore(): void;
  onPurchase(): void;
};

export function KitsuneInputPromotionDialog({
  dismissing,
  onClose,
  onDismissForever,
  onLearnMore,
  onPurchase
}: KitsuneInputPromotionDialogProps) {
  return (
    <div className="modal-backdrop kitsune-promotion-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-menu kitsune-promotion-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kitsune-promotion-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close-button kitsune-promotion-close"
          type="button"
          aria-label="Close DS5 Bridge promotion"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <header className="kitsune-promotion-hero">
          <img className="kitsune-promotion-hero-logo" src={kitsuneInputLogoUrl} alt="" />
          <div className="kitsune-promotion-hero-copy">
            <KitsuneInputWordmark />
            <h2 id="kitsune-promotion-title">Take controller customization further</h2>
            <p>Deeper tuning, smarter profiles, and controller-first tools.</p>
          </div>
        </header>

        <div className="kitsune-promotion-feature-grid">
          <article className="kitsune-promotion-feature-card">
            <div className="kitsune-promotion-feature-kicker">
              <strong>Tuning &amp; Compatibility</strong>
            </div>
            <ul>
              <li>Advanced Stick Tuning</li>
              <li>Advanced Trigger Tuning</li>
              <li>More Personas: XSX + Impulse Triggers</li>
              <li>NS Pro Support · DS4 in v1.1.1</li>
              <li>Gyro Aim</li>
              <li>Touchpad Gestures</li>
            </ul>
          </article>

          <article className="kitsune-promotion-feature-card">
            <div className="kitsune-promotion-feature-kicker">
              <strong>Profiles &amp; Tools</strong>
            </div>
            <ul>
              <li>Per-game Profiles</li>
              <li>Multi-Actions</li>
              <li>Automatic Game Library</li>
              <li>Kitsune Game Bar</li>
              <li>Kitsune Cursor &amp; Keyboard</li>
              <li>Mod API</li>
            </ul>
          </article>
        </div>

        <footer className="kitsune-promotion-actions">
          <button type="button" className="primary-action" onClick={onPurchase}>
            <IconExternalLink size={16} />
            Purchase
          </button>
          <button type="button" className="secondary-action kitsune-promotion-learn" onClick={onLearnMore}>
            Learn More
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            className="secondary-action kitsune-promotion-dismiss"
            disabled={dismissing}
            onClick={onDismissForever}
          >
            <IconEyeOff size={16} />
            {dismissing ? 'Dismissing…' : "Don't show DS5 Bridge promotions again"}
          </button>
        </footer>
      </section>
    </div>
  );
}
