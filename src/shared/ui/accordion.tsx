"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/** Lightweight disclosure used for the client's contextual help. */
export function Accordion({ title, children, defaultOpen = false, className }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("portal-accordion rounded-xl border border-slate-200 bg-slate-50", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="portal-accordion-button flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-slate-800"
      >
        <span>{title}</span>
        <span
          className={cn(
            "portal-accordion-arrow text-slate-400 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="portal-accordion-content px-4 pb-4 text-sm leading-relaxed text-slate-600">{children}</div>
      )}
    </div>
  );
}
