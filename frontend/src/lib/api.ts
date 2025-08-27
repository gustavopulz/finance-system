const API_URL = 'https://finance-system-api.prxlab.app/api';
// const API_URL = 'http://localhost:3000/api';

// -------------------- GET REQUESTS --------------------
// /users/me
export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/users/me`, {
    credentials: 'include',
  });
  if (!res.ok) return { user: null };
  const data = await res.json();
  if (data?.name && data?.id && data?.role) {
    return {
      user: {
        id: data.id,
        email: String(data.email),
        name: String(data.name),
        role: String(data.role),
      },
    };
  }
  return { user: null };
}

// /users
export function listUsers() {
  return json<{ id: number; name: string; role: string }[]>(`${API_URL}/users`);
}

// /collabs?userId=...
export function listCollabs() {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const userId = auth?.user?.id;
  return json<{ id: number; name: string }[]>(
    `${API_URL}/collabs?userId=${userId}`
  );
}

// /accounts?month=...&year=...
export function listAccounts(month: number, year: number) {
  return json<any[]>(`${API_URL}/accounts?month=${month}&year=${year}`);
}

// /shared/finances
export function getMergedFinances(year: number, month: number) {
  return json<{ accounts: any[]; collabs: any[] }>(
    `${API_URL}/shared/finances`,
    {
      method: 'POST',
      body: JSON.stringify({ year, month }),
    }
  );
}

// /shared/links
export async function getLinks() {
  return json<{
    iSee: { id: number; name: string }[];
    seeMe: { id: number; name: string }[];
  }>(`${API_URL}/shared/links`);
}

// -------------------- POST REQUESTS --------------------
// /user/register
export function registerUser(email: string, password: string, name: string) {
  return json<{ success?: boolean; message?: string }>(
    `${API_URL}/user/register`,
    {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }
  );
}

// /users
export function addUser(name: string, password: string, role: string = 'user') {
  return json<{ id: number; name: string; role: string }>(`${API_URL}/users`, {
    method: 'POST',
    body: JSON.stringify({ name, password, role }),
  });
}

// /collabs
export function addCollab(name: string) {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const userId = auth?.user?.id;
  return json<{ id: number; name: string }>(`${API_URL}/collabs`, {
    method: 'POST',
    body: JSON.stringify({ nome: name, userId }),
  });
}

// /collabs/order
export async function saveCollabOrder(order: string[]) {
  const res = await fetch(`${API_URL}/collabs/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Erro ao salvar ordem');
  return await res.json();
}

// /shared/generate-token
export function generateShareToken() {
  return json<{ token: string }>(`${API_URL}/shared/generate-token`, {
    method: 'POST',
  });
}

// /shared/use-token
export function useShareToken(token: string) {
  return json<{ success?: boolean; error?: string }>(
    `${API_URL}/shared/use-token`,
    {
      method: 'POST',
      body: JSON.stringify({ token }),
    }
  );
}

// /accounts
export function addAccount(payload: any) {
  return json(`${API_URL}/accounts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// /user/login
export async function login(email: string, password: string) {
  const data = await json<{
    user: {
      name: string;
      id: number;
      email: string;
      role: 'admin' | 'user';
    };
  }>(`${API_URL}/user/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  return data;
}

// /user/logout
export function logout() {
  fetch(`${API_URL}/user/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  localStorage.removeItem('auth');
}

// -------------------- PATCH REQUESTS --------------------
// /users/me
export function updatename(name: string) {
  return json<{ success: boolean; name: string }>(`${API_URL}/users/me`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

// /users/me/password
export function updateUserPassword(password: string) {
  return json<{ success: boolean }>(`${API_URL}/users/me/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

// /users/{id}
export async function changeUserRole(id: number, role: string) {
  return fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
    credentials: 'include',
  });
}

// /accounts/{id}
export function updateAccount(id: string, payload: any) {
  return json(`${API_URL}/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// /accounts/{id}/toggle-cancel
export function toggleCancel(id: string, month?: number, year?: number) {
  const body: any = {};
  if (month) body.month = month;
  if (year) body.year = year;
  return json(`${API_URL}/accounts/${id}/toggle-cancel`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// /accounts/{id}/mark-paid
export async function markAccountPaid(
  id: string,
  paid: boolean,
  month?: number,
  year?: number
) {
  const body: any = { paid };
  if (month && year) {
    body.month = month;
    body.year = year;
  }

  return json(`${API_URL}/accounts/${id}/mark-paid`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// -------------------- DELETE REQUESTS --------------------
// /users/{id}
export function deleteUser(id: number) {
  return json<{ success: boolean }>(`${API_URL}/users/${id}`, {
    method: 'DELETE',
  });
}

// /collabs/{id}
export function deleteCollab(id: string) {
  return json<{ success: boolean }>(`${API_URL}/collabs/${id}`, {
    method: 'DELETE',
  });
}

// /accounts/{id}
export function deleteAccount(id: string) {
  return json(`${API_URL}/accounts/${id}`, { method: 'DELETE' });
}

// /shared/unlink/{otherUserId}/{direction}
export function unlinkUser(otherUserId: string, direction: 'i-see' | 'see-me') {
  return fetch(`${API_URL}/shared/unlink/${otherUserId}/${direction}`, {
    method: 'DELETE',
    credentials: 'include',
  }).then(async (res) => {
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || 'Erro ao desvincular usuário');
    }
    return res.json();
  });
}

// -------------------- UTILS --------------------
async function json<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
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
