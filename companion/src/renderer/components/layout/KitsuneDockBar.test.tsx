import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { KitsuneDockBar } from './KitsuneDockBar';

describe('KitsuneDockBar', () => {
  it('applies white focus class on preview module', () => {
    const html = renderToStaticMarkup(
      <KitsuneDockBar
        variant="preview"
        layerItems={[
          { id: 'audio', name: 'Audio', icon: 'volume' },
          { id: 'controller', name: 'Controller', icon: 'gamepad' },
          { id: 'mic', name: 'Mic', icon: 'mic' }
        ]}
        focusedIndex={0}
        activeFlyout={null}
        activeLayer={1}
        totalLayers={2}
        batteryPctText="85%"
        isCharging={false}
        renderIcon={(name) => <span data-icon={name} />}
      />
    );

    expect(html).toContain('dock-focus-white');
    expect(html).toContain('gamepad-focused');
    expect(html).toContain('kitsune-dock-bar-preview');
  });
});
