const API_URL = 'https://finance-system-api.prxlab.app/api';

// -------------------- REGISTER --------------------
export function registerUser(email: string, password: string, name: string) {
  return json<{ success?: boolean; message?: string }>(
    `${API_URL}/user/register`,
    {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }
  );
}

export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/users/me`, {
    credentials: 'include',
  });
  if (!res.ok) return { user: null };
  const data = await res.json();
  if (data?.username && data?.id && data?.role) {
    return {
      user: {
        id: data.id,
        email: String(data.email),
        username: String(data.username),
        role: String(data.role),
      },
    };
  }
  return { user: null };
}

// Salva a ordem dos colaboradores
export async function saveCollabOrder(order: string[]) {
  const res = await fetch(`${API_URL}/collabs/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order }),
    credentials: 'include', // garante envio do cookie de autenticação
  });
  if (!res.ok) throw new Error('Erro ao salvar ordem');
  return await res.json();
}

// -------------------- UPDATE USER --------------------
export function updateUserName(username: string) {
  return json<{ success: boolean; username: string }>(`${API_URL}/users/me`, {
    method: 'PATCH',
    body: JSON.stringify({ username }),
  });
}

export function updateUserPassword(password: string) {
  return json<{ success: boolean }>(`${API_URL}/users/me/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}
// -------------------- GET TOKEN --------------------
export function getToken(): string | null {
  // Token is now stored in httpOnly cookie, not accessible from JS
  return null;
}

// -------------------- FETCH JSON --------------------
async function json<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include', // send cookies
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
// -------------------- USERS (Admin) --------------------
export function listUsers() {
  return json<{ id: number; username: string; role: string }[]>(
    `${API_URL}/users`
  );
}

export function addUser(
  username: string,
  password: string,
  role: string = 'user'
) {
  return json<{ id: number; username: string; role: string }>(
    `${API_URL}/users`,
    {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    }
  );
}

export function deleteUser(id: number) {
  return json<{ success: boolean }>(`${API_URL}/users/${id}`, {
    method: 'DELETE',
  });
}

export async function login(email: string, password: string) {
  const data = await json<{
    user: {
      username: string;
      id: number;
      email: string;
      role: 'admin' | 'user';
    };
  }>(`${API_URL}/user/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  // No token in response, cookie is set by backend
  return data;
}

export function logout() {
  // Chama o endpoint de logout para limpar o cookie httpOnly
  fetch(`${API_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  // Limpa dados locais de autenticação
  localStorage.removeItem('auth');
}

// -------------------- COLLABORATORS --------------------
// Agora cada colaborador é vinculado ao usuário logado
export function listCollabs() {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const userId = auth?.user?.id;
  return json<{ id: number; name: string }[]>(
    `${API_URL}/collabs?userId=${userId}`
  );
}

export function addCollab(name: string) {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const userId = auth?.user?.id;
  return json<{ id: number; name: string }>(`${API_URL}/collabs`, {
    method: 'POST',
    body: JSON.stringify({ nome: name, userId }),
  });
}

export function deleteCollab(id: string) {
  return json<{ success: boolean }>(`${API_URL}/collabs/${id}`, {
    method: 'DELETE',
  });
}

// -------------------- ACCOUNTS --------------------
export function listAccounts(month: number, year: number) {
  // seu backend pode ignorar os filtros; mantemos para futuro
  return json<any[]>(`${API_URL}/accounts?month=${month}&year=${year}`);
}

// -------------------- SHARE TOKEN --------------------
export function generateShareToken() {
  return json<{ token: string }>(`${API_URL}/shared/generate-token`, {
    method: 'POST',
  });
}

export function useShareToken(token: string) {
  return json<{ success?: boolean; error?: string }>(
    `${API_URL}/shared/use-token`,
    {
      method: 'POST',
      body: JSON.stringify({ token }),
    }
  );
}

export function getMergedFinances() {
  return json<{ accounts: any[]; collabs: any[] }>(
    `${API_URL}/shared/finances`
  );
}

export function addAccount(payload: any) {
  return json(`${API_URL}/accounts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAccount(id: string, payload: any) {
  return json(`${API_URL}/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteAccount(id: string) {
  return json(`${API_URL}/accounts/${id}`, { method: 'DELETE' });
}

export function toggleCancel(id: string, month?: number, year?: number) {
  const body: any = {};
  if (month) body.month = month;
  if (year) body.year = year;
  return json(`${API_URL}/accounts/${id}/toggle-cancel`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function markAccountPaid(id: string, paid: boolean) {
  return json(`${API_URL}/accounts/${id}/mark-paid`, {
    method: 'PATCH',
    body: JSON.stringify({ paid }),
  });
}
