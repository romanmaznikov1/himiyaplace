import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Кнопка-наклейка: слегка повёрнута, жёсткая тень-смещение, при наведении выпрямляется
 * и «вдавливается». Роль красных кнопок PURCHASE/SIGN UP из референсов.
 *
 *   <StickerButton href={CONTACTS.telegram.url} variant="toxic" tilt={-3}>Пробное 350 ₽</StickerButton>
 */
type Variant = "cobalt" | "toxic" | "ink" | "paper" | "outline";

const variants: Record<Variant, string> = {
  cobalt: "bg-cobalt text-paper [--shadow-color:var(--color-toxic)]",
  toxic: "bg-toxic text-ink [--shadow-color:var(--color-cobalt)]",
  ink: "bg-ink text-toxic [--shadow-color:var(--color-toxic)]",
  paper: "bg-paper text-ink [--shadow-color:var(--color-cobalt)]",
  outline: "border border-paper/70 bg-ink/40 text-paper [--shadow-color:transparent] hover:bg-paper hover:text-ink",
};

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  tilt?: number;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  /** Цвет жёсткой тени; по умолчанию у каждого варианта свой. */
  shadow?: string;
};

const sizes = {
  sm: "px-3.5 py-2 text-[0.72rem]",
  md: "px-5 py-3 text-[0.82rem]",
  lg: "px-7 py-4 text-[0.95rem]",
};

export function StickerButton({ variant = "cobalt", tilt = -2, size = "md", icon, shadow, className, children, style, ...rest }: Props) {
  const external = rest.href?.startsWith("http");
  return (
    <a
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
      data-cursor="hover"
      className={cn(
        "group/sticker relative inline-flex select-none items-center justify-center gap-2 font-sans font-bold uppercase tracking-[0.1em]",
        "shadow-hard rotate-[var(--tilt)] transition-[translate,rotate,box-shadow,background-color,color] duration-200 ease-[var(--ease-snap)]",
        "hover:translate-x-[3px] hover:translate-y-[3px] hover:rotate-0 hover:shadow-[3px_3px_0_0_var(--shadow-color)]",
        "active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        variants[variant],
        sizes[size],
        className,
      )}
      style={{ "--tilt": `${tilt}deg`, ...(shadow ? { "--shadow-color": shadow } : {}), ...style } as CSSProperties}
    >
      {icon && <span className="grid size-[1.2em] place-items-center [&>svg]:size-full">{icon}</span>}
      <span>{children}</span>
    </a>
  );
}

export const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M21.8 3.3 2.9 10.6c-1.3.5-1.3 1.3-.2 1.6l4.8 1.5 1.9 5.7c.2.7.7.9 1.2.6l2.3-2.1 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.5-1.8-1.6-1.7z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
  </svg>
);
