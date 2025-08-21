// src/lib/api.ts
const API_URL = 'http://localhost:4000/api';

// -------------------- GET TOKEN --------------------
function getToken(): string | null {
  const raw = localStorage.getItem('auth');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.token ?? null;
    } catch {}
  }
  return null;
}

// -------------------- FETCH JSON --------------------
async function json<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    let message = '';
    try {
      message = await res.text();
    } catch {
      message = res.statusText;
    }

    throw new Error(message || `HTTP ${res.status}`);
  }

  return res.json();
}

// -------------------- AUTH --------------------
export async function login(username: string, password: string) {
  const data = await json<{
    token: string;
    user: { id: number; username: string; role: 'admin' | 'user' };
  }>(`${API_URL}/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  // 🔑 sempre salva em "auth"
  localStorage.setItem('auth', JSON.stringify(data));
  return data;
}

export function logout() {
  localStorage.removeItem('auth');
}

// -------------------- COLLABORATORS --------------------
export function listCollabs() {
  return json<{ id: number; name: string }[]>(`${API_URL}/collabs`);
}

export function addCollab(name: string) {
  return json<{ id: number; name: string }>(`${API_URL}/collabs`, {
    method: 'POST',
    body: JSON.stringify({ nome: name }),
  });
}

export function deleteCollab(id: number) {
  return json<{ success: boolean }>(`${API_URL}/collabs/${id}`, {
    method: 'DELETE',
  });
}

// -------------------- ACCOUNTS --------------------
export function listAccounts(month: number, year: number) {
  // seu backend pode ignorar os filtros; mantemos para futuro
  return json<any[]>(`${API_URL}/accounts?month=${month}&year=${year}`);
}

export function addAccount(payload: any) {
  return json(`${API_URL}/accounts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAccount(id: number, payload: any) {
  return json(`${API_URL}/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteAccount(id: number) {
  return json(`${API_URL}/accounts/${id}`, { method: 'DELETE' });
}

export function toggleCancel(id: number) {
  return json(`${API_URL}/accounts/${id}/toggle-cancel`, { method: 'PATCH' });
}
