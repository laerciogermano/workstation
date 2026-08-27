import { useState } from 'react';
import { Link } from 'react-router-dom';
import { notifications } from '../../data/mockData';

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const count = notifications.length;

  return (
    <div className="notifications-panel">
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => setOpen(!open)}
        aria-label="Notificações"
      >
        🔔
        {count > 0 && <span className="notif-badge">{count}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          {notifications.map((n) => (
            <div className="notif-item" key={n.id}>
              <Link to={n.link} onClick={() => setOpen(false)}>
                {n.text}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
