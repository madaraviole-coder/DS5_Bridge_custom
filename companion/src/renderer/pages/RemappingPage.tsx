import type { Dispatch, SetStateAction } from 'react';
import {
  IconDeviceGamepad2,
  IconDeviceGamepad3,
  IconFlame,
  IconRotateClockwise as RefreshCcw,
  IconViewfinder
} from '@tabler/icons-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import { IconTouchpadHand } from '../App';
import {
  RemappingButtonsSubTab,
  type RemappingButtonsSubTabProps
} from './remapping/RemappingButtonsSubTab';
import {
  RemappingTouchpadSubTab,
  type RemappingTouchpadSubTabProps
} from './remapping/RemappingTouchpadSubTab';
import {
  RemappingTurboSubTab,
  type RemappingTurboSubTabProps
} from './remapping/RemappingTurboSubTab';

export interface RemappingPageProps {
  active: boolean;
  selectedRemapProfileId: string;
  pendingAction: string | null;
  remapProfileOptions: ReadonlyArray<readonly [string, string]>;
  selectButtonRemappingProfile: (profileId: string) => void;
  restoreButtonRemappingDefaults: () => void;
  remappingSubTab: 'buttons' | 'sticks' | 'triggers' | 'touchpad' | 'turbo';
  setRemappingSubTab: Dispatch<SetStateAction<'buttons' | 'sticks' | 'triggers' | 'touchpad' | 'turbo'>>;
  setActiveControlTab: (tab: any) => void;

  buttonsProps: RemappingButtonsSubTabProps;
  touchpadProps: RemappingTouchpadSubTabProps;
  turboProps: RemappingTurboSubTabProps;
}

export function RemappingPage({
  active,
  selectedRemapProfileId,
  pendingAction,
  remapProfileOptions,
  selectButtonRemappingProfile,
  restoreButtonRemappingDefaults,
  remappingSubTab,
  setRemappingSubTab,
  setActiveControlTab,
  buttonsProps,
  touchpadProps,
  turboProps
}: RemappingPageProps) {
  return (
    <div
      className={`control-page remapping-page ${active ? 'active' : ''}`}
      role="tabpanel"
      id="control-panel-remapping"
      aria-labelledby="control-tab-remapping"
      aria-hidden={!active}
    >
      <div className="feature-heading system-heading remapping-heading">
        <div>
          <h2>Button Remapping</h2>
          <p>Choose replacement targets for controller button slots.</p>
        </div>
        <div className="profile-controls">
          <CustomSelect
            value={selectedRemapProfileId}
            disabled={pendingAction !== null}
            options={remapProfileOptions}
            ariaLabel="Button remapping profile"
            onChange={selectButtonRemappingProfile}
          />
          <button
            className="heading-action"
            type="button"
            disabled={pendingAction !== null}
            onClick={restoreButtonRemappingDefaults}
          >
            <RefreshCcw size={18} />
            Restore Defaults
          </button>
        </div>
      </div>

      <div className="remapping-subtabs-bar">
        <div className="remapping-subtabs" role="tablist" aria-label="Remapping Categories">
          <button
            type="button"
            role="tab"
            aria-selected={remappingSubTab === 'buttons'}
            className={`remapping-subtab ${remappingSubTab === 'buttons' ? 'active' : ''}`}
            onClick={() => setRemappingSubTab('buttons')}
          >
            <IconDeviceGamepad3 />
            <span>Buttons</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={remappingSubTab === 'sticks'}
            className={`remapping-subtab ${remappingSubTab === 'sticks' ? 'active' : ''}`}
            onClick={() => {
              setRemappingSubTab('sticks');
              setActiveControlTab('deadzones');
            }}
          >
            <IconViewfinder />
            <span>Sticks</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={remappingSubTab === 'triggers'}
            className={`remapping-subtab ${remappingSubTab === 'triggers' ? 'active' : ''}`}
            onClick={() => {
              setRemappingSubTab('triggers');
              setActiveControlTab('triggers');
            }}
          >
            <IconDeviceGamepad2 />
            <span>Triggers</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={remappingSubTab === 'touchpad'}
            className={`remapping-subtab touchpad-subtab ${remappingSubTab === 'touchpad' ? 'active' : ''}`}
            onClick={() => setRemappingSubTab('touchpad')}
          >
            <IconTouchpadHand size={16} />
            <span>Touchpad</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={remappingSubTab === 'turbo'}
            className={`remapping-subtab turbo-subtab ${remappingSubTab === 'turbo' ? 'active' : ''}`}
            onClick={() => setRemappingSubTab('turbo')}
          >
            <IconFlame size={16} />
            <span>Turbo</span>
          </button>
        </div>
      </div>

      {remappingSubTab === 'buttons' && <RemappingButtonsSubTab {...buttonsProps} />}
      {remappingSubTab === 'touchpad' && <RemappingTouchpadSubTab {...touchpadProps} />}
      {remappingSubTab === 'turbo' && <RemappingTurboSubTab {...turboProps} />}
    </div>
  );
}
