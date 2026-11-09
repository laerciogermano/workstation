import { ICONS, type IconName } from './icons';

export function Icon({ name, className = '', label }: { name: IconName; className?: string; label?: string }) {
  return (
    <svg
      className={`i ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
export type { IconName };
