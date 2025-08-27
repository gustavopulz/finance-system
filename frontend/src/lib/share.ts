const API_URL = 'https://finance-system-api.prxlab.app/api/shared';

async function json<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      // No Authorization header, use cookie
    },
    credentials: 'include',
    body: options.body,
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

export async function getLinks() {
  return json<{
    iSee: { id: number; name: string }[];
    seeMe: { id: number; name: string }[];
  }>(`${API_URL}/links`);
}
