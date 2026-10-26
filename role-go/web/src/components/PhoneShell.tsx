import type { ReactNode } from 'react'

// Contorno neon do celular na cor da categoria da tela (manual: .phone / .phone.c / .phone.m / .phone.y).
export type PhoneAccent = 'violet' | 'cyan' | 'magenta' | 'yellow'

export function PhoneShell({
  children,
  footer,
  accent = 'violet',
}: {
  children: ReactNode
  footer?: ReactNode
  accent?: PhoneAccent
}) {
  return (
    <div className="phone-stage">
      <div className={`phone-frame ${accent}`}>
        <div className="phone-screen">
          <div className="phone-notch" />
          <div className="phone-status">
            <span>9:41</span>
            <span className="phone-icons" aria-hidden="true">
              <svg viewBox="0 0 16 10" width="17" height="11">
                <rect x="0" y="6" width="3" height="4" rx=".6" fill="#fff" />
                <rect x="4.3" y="4" width="3" height="6" rx=".6" fill="#fff" />
                <rect x="8.6" y="2" width="3" height="8" rx=".6" fill="#fff" />
                <rect x="12.9" y="0" width="3" height="10" rx=".6" fill="#fff" />
              </svg>
              <svg viewBox="0 0 16 12" width="15" height="11">
                <path
                  d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0zM3.4 6.8a6.5 6.5 0 0 1 9.2 0l-1.4 1.4a4.5 4.5 0 0 0-6.4 0zM1 4.4a10 10 0 0 1 14 0l-1.4 1.4a8 8 0 0 0-11.2 0z"
                  fill="#fff"
                />
              </svg>
              <svg viewBox="0 0 24 12" width="25" height="12">
                <rect x=".5" y=".5" width="20" height="11" rx="3" fill="none" stroke="#fff" strokeOpacity=".5" />
                <rect x="2" y="2" width="15" height="8" rx="1.6" fill="#fff" />
                <rect x="21.5" y="4" width="2" height="4" rx="1" fill="#fff" fillOpacity=".5" />
              </svg>
            </span>
          </div>
          <div className="phone-body">{children}</div>
          {footer}
        </div>
      </div>
    </div>
  )
}
