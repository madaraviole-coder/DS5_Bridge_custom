import type { RefObject } from 'react';
import {
  IconBell as Bell,
  IconMinus as Minus,
  IconUsb,
  IconX as X
} from '@tabler/icons-react';
import { BridgeMark } from '../ui/BridgeMark';
import { KitsuneInputWordmark } from '../ui/KitsuneInputPromotionDialog';
import type { BridgeSnapshot } from '../../../shared/types';
import type { NotificationFocusTarget } from '../../types/app-types';

export interface HeaderProps {
  snapshot: BridgeSnapshot;
  connected: boolean;
  showKitsuneInputPromotion: boolean;
  setShowKitsuneInputPromotion: (show: boolean) => void;
  setShowBridgeSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
  showNotificationsMenu: boolean;
  setShowNotificationsMenu: (show: boolean | ((prev: boolean) => boolean)) => void;
  notificationsRef: RefObject<HTMLDivElement | null>;
  notificationsEnabled: boolean;
  notificationFocusTarget: NotificationFocusTarget | null;
  controllerToastEnabled: boolean;
  lowBatteryToastEnabled: boolean;
  pendingAction: string | null;
  toggleControllerNotifications: () => void;
  toggleLowBatteryNotifications: () => void;
  testNotifications: () => void;
  beginWindowDrag: () => void;
  kitsuneInputLogoUrl: string;
}

export function Header({
  snapshot,
  connected,
  showKitsuneInputPromotion,
  setShowKitsuneInputPromotion,
  setShowBridgeSettings,
  showNotificationsMenu,
  setShowNotificationsMenu,
  notificationsRef,
  notificationsEnabled,
  notificationFocusTarget,
  controllerToastEnabled,
  lowBatteryToastEnabled,
  pendingAction,
  toggleControllerNotifications,
  toggleLowBatteryNotifications,
  testNotifications,
  beginWindowDrag,
  kitsuneInputLogoUrl
}: HeaderProps) {
  return (
    <div
      className="window-bar"
      onMouseDown={(event) => {
        const target = event.target as HTMLElement;
        if (
          target.closest('.kitsune-promotion-banner') ||
          target.closest('.bridge-tools') ||
          target.closest('.window-actions')
        ) {
          return;
        }
        setShowBridgeSettings(false);
        setShowNotificationsMenu(false);
        if (event.button === 0) {
          beginWindowDrag();
        }
      }}
    >
      <span className="bridge-wordmark" aria-label="DS5 Bridge">
        <BridgeMark />
        <span className="bridge-wordmark-ds">DS5</span>
        <span className="bridge-wordmark-name">Bridge</span>
      </span>
      {snapshot && !snapshot.settings.kitsuneInputPromotionDismissed && (
        <button
          className="kitsune-promotion-banner"
          type="button"
          aria-label="Explore DS5 Bridge"
          aria-haspopup="dialog"
          aria-expanded={showKitsuneInputPromotion}
          onClick={() => {
            setShowBridgeSettings(false);
            setShowNotificationsMenu(false);
            setShowKitsuneInputPromotion(true);
          }}
        >
          <img src={kitsuneInputLogoUrl} alt="" />
          <span className="kitsune-promotion-banner-copy">Explore</span>
          <KitsuneInputWordmark />
        </button>
      )}
      <div className="topbar-right">
        <div className="bridge-tools">
          {(window.bridge as any)?.isWebHid && (
            <div className="webhid-connect-group">
              <button
                className={`topbar-tool webhid-connect-tool ${connected ? 'connected' : 'action-required'}`}
                type="button"
                aria-label={connected ? 'DS5 Bridge Connected' : 'Connect DS5 Bridge via WebUSB'}
                title={
                  connected
                    ? `Connected via ${(window.bridge as any)?.activeTransportName || 'Web'}`
                    : 'Connect DS5 Bridge via WebUSB (Recommended)'
                }
                onClick={async () => {
                  if ((window.bridge as any)?.connectWebUsb) {
                    await (window.bridge as any).connectWebUsb();
                  } else if ((window.bridge as any)?.connectWebHid) {
                    await (window.bridge as any).connectWebHid();
                  }
                }}
              >
                <IconUsb size={18} />
                <span className="webhid-button-label">
                  {connected
                    ? (window.bridge as any)?.activeTransportName || 'Connected'
                    : 'Connect (WebUSB)'}
                </span>
              </button>
              {!connected && (
                <button
                  className="topbar-tool webhid-connect-tool secondary"
                  type="button"
                  title="Connect via WebHID (DualSense Gamepad interface)"
                  onClick={async () => {
                    if ((window.bridge as any)?.connectWebHid) {
                      await (window.bridge as any).connectWebHid();
                    }
                  }}
                >
                  <span className="webhid-button-label">WebHID</span>
                </button>
              )}
            </div>
          )}
          <div className="notifications-control" ref={notificationsRef as any}>
            <button
              className={`topbar-tool notification-tool ${showNotificationsMenu ? 'active' : ''} ${notificationsEnabled ? 'armed' : ''}`}
              type="button"
              aria-label="Notifications"
              aria-haspopup="menu"
              aria-expanded={showNotificationsMenu}
              onClick={() => setShowNotificationsMenu((value) => !value)}
            >
              <Bell size={18} />
            </button>
            {showNotificationsMenu && (
              <div className="settings-menu notifications-menu" role="menu" aria-label="Notifications">
                <div className="settings-menu-heading">
                  <Bell size={16} />
                  <span>Notifications</span>
                </div>
                <div
                  className={`settings-menu-row ${
                    notificationFocusTarget === 'controller-status' || notificationFocusTarget === 'all'
                      ? 'settings-menu-row-highlight'
                      : ''
                  }`}
                >
                  <div>
                    <strong>Controller Status</strong>
                    <span>Toast when the controller connects or disconnects</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={controllerToastEnabled}
                    className={`switch ${controllerToastEnabled ? 'on' : ''}`}
                    disabled={pendingAction !== null}
                    onClick={toggleControllerNotifications}
                  >
                    <span />
                  </button>
                </div>
                <div
                  className={`settings-menu-row ${
                    notificationFocusTarget === 'low-battery' || notificationFocusTarget === 'all'
                      ? 'settings-menu-row-highlight'
                      : ''
                  }`}
                >
                  <div>
                    <strong>Low Battery</strong>
                    <span>Toast when battery reaches 20% or below</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={lowBatteryToastEnabled}
                    className={`switch ${lowBatteryToastEnabled ? 'on' : ''}`}
                    disabled={pendingAction !== null}
                    onClick={toggleLowBatteryNotifications}
                  >
                    <span />
                  </button>
                </div>
                <div className="settings-menu-action">
                  <button
                    className="secondary-action"
                    type="button"
                    disabled={pendingAction !== null}
                    onClick={testNotifications}
                  >
                    Test Toast
                  </button>
                </div>
              </div>
            )}
          </div>
          <span className="bridge-tool-divider" aria-hidden="true" />
        </div>
        {!(window.bridge as any)?.isWebHid && (
          <div className="window-actions">
            <button type="button" title="Minimize" onClick={() => void window.bridge.minimizeWindow()}>
              <Minus size={16} />
            </button>
            <button type="button" title="Hide to tray" onClick={() => void window.bridge.hideWindow()}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
