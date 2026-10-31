import { Icon } from './Icon'

export function ErrorToast({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="toast m" role="alert">
      <Icon name="x" />
      <span>{message}</span>
    </div>
  )
}
