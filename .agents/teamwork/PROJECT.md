# Project: DS5 Bridge Companion UI Modularization & Architectural Modernization

## Architecture
- **Framework & Runtime**: React 18 + TypeScript + Vite + Electron (Desktop) / WebHID (Web).
- **Core Problem**: `App.tsx` is a monolithic file of 12,508 lines containing 109 `useState` hooks, 27 `useRef` hooks, 209 action callbacks, and 128 `window.bridge.*` IPC calls. Zero Error Boundaries exist, creating high vulnerability to blank screens on render exceptions. Three native `<select>` tags violate `UI_STYLE_GUIDE.md`. `scripts/layout-check.mjs` fails due to navigation selector drift (`role="tablist"` missing). `app-behavior.test.ts` and `styles-layout.test.ts` inspect source strings directly.
- **Target Modular Architecture**:
  - `src/renderer/components/ui/`: Extracted design system primitives (`CustomSelect`, `FeatureTipsPanel`, `SystemProfileSummary`, `StartupTutorial`, `KitsuneInputPromotionDialog`, `TriggerLabMeter`, `BridgeMark`).
  - `src/renderer/components/common/ErrorBoundary.tsx`: 2-tier ErrorBoundary (Root boundary around `<App />` and per-tab boundary around active tab content).
  - `src/renderer/components/dialogs/`: Extracted modals (`GameProfilesModal`, `FirmwareUpdateModal`, `DeviceCleanupConfirmModal`, `FeedbackToast`).
  - `src/renderer/hooks/`: Domain-scoped hooks (`useBridgeTelemetry`, `useDeviceConnection`, `useOverviewState`, `useHapticsState`, `useAudioState`, `useTriggersState`, `useLightingState`, `useDeadzonesState`, `useRemappingState`, `useChordsState`, `useSystemState`).
  - `src/renderer/pages/`: Modular domain tab pages:
    - `OverviewPage.tsx`
    - `ControllerDevicesPage.tsx` (existing)
    - `DeadzonesPage.tsx`
    - `HapticsPage.tsx`
    - `AudioPage.tsx`
    - `TriggersPage.tsx`
    - `LightingPage.tsx`
    - `remapping/RemappingPage.tsx` + `RemapButtonsSubPage.tsx`, `RemapTouchpadSubPage.tsx`, `RemapTurboSubPage.tsx`
    - `chords/ChordsPage.tsx` + `chord-math-helpers.ts`
    - `SystemPage.tsx`
  - `src/renderer/App.tsx`: Clean top-level desktop shell (<500 LOC) handling tab routing, modal rendering, global error boundaries, and sidebar navigation.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | UI Design Primitives Extraction | Extract standalone components (`CustomSelect`, `FeatureTipsPanel`, `SystemProfileSummary`, etc.) from `App.tsx` into `src/renderer/components/ui/` | M1 | survey |
| 2 | ErrorBoundary Architecture | Implement 2-tier React ErrorBoundary (root level in `main.tsx` and per-tab level in `App.tsx`) with fallback UI and retry | M1 | survey |
| 3 | UI Style Guide & Select Compliance | Replace 3 native `<select>` tags in Game Profiles modal with `<CustomSelect />` and enforce paired card geometry and layout tokens | M1 | survey |
| 4 | Layout Check Navigation Fix | Add `role="tablist"` to `<nav className="control-tabs">` and ensure `scripts/layout-check.mjs` handles accordion groups | M1 | survey |
| 5 | Overview Tab Modularization | Extract Overview tab into `OverviewPage.tsx` and `useOverviewState.ts` (<1000 LOC) | M2 | survey |
| 6 | Deadzones Tab Modularization | Extract Deadzones tab into `DeadzonesPage.tsx` and `useDeadzonesState.ts` (<1000 LOC) | M2 | survey |
| 7 | Haptics Tab Modularization | Extract Haptics tab (Standard & Audio Haptics) into `HapticsPage.tsx` and `useHapticsState.ts` (<1000 LOC) | M2 | survey |
| 8 | Audio Tab Modularization | Extract Audio tab into `AudioPage.tsx` and `useAudioState.ts` (<1000 LOC) | M2 | survey |
| 9 | Triggers Tab Modularization | Extract Triggers tab (Standard & Trigger Lab) into `TriggersPage.tsx` and `useTriggersState.ts` (<1000 LOC) | M3 | survey |
| 10 | Lighting Tab Modularization | Extract Lighting tab into `LightingPage.tsx` and `useLightingState.ts` (<1000 LOC) | M3 | survey |
| 11 | System Tab Modularization | Extract System tab into `SystemPage.tsx` and `useSystemState.ts` (<1000 LOC) | M3 | survey |
| 12 | Dialog & Modal Modularization | Extract Game Profiles, Firmware Update, and Device Cleanup dialogs into `components/dialogs/` | M3 | survey |
| 13 | Remapping Tab Modularization | Decompose Remapping tab into `RemappingPage.tsx`, `RemapButtonsSubPage.tsx`, `RemapTouchpadSubPage.tsx`, `RemapTurboSubPage.tsx`, and `useRemappingState.ts` | M4 | survey |
| 14 | Chords Tab Modularization | Decompose Chords tab into `ChordsPage.tsx`, `useChordsState.ts`, and `chord-math-helpers.ts` (<1000 LOC) | M4 | survey |
| 15 | Telemetry Decoupling & Bridge Hooks | Decouple bridge transport and telemetry into `useBridgeTelemetry.ts` and `useDeviceConnection.ts` with connection/disconnection resilience | M5 | survey |
| 16 | Shell Slimming (<500 LOC App.tsx) | Reduce `App.tsx` to desktop shell with clean composition, zero duplicate state, and strict adherence to <1000 LOC ceiling | M5 | survey |
| 17 | Test Guard Synchronization | Update `app-behavior.test.ts` and `styles-layout.test.ts` to inspect modular files so all 339+ tests pass without regression | M2-M5 | survey |
| 18 | Automated Verification & Acceptance Signoff | Validate zero typecheck errors, 100% test pass (>=339), build:app succeeds, zero layout tolerance errors, and <1000 LOC per file | M6 | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | UI Foundation, Design Primitives & Layout Check | Extract UI primitives (`CustomSelect`, `FeatureTipsPanel`, `SystemProfileSummary`), implement 2-tier `ErrorBoundary`, replace native `<select>` tags in Game Profiles modal, fix `role="tablist"` navigation in `App.tsx` and `layout-check.mjs` | none | IN_PROGRESS |
| M2 | Modularize Core Controller & Audio/Haptics Tabs | Extract Overview, Deadzones, Haptics, Audio tabs into `pages/` and domain hooks; synchronize `app-behavior.test.ts` | M1 | PLANNED |
| M3 | Modularize Triggers, Lighting, System Tabs & Modals | Extract Triggers, Lighting, System tabs, and Dialog modals; synchronize `app-behavior.test.ts` | M2 | PLANNED |
| M4 | Modularize Remapping & Chords Tabs | Decompose Remapping into sub-pages (`Buttons`, `Touchpad`, `Turbo`) and Chords into `ChordsPage` + `chord-math-helpers`; synchronize `app-behavior.test.ts` | M3 | PLANNED |
| M5 | Telemetry Decoupling & Shell Slimming | Decouple telemetry and bridge transport into `useBridgeTelemetry` and `useDeviceConnection`; slim down `App.tsx` to <500 LOC | M4 | PLANNED |
| M6 | Final Verification, E2E Suite Pass & Hardening | Run full automated acceptance checks: `npm run typecheck`, `npm run test:companion` (>=339 tests), `npm run build:app`, `npm run layout:check`, and file LOC verification (<1000 LOC); adversarial testing | M5, E2E | PLANNED |

## Interface Contracts
### `ErrorBoundary` Component
- Signature: `<ErrorBoundary fallbackComponent={FallbackUI} onReset={resetHandler}>{children}</ErrorBoundary>`
- Props: `fallbackComponent?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>`, `onReset?: () => void`, `children: React.ReactNode`.
- Behavior: Catches uncaught render exceptions, renders accessible error notice with "Retry" action, prevents blank screen crashes.

### `CustomSelect` Component
- Props: `id?: string`, `className?: string`, `value: string`, `options: Array<{ value: string; label: string; icon?: string; disabled?: boolean }>`, `onChange: (value: string) => void`, `ariaLabel?: string`, `disabled?: boolean`.
- Behavior: Auto-flip dropdown, keyboard accessible, replaces all native `<select>` elements.

### `useBridgeTelemetry` Hook
- Signature: `function useBridgeTelemetry(): { snapshot: BridgeSnapshot | null; isConnected: boolean; isConnecting: boolean; connectionError: string | null; reconnect: () => Promise<void>; }`
- Behavior: Subscribes to `window.bridge.onSnapshot` and `getStatus`, buffers updates during active user dragging/scrubbing (`windowDraggingRef`), provides clean state to tabs.

### Tab Page Interface Pattern
- Signature: `export function TabNamePage(props: TabNamePageProps): JSX.Element`
- Each tab is self-contained with its dedicated domain hook or clear prop contract.
- Line Count Ceiling: Under 1,000 LOC per file (target 200–500 LOC).

## Code Layout
```
companion/src/renderer/
├── App.tsx                                  # Desktop shell (<500 LOC)
├── main.tsx                                 # React root with top-level ErrorBoundary
├── global.d.ts                              # Bridge API typing
├── styles.css                               # Layout & design tokens
├── components/
│   ├── common/
│   │   └── ErrorBoundary.tsx                # Reusable ErrorBoundary
│   ├── ui/
│   │   ├── CustomSelect.tsx                 # Design system CustomSelect
│   │   ├── FeatureTipsPanel.tsx             # Collapsible tips panel
│   │   ├── SystemProfileSummary.tsx         # System status header summary
│   │   ├── StartupTutorial.tsx              # First-launch tutorial modal
│   │   ├── KitsuneInputPromotionDialog.tsx  # Promotion modal
│   │   ├── TriggerLabMeter.tsx              # SVG trigger visualizer
│   │   └── BridgeMark.tsx                   # Logo component
│   └── dialogs/
│       ├── GameProfilesModal.tsx            # Game Profiles modal (CustomSelect compliant)
│       ├── FirmwareUpdateModal.tsx          # Firmware update modal
│       └── DeviceCleanupConfirmModal.tsx    # Device cleanup confirmation modal
├── hooks/
│   ├── useBridgeTelemetry.ts                # Telemetry ingestion & scrub deferral
│   ├── useDeviceConnection.ts               # Connection state & error handling
│   ├── useOverviewState.ts
│   ├── useHapticsState.ts
│   ├── useAudioState.ts
│   ├── useTriggersState.ts
│   ├── useLightingState.ts
│   ├── useDeadzonesState.ts
│   ├── useRemappingState.ts
│   ├── useChordsState.ts
│   └── useSystemState.ts
└── pages/
    ├── OverviewPage.tsx
    ├── ControllerDevicesPage.tsx            # Existing (precedent)
    ├── DeadzonesPage.tsx
    ├── HapticsPage.tsx
    ├── AudioPage.tsx
    ├── TriggersPage.tsx
    ├── LightingPage.tsx
    ├── remapping/
    │   ├── RemappingPage.tsx                # Main container
    │   ├── RemapButtonsSubPage.tsx          # Buttons & Sticks
    │   ├── RemapTouchpadSubPage.tsx         # Touchpad 4-Zone & Gestures
    │   └── RemapTurboSubPage.tsx            # Turbo Multi-Actions
    ├── chords/
    │   ├── ChordsPage.tsx
    │   └── chord-math-helpers.ts
    └── SystemPage.tsx
```
