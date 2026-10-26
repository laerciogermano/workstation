import type { ReactNode } from 'react'

export function PhoneShell({
  children,
  footer,
}: {
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="phone-stage">
      <div className="phone-frame">
        <div className="phone-status">
          <span>9:41</span>
          <span>RoleGo</span>
        </div>
        <div className="phone-body">{children}</div>
        {footer}
      </div>
    </div>
  )
}
