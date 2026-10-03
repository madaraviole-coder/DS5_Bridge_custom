import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/standard.css';
import { App } from './App';
import { KitsuneBarOverlay } from './components/layout/KitsuneBarOverlay';
import './styles.css';
import { initWebBridgeIfNeeded } from './web-bridge-adapter';
import { ErrorBoundary, RootErrorFallback } from './components/common/ErrorBoundary';

initWebBridgeIfNeeded();

const isKitsuneBarWindow = window.location.hash === '#kitsune-bar';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallbackComponent={RootErrorFallback}>
      {isKitsuneBarWindow ? <KitsuneBarOverlay /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
);
