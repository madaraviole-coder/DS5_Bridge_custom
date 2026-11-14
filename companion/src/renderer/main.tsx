import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/standard.css';
// Montserrat sets the DS5 Bridge wordmark in the window bar and sidebar.
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';
// The base stylesheet loads first so feature stylesheets imported by components cascade after it.
import './styles.css';
import { App } from './App';
import { KitsuneBarOverlay } from './components/layout/KitsuneBarOverlay';
import { initWebBridgeIfNeeded } from './web-bridge-adapter';
import { ErrorBoundary, RootErrorFallback } from './components/common/ErrorBoundary';
import { RendererFailureBoundary } from './common/RendererFailureBoundary';
import { RendererLocalization } from './composition/RendererLocalization';
import { applyStoredUiThemePreset } from './ui-theme-preferences';
import { applyStoredUiTextScalePercent } from './ui-text-scale-preferences';

// Paint the cached theme and text size before React mounts to avoid a flash.
// RendererLocalization likewise mounts in the cached language.
applyStoredUiThemePreset();
applyStoredUiTextScalePercent();
initWebBridgeIfNeeded();

const isKitsuneBarWindow = window.location.hash === '#kitsune-bar';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RendererLocalization>
      <RendererFailureBoundary>
        <ErrorBoundary fallbackComponent={RootErrorFallback}>
          {isKitsuneBarWindow ? <KitsuneBarOverlay /> : <App />}
        </ErrorBoundary>
      </RendererFailureBoundary>
    </RendererLocalization>
  </React.StrictMode>
);
