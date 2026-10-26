import { useId, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

// Wordmark (manual: buildLogos), em unidades de font-size 100: Poppins 800 itálico,
// "Role" branco + "Go" neon; o "o" ganha uma ponta e vira pin, com o ping do ícone no miolo.
export function Wordmark({ size = 22, glow = false }: { size?: number; glow?: boolean }) {
  const id = useId()
  return (
    <svg
      className={`wm${glow ? ' glowing' : ''}`}
      width={size * 3.54}
      height={size * 1.08}
      viewBox="0 0 354 108"
      role="img"
      aria-label="RoleGo"
    >
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="214.11" x2="349.41" y1="0" y2="0">
          <stop offset="0" stopColor="#00E5E5" />
          <stop offset="0.5" stopColor="#8749FF" />
          <stop offset="1" stopColor="#FF1F7A" />
        </linearGradient>
      </defs>
      <text y="86" className="wm-text">
        <tspan fill="#fff">Role</tspan>
        <tspan fill={`url(#${id})`}>Go</tspan>
      </text>
      <path
        d="M342.2 70.9 L312.1 106 L291.9 70.9 Z"
        fill={`url(#${id})`}
        stroke={`url(#${id})`}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="319.1" cy="57.5" r="4.5" fill="#00E5E5" />
    </svg>
  )
}

// Símbolo / ícone do app: "R" sobre o gradiente de marca + ping ciano.
export function BrandSymbol({ size = 40 }: { size?: number }) {
  return (
    <span className="sym" style={{ ['--s' as string]: `${size}px` }}>
      <span>R</span>
      <i />
    </span>
  )
}

export function Slogan({ size = 11 }: { size?: number }) {
  return (
    <span className="slogan" style={{ fontSize: size }}>
      Viva o Rolê
    </span>
  )
}

// Cabeçalho das telas: voltar (opcional) + wordmark ou título curto.
export function TopBar({
  back,
  title,
  action,
}: {
  back?: string
  title?: string
  action?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="top-bar">
      {back && (
        <button className="back-btn" type="button" aria-label="Voltar" onClick={() => navigate(back)}>
          <Icon name="back" />
        </button>
      )}
      {title ? <span className="top-title">{title}</span> : <Wordmark />}
      <div className="spacer" />
      {action}
    </div>
  )
}
