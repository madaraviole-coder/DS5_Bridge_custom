import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/standard.css';
import { App } from './App';
import './styles.css';
import { initWebBridgeIfNeeded } from './web-bridge-adapter';

initWebBridgeIfNeeded();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

