import type { ElementType, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type GlassVariant = "hero" | "card" | "control" | "subtle";

type GlassPanelProps = {
  as?: ElementType;
  variant?: GlassVariant;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
};

export function GlassPanel({
  as: Component = "div",
  variant = "card",
  interactive = false,
  className,
  children,
}: GlassPanelProps) {
  return (
    <Component
      className={cn(
        "liquid-glass",
        `liquid-glass--${variant}`,
        interactive && "liquid-glass--interactive",
        className,
      )}
    >
      {children}
    </Component>
  );
}
