// Flat button — adds class mapping + sensible defaults around <button>.
// Plays nicely with anchor variants via `as="a"`.

import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react"

export type BrandButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"

export type BrandButtonSize = "sm" | "md" | "lg"

type BaseProps = {
  children: ReactNode
  variant?: BrandButtonVariant
  size?: BrandButtonSize
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
}

type ButtonProps = BaseProps & {
  as?: "button"
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">

type AnchorProps = BaseProps & {
  as: "a"
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children">

function cls(variant: BrandButtonVariant, size: BrandButtonSize, extra?: string) {
  const sizeClass = size === "md" ? "" : size === "lg" ? "sl-btn-lg" : "sl-btn-sm"
  return [
    "sl-btn",
    `sl-btn-${variant}`,
    sizeClass,
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ")
}

export function BrandButton(props: ButtonProps | AnchorProps) {
  const {
    variant = "primary",
    size = "md",
    leading,
    trailing,
    children,
    className,
    ...rest
  } = props
  const classes = cls(variant, size, className)
  const inner = (
    <>
      {leading}
      <span>{children}</span>
      {trailing}
    </>
  )
  if (props.as === "a") {
    const anchorRest = rest as AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <a className={classes} {...anchorRest}>
        {inner}
      </a>
    )
  }
  const btnRest = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button
      type={btnRest.type ?? "button"}
      className={classes}
      {...btnRest}
    >
      {inner}
    </button>
  )
}
