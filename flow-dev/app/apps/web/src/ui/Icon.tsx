import { ICONS } from "./icons";

export function Icon({ n, className }: { n: string; className?: string }) {
  const C = ICONS[n];
  if (!C) return null;
  return <C className={"lucide" + (className ? " " + className : "")} aria-hidden="true" />;
}
