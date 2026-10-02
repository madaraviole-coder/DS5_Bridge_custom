import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { IconCheck as Check, IconChevronDown as ChevronDown } from '@tabler/icons-react';

export type SelectValue = string | number;

export type CustomSelectOptionTuple<T extends SelectValue = SelectValue> =
  | [string, T]
  | readonly [string, T];

export interface CustomSelectOptionObject<T extends SelectValue = SelectValue> {
  label: string;
  value: T;
  icon?: ReactNode;
  disabled?: boolean;
}

export type CustomSelectOption<T extends SelectValue = SelectValue> =
  | CustomSelectOptionTuple<T>
  | CustomSelectOptionObject<T>;

export interface CustomSelectProps<T extends SelectValue> {
  id?: string;
  value: T;
  options: ReadonlyArray<CustomSelectOption<T>>;
  disabled?: boolean;
  className?: string;
  floatingMenu?: boolean;
  floatingMenuMinWidth?: number;
  suspendOutsideClose?: boolean;
  showSelectedCheck?: boolean;
  closeOnSelect?: boolean;
  getOptionClassName?: (label: string, value: T) => string | undefined;
  renderValue?: (label: string, value: T) => ReactNode;
  renderOption?: (label: string, value: T) => ReactNode;
  renderMenuFooter?: (closeMenu: () => void) => ReactNode;
  ariaLabel: string;
  onChange: (value: T) => void;
}

export type CustomSelectMenuStyle = CSSProperties & {
  '--custom-select-menu-max-height'?: string;
};

function normalizeOption<T extends SelectValue>(
  option: CustomSelectOption<T>
): CustomSelectOptionObject<T> {
  if (typeof option === 'object' && option !== null && 'label' in option && 'value' in option) {
    return option;
  }
  const tuple = option as CustomSelectOptionTuple<T>;
  return { label: tuple[0], value: tuple[1] };
}

export function CustomSelect<T extends SelectValue>({
  id,
  value,
  options,
  disabled = false,
  className = '',
  floatingMenu = false,
  floatingMenuMinWidth,
  suspendOutsideClose = false,
  showSelectedCheck = true,
  closeOnSelect = true,
  getOptionClassName,
  renderValue,
  renderOption,
  renderMenuFooter,
  ariaLabel,
  onChange
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = options.map(normalizeOption);
  const selected = normalizedOptions.find((opt) => opt.value === value);
  const longList = normalizedOptions.length > 18;
  const defaultMenuMaxHeight = longList ? 360 : 232;
  const [menuMaxHeight, setMenuMaxHeight] = useState(defaultMenuMaxHeight);
  const [menuPlacement, setMenuPlacement] = useState<'top' | 'bottom'>('bottom');
  const [floatingMenuStyle, setFloatingMenuStyle] = useState<CustomSelectMenuStyle>({});

  function updateMenuMaxHeight() {
    const root = rootRef.current;
    if (!root) {
      setMenuMaxHeight(defaultMenuMaxHeight);
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const boundary = floatingMenu
      ? null
      : root.closest('.system-card, .feature-card, .settings-menu, .control-page') as HTMLElement | null;
    const boundaryRect = boundary?.getBoundingClientRect();
    const menuGap = 6;
    const viewportPadding = floatingMenu ? 8 : 0;
    const lowerLimit = Math.min(window.innerHeight - viewportPadding, boundaryRect?.bottom ?? window.innerHeight);
    const upperLimit = Math.max(viewportPadding, boundaryRect?.top ?? 0);
    const spaceBelow = Math.max(1, Math.floor(lowerLimit - rootRect.bottom - menuGap));
    const spaceAbove = Math.max(1, Math.floor(rootRect.top - upperLimit - menuGap));
    const preferredVisibleHeight = Math.min(defaultMenuMaxHeight, 184);
    const nextPlacement = spaceBelow < preferredVisibleHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    const availableSpace = nextPlacement === 'top' ? spaceAbove : spaceBelow;
    const nextMaxHeight = longList ? availableSpace : Math.min(defaultMenuMaxHeight, availableSpace);

    setMenuPlacement(nextPlacement);
    setMenuMaxHeight(Math.max(1, nextMaxHeight));

    if (floatingMenu) {
      const minimumWidth = floatingMenuMinWidth ?? rootRect.width;
      const width = Math.min(
        Math.max(rootRect.width, minimumWidth),
        Math.max(1, window.innerWidth - viewportPadding * 2)
      );
      const idealLeft = rootRect.left + (rootRect.width - width) / 2;
      const left = Math.min(
        Math.max(viewportPadding, idealLeft),
        Math.max(viewportPadding, window.innerWidth - viewportPadding - width)
      );
      setFloatingMenuStyle({
        left: `${Math.round(left)}px`,
        width: `${Math.round(width)}px`,
        ...(nextPlacement === 'top'
          ? { bottom: `${Math.round(window.innerHeight - rootRect.top + menuGap)}px` }
          : { top: `${Math.round(rootRect.bottom + menuGap)}px` }),
        '--custom-select-menu-max-height': `${Math.max(1, nextMaxHeight)}px`
      });
    }
  }

  useEffect(() => {
    if (!open) return undefined;
    function closeIfOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !suspendOutsideClose
        && !rootRef.current?.contains(target)
        && !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', closeIfOutside);
    return () => document.removeEventListener('mousedown', closeIfOutside);
  }, [open, suspendOutsideClose]);

  useEffect(() => {
    if (!open) return undefined;
    updateMenuMaxHeight();
    window.addEventListener('resize', updateMenuMaxHeight);
    window.addEventListener('scroll', updateMenuMaxHeight, true);
    return () => {
      window.removeEventListener('resize', updateMenuMaxHeight);
      window.removeEventListener('scroll', updateMenuMaxHeight, true);
    };
  }, [open, defaultMenuMaxHeight, floatingMenu, floatingMenuMinWidth, longList]);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => {
      const menu = menuRef.current;
      const optionsContainer = menu?.querySelector('.custom-select-menu-options') as HTMLElement | null;
      const selectedElement = menu?.querySelector('[data-selected="true"]') as HTMLElement | null;
      if (!optionsContainer || !selectedElement) {
        return;
      }
      const selectedCenter = selectedElement.offsetTop + selectedElement.offsetHeight / 2;
      optionsContainer.scrollTop = Math.max(0, selectedCenter - optionsContainer.clientHeight / 2);
    });
  }, [open]);

  function choose(nextValue: T) {
    if (closeOnSelect) {
      setOpen(false);
    }
    if (nextValue !== value) {
      onChange(nextValue);
    }
  }

  function toggleOpen() {
    if (!open) {
      updateMenuMaxHeight();
    }
    setOpen((nextOpen) => !nextOpen);
  }

  function openMenu() {
    updateMenuMaxHeight();
    setOpen(true);
  }

  const menu = open ? (
    <div ref={menuRef} className="custom-select-menu" role="listbox" aria-label={ariaLabel}>
      <div className="custom-select-menu-options">
        {normalizedOptions.map((opt) => {
          const selectedOption = opt.value === value;
          const optionClassName = getOptionClassName?.(opt.label, opt.value);
          const optionDisabled = opt.disabled || false;
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="option"
              disabled={optionDisabled}
              aria-selected={selectedOption}
              data-selected={selectedOption ? 'true' : undefined}
              className={[selectedOption ? 'selected' : '', optionClassName].filter(Boolean).join(' ')}
              onClick={() => choose(opt.value)}
            >
              <span>{renderOption?.(opt.label, opt.value) ?? (
                <>
                  {opt.icon && <span className="custom-select-option-icon">{opt.icon}</span>}
                  {opt.label}
                </>
              )}</span>
              {showSelectedCheck && selectedOption && <Check size={15} />}
            </button>
          );
        })}
      </div>
      {renderMenuFooter && (
        <div className="custom-select-menu-footer">
          {renderMenuFooter(() => setOpen(false))}
        </div>
      )}
    </div>
  ) : null;

  const portalTarget = floatingMenu
    ? (rootRef.current?.closest('.shell') as HTMLElement | null) ?? document.body
    : null;

  const displayLabel = selected?.label ?? String(value);

  const rootClassName = [
    'custom-select',
    className,
    open ? 'open' : '',
    `menu-${menuPlacement}`,
    disabled ? 'disabled' : ''
  ].filter(Boolean).join(' ');

  const floatingLayerClassName = [
    'custom-select',
    'custom-select-floating-layer',
    'open',
    `menu-${menuPlacement}`,
    suspendOutsideClose ? 'dialog-suspended' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={rootRef}
      id={id}
      className={rootClassName}
      style={{ '--custom-select-menu-max-height': `${menuMaxHeight}px` } as CSSProperties}
    >
      <button
        type="button"
        className="custom-select-button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggleOpen}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openMenu();
          }
          if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
      >
        <span>{renderValue?.(displayLabel, selected?.value ?? value) ?? displayLabel}</span>
        <ChevronDown size={18} />
      </button>
      {floatingMenu && portalTarget && menu
        ? createPortal(
          <div
            className={floatingLayerClassName}
            style={floatingMenuStyle}
          >
            {menu}
          </div>,
          portalTarget
        )
        : menu}
    </div>
  );
}
