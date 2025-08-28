import axios from 'axios';

const API_URL = 'https://finance-system-api.prxlab.app/api';
// const API_URL = 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // 🔒 manda cookies em todas as requisições
  headers: { 'Content-Type': 'application/json' },
});

// Controle do refresh para evitar chamadas paralelas
let isRefreshing = false;
let failedQueue: any[] = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// 🔥 Handler configurável para falha de autenticação (refresh inválido/expirado)
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(cb: () => void) {
  onAuthFailure = cb;
}

// Interceptor para refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // 🔥 Refresh inválido/expirado → força logout
    if (
      ['refresh_token_expired', 'refresh_token_invalid'].includes(
        error.response?.data?.error
      )
    ) {
      if (onAuthFailure) onAuthFailure();
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // 🔄 Access token expirado → tenta refresh
    if (error.response.data?.error === 'token_expired') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        await api.post('/user/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (onAuthFailure) onAuthFailure();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

//
// -------------------- ENDPOINTS --------------------
//

// 🔑 Auth
export async function login(email: string, password: string) {
  const res = await api.post('/user/login', { email, password });
  return res.data;
}

export async function logout() {
  try {
    await api.post('/user/logout');
  } catch {}
  localStorage.removeItem('auth');
}

export async function registerUser(
  email: string,
  password: string,
  name: string
) {
  const res = await api.post('/user/register', { email, password, name });
  return res.data;
}

export async function getCurrentUser() {
  const res = await api.get('/users/me');
  return res.data;
}

// 👥 Users
export async function listUsers() {
  const res = await api.get('/users');
  return res.data;
}

export async function addUser(name: string, password: string, role: string = 'user') {
  const res = await api.post('/users', { name, password, role });
  return res.data;
}

export async function changeUserRole(id: number, role: string) {
  const res = await api.patch(`/users/${id}`, { role });
  return res.data;
}

export async function deleteUser(id: number) {
  const res = await api.delete(`/users/${id}`);
  return res.data;
}

export async function updateName(name: string) {
  const res = await api.patch('/users/me', { name });
  return res.data;
}

export async function updateUserPassword(password: string) {
  const res = await api.patch('/users/me/password', { password });
  return res.data;
}

// 🤝 Collabs
export async function listCollabs(userId: string) {
  const res = await api.get(`/collabs?userId=${userId}`);
  return res.data;
}

export async function addCollab(name: string) {
  const res = await api.post('/collabs', { nome: name });
  return res.data;
}

export async function saveCollabOrder(order: string[]) {
  const res = await api.post('/collabs/order', { order });
  return res.data;
}

export async function deleteCollab(id: string) {
  const res = await api.delete(`/collabs/${id}`);
  return res.data;
}

// 💰 Accounts
export async function listAccounts(month: number, year: number) {
  const res = await api.get(`/accounts?month=${month}&year=${year}`);
  return res.data;
}

export async function addAccount(payload: any) {
  const res = await api.post('/accounts', payload);
  return res.data;
}

export async function updateAccount(id: string, payload: any) {
  const res = await api.put(`/accounts/${id}`, payload);
  return res.data;
}

export async function markAccountPaid(accounts: string[], paid: boolean) {
  const res = await api.patch('/accounts/mark-paid', { accounts, paid });
  return res.data;
}

export async function toggleCancel(id: string, month?: number, year?: number) {
  const body: any = {};
  if (month) body.month = month;
  if (year) body.year = year;
  const res = await api.patch(`/accounts/${id}/toggle-cancel`, body);
  return res.data;
}

export async function deleteAccount(ids: string[] | string) {
  const res = await api.delete('/accounts/delete', {
    data: { accounts: Array.isArray(ids) ? ids : [ids] },
  });
  return res.data;
}

// 🔗 Shared
export async function getMergedFinances(year: number, month: number) {
  const res = await api.post('/shared/finances', { year, month });
  return res.data;
}

export async function getLinks() {
  const res = await api.get('/shared/links');
  return res.data;
}

export async function generateShareToken() {
  const res = await api.post('/shared/generate-token');
  return res.data;
}

export async function useShareToken(token: string) {
  const res = await api.post('/shared/use-token', { token });
  return res.data;
}

export async function unlinkUser(otherUserId: string, direction: 'i-see' | 'see-me') {
  const res = await api.delete(`/shared/unlink/${otherUserId}/${direction}`);
  return res.data;
}
