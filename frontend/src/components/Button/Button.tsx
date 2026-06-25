import type { ButtonHTMLAttributes } from "react";

import "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Square button sized for a single icon/glyph. */
  iconOnly?: boolean;
}

/**
 * The standard button used across the app. Variants and sizes are driven by
 * the global design tokens (see index.css), so every button stays consistent.
 *
 * Defaults to `type="button"` to avoid accidental form submits.
 */
export function Button({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  const classes = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    iconOnly && "btn-icon",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button type={type} className={classes} {...rest} />;
}
