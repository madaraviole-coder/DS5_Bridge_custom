import type { CSSProperties } from 'react';

export const TRIGGER_LAB_SLIDER_STEP = 5;
export const TRIGGER_LAB_SLIDER_TICKS = Array.from({ length: 21 }, (_, index) => index * TRIGGER_LAB_SLIDER_STEP);

export function snapTriggerLabPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value / TRIGGER_LAB_SLIDER_STEP) * TRIGGER_LAB_SLIDER_STEP));
}

function sliderTickClass(value: number, max: number): string | undefined {
  if (value === 0 || value === max) {
    return 'milestone endpoint';
  }
  if (value === max / 2) {
    return 'milestone';
  }
  return undefined;
}

export type TriggerLabMeterProps = {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
};

export function TriggerLabMeter({
  label,
  value,
  disabled = false,
  onChange,
  onCommit
}: TriggerLabMeterProps) {
  function commitValue(element: HTMLInputElement) {
    onCommit(snapTriggerLabPercent(Number(element.value)));
  }

  return (
    <div className="range-control trigger-lab-meter">
      <input
        type="range"
        min="0"
        max="100"
        step={TRIGGER_LAB_SLIDER_STEP}
        value={value}
        disabled={disabled}
        aria-label={label}
        style={{ '--range-fill': `${value}%` } as CSSProperties}
        onChange={(event) => onChange(snapTriggerLabPercent(Number(event.currentTarget.value)))}
        onBlur={(event) => commitValue(event.currentTarget)}
        onKeyUp={(event) => commitValue(event.currentTarget)}
        onPointerCancel={(event) => commitValue(event.currentTarget)}
        onPointerUp={(event) => commitValue(event.currentTarget)}
      />
      <div className="range-ticks" aria-hidden="true">
        {TRIGGER_LAB_SLIDER_TICKS.map((tick) => (
          <span key={tick} className={sliderTickClass(tick, 100)} />
        ))}
      </div>
    </div>
  );
}
