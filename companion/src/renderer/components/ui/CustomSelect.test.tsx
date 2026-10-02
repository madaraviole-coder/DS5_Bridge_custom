import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CustomSelect } from './CustomSelect';

describe('CustomSelect', () => {
  it('renders with tuple options and shows the active label', () => {
    const markup = renderToStaticMarkup(
      <CustomSelect
        value="500"
        options={[
          ['Default (250 Hz)', 'default'],
          ['500 Hz', '500'],
          ['1000 Hz', '1000']
        ]}
        ariaLabel="Polling rate"
        onChange={() => {}}
      />
    );

    expect(markup).toContain('class="custom-select');
    expect(markup).toContain('500 Hz');
    expect(markup).toContain('aria-label="Polling rate"');
    expect(markup).not.toContain('<select');
  });

  it('renders with object options and shows the active label', () => {
    const markup = renderToStaticMarkup(
      <CustomSelect
        value="pro"
        options={[
          { label: 'Standard Profile', value: 'standard' },
          { label: 'Pro Profile', value: 'pro' },
          { label: 'Legacy Profile', value: 'legacy', disabled: true }
        ]}
        ariaLabel="Profile selection"
        onChange={() => {}}
      />
    );

    expect(markup).toContain('Pro Profile');
    expect(markup).toContain('aria-label="Profile selection"');
    expect(markup).not.toContain('<select');
  });

  it('renders disabled state when disabled prop is true', () => {
    const markup = renderToStaticMarkup(
      <CustomSelect
        value="1"
        disabled={true}
        options={[
          ['Option 1', '1'],
          ['Option 2', '2']
        ]}
        ariaLabel="Disabled select"
        onChange={() => {}}
      />
    );

    expect(markup).toContain('disabled');
    expect(markup).toContain('class="custom-select menu-bottom disabled"');
  });

  it('supports custom renderValue function', () => {
    const markup = renderToStaticMarkup(
      <CustomSelect
        value="blue"
        options={[
          ['Blue Color', 'blue'],
          ['Red Color', 'red']
        ]}
        renderValue={(label, val) => `Selected: ${label} (${val})`}
        ariaLabel="Color select"
        onChange={() => {}}
      />
    );

    expect(markup).toContain('Selected: Blue Color (blue)');
  });

  it('applies custom className and id correctly', () => {
    const markup = renderToStaticMarkup(
      <CustomSelect
        id="test-custom-select"
        className="special-custom-class"
        value="item-1"
        options={[['Item 1', 'item-1']]}
        ariaLabel="Test select"
        onChange={() => {}}
      />
    );

    expect(markup).toContain('id="test-custom-select"');
    expect(markup).toContain('special-custom-class');
  });
});
