import type { OverviewPageProps } from '../../pages/OverviewPage';
import type { ControllerDevicesPageProps } from '../../ControllerDevicesPage';
import type { DeadzonesPageProps } from '../../pages/DeadzonesPage';
import type { HapticsPageProps } from '../../pages/HapticsPage';
import type { AudioPageProps } from '../../pages/AudioPage';
import type { TriggersPageProps } from '../../pages/TriggersPage';
import type { LightingPageProps } from '../../pages/LightingPage';
import type { RemappingPageProps } from '../../pages/RemappingPage';
import type { ChordsPageProps } from '../../pages/ChordsPage';
import type { SystemPageProps } from '../../pages/SystemPage';
import type { ControlTab } from '../../types/app-types';
import { ErrorBoundary, TabErrorFallback } from '../common/ErrorBoundary';
import { OverviewPage } from '../../pages/OverviewPage';
import { ControllerDevicesPage } from '../../ControllerDevicesPage';
import { DeadzonesPage } from '../../pages/DeadzonesPage';
import { HapticsPage } from '../../pages/HapticsPage';
import { AudioPage } from '../../pages/AudioPage';
import { TriggersPage } from '../../pages/TriggersPage';
import { LightingPage } from '../../pages/LightingPage';
import { RemappingPage } from '../../pages/RemappingPage';
import { ChordsPage } from '../../pages/ChordsPage';
import { SystemPage } from '../../pages/SystemPage';

export interface ControlPagesProps {
  activeControlTab: ControlTab;
  overviewProps: OverviewPageProps;
  devicesProps: ControllerDevicesPageProps;
  deadzonesProps: DeadzonesPageProps;
  hapticsProps: HapticsPageProps;
  audioProps: AudioPageProps;
  triggersProps: TriggersPageProps;
  lightingProps: LightingPageProps;
  remappingProps: RemappingPageProps;
  chordsProps: ChordsPageProps;
  systemProps: SystemPageProps;
}

export function ControlPages({
  activeControlTab,
  overviewProps,
  devicesProps,
  deadzonesProps,
  hapticsProps,
  audioProps,
  triggersProps,
  lightingProps,
  remappingProps,
  chordsProps,
  systemProps
}: ControlPagesProps) {
  return (
    <section className="control-panel flat-control-panel">
      <div className="control-pages">
        <ErrorBoundary fallbackComponent={TabErrorFallback} resetKeys={[activeControlTab]}>
          <OverviewPage {...overviewProps} />
          <ControllerDevicesPage {...devicesProps} />
          <DeadzonesPage {...deadzonesProps} />
          <HapticsPage {...hapticsProps} />
          <AudioPage {...audioProps} />
          <TriggersPage {...triggersProps} />
          <LightingPage {...lightingProps} />
          <RemappingPage {...remappingProps} />
          <ChordsPage {...chordsProps} />
          <SystemPage {...systemProps} />
        </ErrorBoundary>
      </div>
    </section>
  );
}
