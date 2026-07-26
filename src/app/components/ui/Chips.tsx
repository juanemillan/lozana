const chip =
  'cursor-pointer rounded-[10px] border px-3 py-1.5 font-mono text-[11px] tracking-wide ' +
  'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage';

const on = 'border-transparent bg-sage text-white';
const off = 'border-line-strong bg-surface text-ink-soft hover:bg-sage-tint hover:text-sage-deep';

/** Una sola opción. Volver a tocar la elegida la deselecciona. */
export function ChipSelect({
  options,
  value,
  onChange,
  label,
  getOptionLabel = (option) => option,
}: {
  options: readonly string[];
  value: string | null;
  onChange: (v: string | null) => void;
  label: string;
  getOptionLabel?: (option: string) => string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? null : o)}
            className={`${chip} ${active ? on : off}`}
          >
            {getOptionLabel(o)}
          </button>
        );
      })}
    </div>
  );
}

/** Varias opciones a la vez. */
export function ChipMultiSelect({
  options,
  value,
  onChange,
  label,
  getOptionLabel = (option) => option,
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  label: string;
  getOptionLabel?: (option: string) => string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? value.filter((v) => v !== o) : [...value, o])}
            className={`${chip} ${active ? on : off}`}
          >
            {getOptionLabel(o)}
          </button>
        );
      })}
    </div>
  );
}
