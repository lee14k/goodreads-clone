"use client";

import { useState } from "react";

type Props = {
  value: number | null;
  onChange?: (value: number | null) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
};

export function StarRating({ value, onChange, readOnly = false, size = "md" }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;
  const px = size === "sm" ? "text-base" : "text-xl";

  return (
    <div className={`inline-flex gap-0.5 ${px}`} onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onClick={() => onChange?.(value === n ? null : n)}
          className={`leading-none ${readOnly ? "cursor-default" : "cursor-pointer"} ${
            n <= display ? "text-accent" : "text-line"
          }`}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
