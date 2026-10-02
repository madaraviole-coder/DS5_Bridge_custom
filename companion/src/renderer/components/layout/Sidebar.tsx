import type { Dispatch, RefObject, SetStateAction } from 'react';
import {
  IconBluetooth,
  IconChevronDown as ChevronDown,
  IconCpu,
  IconPencil as Pencil,
  IconRefresh as RefreshCcw,
  IconSettings as SettingsIcon,
  IconUsb,
  IconBolt as Zap
} from '@tabler/icons-react';
import type { BridgeSnapshot } from '../../../shared/types';
import { CustomSelect, type CustomSelectOption } from '../ui/CustomSelect';
import { CONTROL_TAB_DEFINITIONS, CONTROL_TAB_GROUPS } from '../../constants/app-constants';
import { controlPanelIdFor } from '../../utils/tab-helpers';
import type { ControlTab, ControlTabGroupId } from '../../types/app-types';

export interface SidebarProps {
  snapshot: BridgeSnapshot;
  statusTone: string;
  sidebarDeviceTone: string;
  sidebarDeviceTitle: string;
  sidebarDeviceStatus: string;
  sidebarBatteryLabel: string;
  batteryPowerLabel: string | null;
  activeBridgeSelectValue: string;
  bridgeSelectOptions: CustomSelectOption[];
  selectedBridgeInfo?: { uniqueId?: string | null; name?: string | null } | null;
  bridgeRenameDraft: { uniqueId: string; value: string } | null;
  setBridgeRenameDraft: (draft: { uniqueId: string; value: string } | null) => void;
  bridgeRenameCancelledRef: RefObject<boolean>;
  pendingAction: string | null;
  runAction: (name: string, fn: () => Promise<any>) => Promise<any>;
  directControllers: Array<{ path: string; product?: string }>;
  activeControlTab: ControlTab;
  selectControlTab: (tab: ControlTab) => void;
  openControlGroupId: ControlTabGroupId | null;
  setOpenControlGroupId: Dispatch<SetStateAction<ControlTabGroupId | null>>;
  kofiBadgeUrl: string;
  showBridgeSettings: boolean;
  setShowBridgeSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
  controllerImage: string;
}

export function Sidebar({
  statusTone,
  sidebarDeviceTone,
  sidebarDeviceTitle,
  sidebarDeviceStatus,
  sidebarBatteryLabel,
  batteryPowerLabel,
  activeBridgeSelectValue,
  bridgeSelectOptions,
  selectedBridgeInfo,
  bridgeRenameDraft,
  setBridgeRenameDraft,
  bridgeRenameCancelledRef,
  pendingAction,
  runAction,
  directControllers,
  activeControlTab,
  selectControlTab,
  openControlGroupId,
  setOpenControlGroupId,
  kofiBadgeUrl,
  showBridgeSettings,
  setShowBridgeSettings,
  controllerImage
}: SidebarProps) {
  return (
    <section className={`hero-card status-${statusTone}`}>
      <div className="sidebar-section-label">Device</div>
      <div
        className={`hero-main device-status-${sidebarDeviceTone}`}
        role="button"
        tabIndex={0}
        aria-label="Open Devices"
        onClick={() => selectControlTab('devices')}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          selectControlTab('devices');
        }}
      >
        <img className="controller-art" src={controllerImage} alt="" />
        <div className="status-copy">
          <div className="connection-row">
            <strong>{sidebarDeviceTitle}</strong>
          </div>
          <div className="device-meta-row">
            <div className="bridge-state compact-device-status">
              <span>{sidebarDeviceStatus}</span>
            </div>
            <div className="device-battery-meta">
              <span className="device-meta-separator" aria-hidden="true">
                ·
              </span>
              <span className="device-battery-percentage">{sidebarBatteryLabel}</span>
              {batteryPowerLabel && (
                <span
                  className="device-power-indicator"
                  title={batteryPowerLabel}
                  aria-label={batteryPowerLabel}
                >
                  <Zap size={13} stroke={2} aria-hidden="true" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="sidebar-bridge-area">
        <div className="sidebar-bridge-selector" aria-label="Pico bridge selector">
          <span className="sidebar-bridge-type" aria-hidden="true">
            <IconUsb size={16} />
          </span>
          {bridgeRenameDraft === null ? (
            <CustomSelect
              value={activeBridgeSelectValue}
              options={bridgeSelectOptions}
              onChange={(devicePath) => {
                if (!devicePath) return;
                void runAction('bridge-select', () => window.bridge.selectBridge(String(devicePath)));
              }}
              renderValue={(label) => selectedBridgeInfo?.name ?? (label || 'No bridge detected')}
              renderMenuFooter={(closeMenu) => (
                <div className="trigger-lab-profile-actions chords-function-menu-actions">
                  <button
                    type="button"
                    title="Rename bridge"
                    disabled={pendingAction !== null || !selectedBridgeInfo?.uniqueId}
                    onClick={() => {
                      closeMenu();
                      if (!selectedBridgeInfo?.uniqueId) return;
                      if (bridgeRenameCancelledRef.current !== undefined) {
                        (bridgeRenameCancelledRef as any).current = false;
                      }
                      setBridgeRenameDraft({
                        uniqueId: selectedBridgeInfo.uniqueId,
                        value: selectedBridgeInfo.name ?? ''
                      });
                    }}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    title="Refresh bridges"
                    disabled={pendingAction !== null}
                    onClick={() => void runAction('bridge-refresh', () => window.bridge.refreshBridgeDevices())}
                  >
                    <RefreshCcw size={15} aria-hidden="true" />
                  </button>
                </div>
              )}
              ariaLabel="Pico bridge"
              className="chords-function-select sidebar-bridge-select"
              disabled={pendingAction !== null}
            />
          ) : (
            <input
              className="bridge-rename-input"
              type="text"
              autoFocus
              maxLength={32}
              aria-label="Bridge name"
              placeholder="Bridge name"
              value={bridgeRenameDraft.value}
              onChange={(event) =>
                setBridgeRenameDraft({
                  ...bridgeRenameDraft,
                  value: event.currentTarget.value
                })
              }
              onBlur={() => {
                const draft = bridgeRenameDraft;
                setBridgeRenameDraft(null);
                if (bridgeRenameCancelledRef.current) {
                  (bridgeRenameCancelledRef as any).current = false;
                  return;
                }
                void runAction('bridge-rename', () =>
                  window.bridge.setBridgeLabel(draft.uniqueId, draft.value.trim() || null)
                );
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.currentTarget.blur();
                } else if (event.key === 'Escape') {
                  if (bridgeRenameCancelledRef.current !== undefined) {
                    (bridgeRenameCancelledRef as any).current = true;
                  }
                  event.currentTarget.blur();
                }
              }}
            />
          )}
        </div>
        {directControllers.map((controller) => (
          <div key={controller.path} className="bridge-direct-controller" title={controller.path}>
            <IconUsb size={13} aria-hidden="true" />
            <span>{(controller.product ?? 'DualSense').replace(' Wireless Controller', '')} — USB direct</span>
          </div>
        ))}
      </div>
      <div className="sidebar-section-label">Controls</div>
      <div className="sidebar-controls">
        <nav className="control-tabs" role="tablist" aria-label="Controls">
          {(() => {
            const { id, label, Icon } = CONTROL_TAB_DEFINITIONS.overview;
            return (
              <button
                key={id}
                id={`control-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={activeControlTab === id}
                aria-controls={controlPanelIdFor(id)}
                className={`control-tab-button ${activeControlTab === id ? 'active' : ''}`}
                onClick={() => selectControlTab(id)}
              >
                <Icon size={18} stroke={2} />
                <span>{label}</span>
              </button>
            );
          })()}
          {CONTROL_TAB_GROUPS.map(({ id, label, Icon, tabs }) => {
            const expanded = openControlGroupId === id;
            const containsActiveTab = tabs.some(({ id: tabId }) => tabId === activeControlTab);
            const triggerId = `control-group-${id}`;
            const panelId = `control-group-panel-${id}`;
            return (
              <div
                key={id}
                className={`control-tab-group ${expanded ? 'expanded' : ''} ${
                  containsActiveTab ? 'contains-active' : ''
                }`}
              >
                <button
                  id={triggerId}
                  type="button"
                  className="control-tab-group-trigger"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpenControlGroupId((current) => (current === id ? null : id))}
                >
                  <Icon size={18} stroke={2} />
                  <span>{label}</span>
                  <ChevronDown className="control-tab-group-chevron" size={16} stroke={2} aria-hidden="true" />
                </button>
                <div id={panelId} className="control-tab-group-panel" aria-hidden={!expanded}>
                  <div className="control-tab-group-clip">
                    <div className="control-tab-group-items" role="group" aria-labelledby={triggerId}>
                      {tabs.map(({ id: tabId, label: tabLabel, Icon: TabIcon }) => (
                        <button
                          key={tabId}
                          id={`control-tab-${tabId}`}
                          type="button"
                          role="tab"
                          tabIndex={expanded ? undefined : -1}
                          aria-selected={activeControlTab === tabId}
                          aria-controls={controlPanelIdFor(tabId)}
                          className={`control-tab-button nested ${activeControlTab === tabId ? 'active' : ''}`}
                          onClick={() => selectControlTab(tabId)}
                        >
                          <TabIcon size={18} stroke={2} />
                          <span>{tabLabel}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>
      <div className="sidebar-actions">
        <div className="sidebar-support">
          <button
            className="sidebar-kofi-link"
            type="button"
            aria-label="Support SundayMoments on Ko-fi"
            onClick={() => void window.bridge.openExternal('https://ko-fi.com/sundaymoments')}
          >
            <img className="sidebar-kofi-badge" src={kofiBadgeUrl} alt="" />
          </button>
        </div>
        <div className="header-settings">
          <button
            className={`sidebar-action-button ${showBridgeSettings ? 'active' : ''}`}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={showBridgeSettings}
            onClick={() => setShowBridgeSettings((value) => !value)}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </button>
          <button
            className={`sidebar-action-button ${activeControlTab === 'system' ? 'active' : ''}`}
            id="control-tab-system"
            type="button"
            aria-controls="control-panel-system"
            aria-selected={activeControlTab === 'system'}
            onClick={() => selectControlTab('system')}
          >
            <IconCpu size={18} />
            <span>System</span>
          </button>
        </div>
      </div>
    </section>
  );
}
