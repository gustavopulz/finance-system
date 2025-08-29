import axios from 'axios';
import type { User } from './types';

const API_URL = 'https://finance-system-api.prxlab.app/api';
// const API_URL = 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// -------------------- Controle de fila --------------------
let isRefreshing = false;
let failedQueue: any[] = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

// 🔥 Handlers globais
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(cb: () => void) {
  onAuthFailure = cb;
}

let onUserRefresh: ((user: User) => void) | null = null;
export function setUserRefreshHandler(cb: (user: User) => void) {
  onUserRefresh = cb;
}

// -------------------- Interceptor --------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const errorCode = error.response?.data?.error;

    if (
      ['refresh_token_expired', 'refresh_token_invalid'].includes(errorCode)
    ) {
      if (onAuthFailure) onAuthFailure();
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    if (errorCode === 'token_expired') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        const res = await api.post('/user/refresh');

        if (onUserRefresh && res.data?.user) {
          onUserRefresh(res.data.user);
        }

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

// -------------------- Utils --------------------
export function normalizeUser(u: any): User | null {
  if (u?.id && u?.email && u?.role && u?.name) {
    return {
      id: String(u.id),
      email: String(u.email),
      role: u.role as 'admin' | 'user',
      name: String(u.name),
    };
  }
  return null;
}

// -------------------- ENDPOINTS --------------------
export async function login(email: string, password: string) {
  const res = await api.post('/user/login', { email, password });
  return res.data;
}

export async function logout() {
  try {
    await api.post('/user/logout');
  } catch {}
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
  const res = await api.get('/user/me');
  return res.data;
}

// 👥 Users
export async function listUsers() {
  const res = await api.get('/users');
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

export async function updateUserEmail(email: string) {
  const res = await api.patch('/user/me/email', { email });
  return res.data;
}

export async function updateName(name: string) {
  const res = await api.patch('/user/me', { name });
  return res.data;
}

export async function updateUserPassword(password: string) {
  const res = await api.patch('/user/me/password', { password });
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

export async function unlinkUser(
  otherUserId: string,
  direction: 'i-see' | 'see-me'
) {
  const res = await api.delete(`/shared/unlink/${otherUserId}/${direction}`);
  return res.data;
}

// Token and link configurations
export async function getTokenConfig() {
  const res = await api.get('/shared/token-config');
  return res.data as { token: string | null; allowedCollabIds: string[] };
}

export async function saveTokenConfig(allowedCollabIds: string[]) {
  const res = await api.put('/shared/token-config', { allowedCollabIds });
  return res.data;
}

export async function getLinkConfig(
  otherUserId: string,
  direction: 'i-see' | 'see-me' = 'see-me'
) {
  const res = await api.get(
    `/shared/link-config/${otherUserId}?direction=${direction}`
  );
  return res.data as { allowedCollabIds: string[] };
}

export async function saveLinkConfig(
  otherUserId: string,
  allowedCollabIds: string[],
  direction: 'i-see' | 'see-me' = 'see-me'
) {
  const res = await api.put(
    `/shared/link-config/${otherUserId}?direction=${direction}`,
    {
      allowedCollabIds,
    }
  );
  return res.data;
}
