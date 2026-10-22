import { cn } from "@/lib/utils";
import { Chevrons } from "./chevrons";
import { ScrambleText } from "./scramble-text";

/**
 * Служебная шапка секции: «[02] НАПРАВЛЕНИЯ  »»»»»»». Номер и подпись расшифровываются,
 * шевроны бегут в ритме. Ставится над MotionBlurTitle.
 *   <SectionLabel index="02" label="Направления" />
 */
export function SectionLabel({
  index,
  label,
  className,
  tone = "toxic",
  bpm = 120,
}: {
  index: string;
  label: string;
  className?: string;
  tone?: "toxic" | "ink" | "paper" | "cobalt";
  bpm?: number;
}) {
  const color = { toxic: "text-toxic", ink: "text-ink", paper: "text-paper", cobalt: "text-cobalt" }[tone];
  return (
    <div className={cn("flex items-center gap-4", color, className)}>
      <ScrambleText text={`[${index}]`} className="label opacity-80" />
      <ScrambleText text={label} className="label" />
      <span className="h-px flex-1 bg-current opacity-25" />
      <Chevrons count={6} bpm={bpm} className="h-3.5" size="0.9rem" />
    </div>
  );
}
