import { useEffect, useState } from 'react';
import { IconQuestionMark } from '@tabler/icons-react';
import type { ChordStarterId, RemapButtonId } from '../../../shared/protocol';
import type { TouchpadZoneTarget } from '../../../shared/touchpad-gestures';
import type { UiThemePreset } from '../../../shared/types';
import { UI_THEME_PREVIEW_SWATCHES } from '../../ui-themes';
import {
  CHORD_STARTERS,
  REMAP_BUTTONS
} from '../../constants/app-constants';
import {
  CHORD_UNASSIGNED_BUTTON,
  type ChordButtonSelectValue,
  type RemapButtonDefinition
} from '../../types/app-types';

export function UptimeCounter({
  active,
  lastPollAt,
  uptimeSeconds
}: {
  active: boolean;
  lastPollAt: number | null;
  uptimeSeconds: number | null;
}) {
  const [displayUptime, setDisplayUptime] = useState<number | null>(uptimeSeconds);

  useEffect(() => {
    if (!active || !lastPollAt || uptimeSeconds === null) {
      setDisplayUptime(uptimeSeconds);
      return;
    }

    const updateUptime = () => {
      const elapsedSeconds = Math.floor((Date.now() - lastPollAt) / 1000);
      setDisplayUptime(uptimeSeconds + Math.max(0, elapsedSeconds));
    };

    updateUptime();
    const handle = window.setInterval(updateUptime, 1000);
    return () => window.clearInterval(handle);
  }, [active, lastPollAt, uptimeSeconds]);

  return <span className="uptime-value">{displayUptime ?? '--'}s</span>;
}

export function RemapGlyphOption({ label, value }: { label: string; value: RemapButtonId }) {
  const button = REMAP_BUTTONS[value];

  return (
    <span className="remap-glyph-option" title={label}>
      {button.glyphUrl ? (
        <img src={button.glyphUrl} alt={label} />
      ) : (
        <span className="remap-text-glyph" aria-hidden="true">
          {button.textGlyph ?? button.label}
        </span>
      )}
    </span>
  );
}

export function TouchpadZoneTargetOption({
  label,
  value
}: {
  label: string;
  value: TouchpadZoneTarget;
}) {
  if (value === 'touchpad') {
    return (
      <span
        className="remap-glyph-option"
        title={label}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <span className="remap-text-glyph" aria-hidden="true">
          CLICK
        </span>
        <span>{label}</span>
      </span>
    );
  }
  if (value === 'none') {
    return (
      <span
        className="remap-glyph-option"
        title={label}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <span className="remap-text-glyph" aria-hidden="true">
          —
        </span>
        <span>{label}</span>
      </span>
    );
  }

  const button = (REMAP_BUTTONS as Record<string, RemapButtonDefinition | undefined>)[value];
  if (!button) return <span>{label}</span>;

  return (
    <span
      className="remap-glyph-option"
      title={label}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
    >
      {button.glyphUrl ? (
        <img src={button.glyphUrl} alt={label} />
      ) : (
        <span className="remap-text-glyph" aria-hidden="true">
          {button.textGlyph ?? button.label}
        </span>
      )}
      <span>{button.label}</span>
    </span>
  );
}

export function IconTouchpadHand({
  size = 20,
  className = ''
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 13V4.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M11 11.5v-2a1.5 1.5 0 0 1 3 0V12" />
      <path d="M14 10.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M17 11.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2a6 6 0 0 1-4.24-1.76l-3.8-3.8a1.5 1.5 0 0 1 2.12-2.12L8 16" />
    </svg>
  );
}

export function RemapSourceGlyph({ button }: { button: RemapButtonDefinition }) {
  return button.glyphUrl ? (
    <img src={button.glyphUrl} alt={button.label} title={button.label} />
  ) : (
    <span className="remap-text-glyph remap-text-glyph-source" title={button.label}>
      {button.textGlyph ?? button.label}
    </span>
  );
}

export function ChordStarterGlyph({
  starter,
  label = CHORD_STARTERS[starter].label
}: {
  starter: ChordStarterId;
  label?: string;
}) {
  const button = CHORD_STARTERS[starter];
  const Icon = button.Icon;

  return Icon ? (
    <span className="chords-unassigned-glyph chords-starter-icon-glyph" title={label} aria-label={label}>
      <Icon size={18} />
    </span>
  ) : button.glyphUrl ? (
    <img src={button.glyphUrl} alt={label} title={label} />
  ) : (
    <span className="remap-text-glyph remap-text-glyph-source" title={label}>
      {button.textGlyph ?? button.label}
    </span>
  );
}

export function ChordStarterGlyphOption({
  label,
  value
}: {
  label: string;
  value: ChordStarterId;
}) {
  return (
    <span className="chords-starter-glyph-option" title={label}>
      <ChordStarterGlyph starter={value} label={label} />
    </span>
  );
}

export function ChordButtonGlyphOption({
  label,
  value
}: {
  label: string;
  value: ChordButtonSelectValue;
}) {
  if (value === CHORD_UNASSIGNED_BUTTON) {
    return (
      <span className="chords-unassigned-glyph" title={label} aria-label={label}>
        <IconQuestionMark size={16} />
      </span>
    );
  }

  return <RemapGlyphOption label={label} value={value} />;
}

export function ThemeOption({ label, value }: { label: string; value: UiThemePreset }) {
  return (
    <span className="theme-option">
      <span className="theme-option-swatches" aria-hidden="true">
        {UI_THEME_PREVIEW_SWATCHES[value].map((swatch) => (
          <span key={`${value}-${swatch.role}`} title={swatch.role} style={{ background: swatch.color }} />
        ))}
      </span>
      <span className="theme-option-label">{label}</span>
    </span>
  );
}
