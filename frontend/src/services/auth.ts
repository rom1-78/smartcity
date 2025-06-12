export const TOKEN_KEY = 'userToken';
export const ROLE_KEY = 'userRole';

export function setToken(token: string, role?: string) {
  localStorage.setItem(TOKEN_KEY, token);
  if (role) localStorage.setItem(ROLE_KEY, role);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

// Décoder le JWT (JSON Web Token) pour obtenir l'email/role si présent dans le token 
export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      first_name: payload.first_name,
      last_name: payload.last_name,
      role: payload.role,
      email: payload.email,
    };
  } catch {
    return null;
  }
}
