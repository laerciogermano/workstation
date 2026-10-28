import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { getToken, installAuthFetch } from './auth.js';
import LoginPage from './login.jsx';
import './index.css';

installAuthFetch();

const isLogin = window.location.pathname.startsWith('/login');
const authed = Boolean(getToken());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isLogin ? (
      <LoginPage />
    ) : authed ? (
      <App />
    ) : (
      <LoginRedirect />
    )}
  </StrictMode>,
);

function LoginRedirect() {
  const next = encodeURIComponent(
    window.location.pathname + window.location.search,
  );
  window.location.replace(`/login?next=${next}`);
  return null;
}
