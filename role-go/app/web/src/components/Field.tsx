import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'
import { Icon, type IconName } from './Icon'

export function Field({
  label,
  icon,
  ...input
}: { label: string; icon?: IconName } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        {icon && <Icon name={icon} size={16} />}
        <input id={id} {...input} />
      </div>
    </div>
  )
}
