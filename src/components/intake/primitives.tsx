import * as React from "react";
import { cn } from "@/lib/utils";

export function Chip({
  active,
  onClick,
  children,
  disabled,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-12 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        disabled && "opacity-50",
      )}
    >
      {children}
    </button>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  multi,
  max,
}: {
  options: { value: T; label: string }[];
  value: T | T[] | undefined;
  onChange: (v: T | T[]) => void;
  multi?: boolean;
  max?: number;
}) {
  const isActive = (v: T) =>
    multi ? Array.isArray(value) && value.includes(v) : value === v;
  const toggle = (v: T) => {
    if (!multi) return onChange(v);
    const arr = Array.isArray(value) ? [...value] : [];
    const idx = arr.indexOf(v);
    if (idx >= 0) arr.splice(idx, 1);
    else if (!max || arr.length < max) arr.push(v);
    onChange(arr);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.value} active={isActive(o.value)} onClick={() => toggle(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-2xl border bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-10 rounded-xl px-4 text-sm font-medium transition-colors",
            value === o.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Rating({
  value,
  onChange,
  max = 5,
}: {
  value: number | undefined;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} of ${max}`}
          onClick={() => onChange(n)}
          className={cn(
            "h-11 w-11 rounded-full border text-sm font-semibold transition-colors",
            value && n <= value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/50",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  suffix,
}: {
  value: number | undefined;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const v = value ?? 0;
  const [text, setText] = React.useState<string>(value !== undefined ? String(value) : "");
  React.useEffect(() => {
    setText(value !== undefined ? String(value) : "");
  }, [value]);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const commit = (raw: string) => {
    if (raw.trim() === "") {
      setText("");
      return;
    }
    const n = Number(raw);
    if (Number.isFinite(n)) {
      const c = clamp(+n.toFixed(2));
      onChange(c);
      setText(String(c));
    } else {
      setText(value !== undefined ? String(value) : "");
    }
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border bg-card p-1.5">
      <button
        type="button"
        onClick={() => onChange(clamp(+(v - step).toFixed(2)))}
        className="h-10 w-10 shrink-0 rounded-xl bg-muted text-lg font-semibold hover:bg-accent"
        aria-label="Decrease"
      >
        −
      </button>
      <div className="flex items-center">
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^0-9.\-]/g, ""))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder="—"
          className="w-16 bg-transparent text-center text-base font-semibold tabular-nums outline-none focus:ring-0"
        />
        {suffix ? <span className="ml-1 text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(clamp(+(v + step).toFixed(2)))}
        className="h-10 w-10 shrink-0 rounded-xl bg-muted text-lg font-semibold hover:bg-accent"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}


export function YesNo({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <Segmented
      options={[
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ]}
      value={value === undefined ? undefined : value ? "yes" : "no"}
      onChange={(v) => onChange(v === "yes")}
    />
  );
}

export function FieldLabel({
  children,
  hint,
  required,
}: {
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-3">
      <div className="text-base font-semibold text-foreground">
        {children}
        {required ? <span className="ml-1 text-primary">*</span> : null}
      </div>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
