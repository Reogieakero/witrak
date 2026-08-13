"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import styles from "./select.module.css";

export type SelectOption = { value: string; label: string };

type SelectProps = {
  name: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
};

export function Select({
  name,
  value,
  placeholder = "Select…",
  options,
  onChange,
}: SelectProps) {
  const [internal, setInternal] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = onChange ? (value ?? "") : internal;
  const commit = (v: string) => {
    if (onChange) {
      onChange(v);
    } else {
      setInternal(v);
    }
    setOpen(false);
  };

  const current = options.find((o) => o.value === selected);

  return (
    <div ref={rootRef} className={styles.root} data-open={open || undefined}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={styles.triggerText}
          data-placeholder={!current || undefined}
        >
          {current ? current.label : placeholder}
        </span>
        <ChevronDown size={14} className={styles.chevron} />
      </button>

      <input type="hidden" name={name} value={selected} />

      {open && (
        <div className={styles.menu} role="listbox">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === selected}
              className={styles.menuItem}
              data-selected={o.value === selected || undefined}
              onClick={() => commit(o.value)}
            >
              <span>{o.label}</span>
              {o.value === selected && <Check size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}