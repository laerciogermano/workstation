const TOKEN_KEY = 'cx-access-token';
const USER_KEY = 'cx-auth-user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(accessToken, user) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function hasPermission(permission) {
  const user = getUser();
  const perms = user?.permissions;
  if (!perms?.length) return false;
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;
  const [res] = permission.split(':');
  return perms.includes(`${res}:*`);
}

/** Injeta Bearer em todo fetch; 401 → /login. */
export function installAuthFetch() {
  const orig = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const isLogin = url.includes('/auth/login');
    const headers = new Headers(init.headers || {});
    const token = getToken();
    if (token && !headers.has('Authorization') && !isLogin) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return orig(input, { ...init, headers }).then((res) => {
      if (res.status === 401 && !isLogin) {
        clearSession();
        if (!window.location.pathname.startsWith('/login')) {
          const next = encodeURIComponent(
            window.location.pathname + window.location.search,
          );
          window.location.href = `/login?next=${next}`;
        }
      }
      return res;
    });
  };
}
