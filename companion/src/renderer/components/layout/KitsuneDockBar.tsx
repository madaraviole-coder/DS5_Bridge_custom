import type { ReactNode } from 'react';
import { IconChevronDown, IconChevronUp, IconCopy, IconHome, IconPower, IconX } from '@tabler/icons-react';
import psHomeGlyphUrl from '../../../../../assets/glyphs/ps5-buttons-outline-white/svg/Home.svg';

export interface KitsuneDockBarItem {
  id: string;
  name: string;
  icon: string;
}

export interface KitsuneDockBarProps {
  variant: 'overlay' | 'preview';
  layerItems: KitsuneDockBarItem[];
  focusedIndex: number;
  activeFlyout: string | null;
  activeLayer: number;
  totalLayers: number;
  batteryPctText: string;
  isCharging: boolean;
  renderIcon: (iconName: string, size?: number) => ReactNode;
  onHome?: () => void;
  onProfiles?: () => void;
  onPs?: () => void;
  onModuleClick?: (id: string, index: number) => void;
  onLayerUp?: () => void;
  onLayerDown?: () => void;
  onSleep?: () => void;
  onClose?: () => void;
}

export function KitsuneDockBar({
  variant,
  layerItems,
  focusedIndex,
  activeFlyout,
  activeLayer,
  totalLayers,
  batteryPctText,
  isCharging,
  renderIcon,
  onHome,
  onProfiles,
  onPs,
  onModuleClick,
  onLayerUp,
  onLayerDown,
  onSleep,
  onClose
}: KitsuneDockBarProps) {
  const interactive = variant === 'overlay';
  const previewFocus =
    variant === 'preview'
      ? Math.max(
          0,
          layerItems.findIndex((item) => item.icon === 'gamepad' || item.id.includes('controller'))
        )
      : focusedIndex;
  const effectiveFocus = variant === 'preview' ? (previewFocus >= 0 ? previewFocus : 0) : focusedIndex;

  return (
    <div className={`kitsune-bar-overlay-bar kitsune-dock-bar ${variant === 'preview' ? 'kitsune-dock-bar-preview' : ''}`}>
      <div className="kitsune-dock-group fixed-core-left">
        <button
          type="button"
          className="dock-item"
          title="Open Main Window"
          onClick={() => interactive && onHome?.()}
        >
          <IconHome size={18} />
        </button>
        <button
          type="button"
          className="dock-item"
          title="Game Profiles"
          onClick={() => interactive && onProfiles?.()}
        >
          <IconCopy size={18} />
        </button>
        <button
          type="button"
          className="dock-item ps-dock-button"
          title="PlayStation Home"
          onClick={() => interactive && onPs?.()}
        >
          <img src={psHomeGlyphUrl} alt="PS" className="dock-ps-icon" />
        </button>
        <div
          className="dock-item battery-dock-item"
          title={`Battery: ${batteryPctText}${isCharging ? ' (Charging)' : ''}`}
        >
          <div className="dock-battery-meter">
            <span className="battery-bar" />
            <span className="battery-bar" />
            <span className="battery-bar" />
            <span className="battery-bar" />
          </div>
        </div>
      </div>

      <div className="kitsune-dock-group layer-modules">
        {layerItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`dock-item module-item ${activeFlyout === item.id ? 'active' : ''} ${
              effectiveFocus === index ? 'gamepad-focused dock-focus-white' : ''
            }`}
            title={item.name}
            onClick={() => interactive && onModuleClick?.(item.id, index)}
          >
            {renderIcon(item.icon, 18)}
          </button>
        ))}
      </div>

      <div className="kitsune-dock-group fixed-core-right">
        <div className="dock-layer-stepper" title={`Current Layer: ${activeLayer}/${totalLayers}`}>
          <button
            type="button"
            className="stepper-arrow up"
            aria-label="Previous Layer"
            onClick={() => interactive && onLayerUp?.()}
          >
            <IconChevronUp size={11} stroke={3} />
          </button>
          <span className="stepper-label">{`${activeLayer}/${totalLayers}`}</span>
          <button
            type="button"
            className="stepper-arrow down"
            aria-label="Next Layer"
            onClick={() => interactive && onLayerDown?.()}
          >
            <IconChevronDown size={11} stroke={3} />
          </button>
        </div>
        <button
          type="button"
          className="dock-item sleep-dock-button"
          title="Sleep Controller"
          onClick={() => interactive && onSleep?.()}
        >
          <IconPower size={18} />
        </button>
        {variant === 'overlay' ? (
          <button
            type="button"
            className="dock-item close-dock-button"
            title="Close Overlay"
            onClick={() => onClose?.()}
          >
            <IconX size={15} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
