// Central API client. Every network call in the app goes through here so
// there is exactly one place that knows about auth headers, base URL, and
// error shape.

const TOKEN_KEY = "catos.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handle(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
  }
  return body;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  get(path: string) {
    return fetch(`/api${path}`, { headers: { ...authHeaders() } }).then(handle);
  },
  post(path: string, body?: unknown) {
    return fetch(`/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handle);
  },
  patch(path: string, body?: unknown) {
    return fetch(`/api${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handle);
  },
  del(path: string) {
    return fetch(`/api${path}`, { method: "DELETE", headers: { ...authHeaders() } }).then(handle);
  },
  postForm(path: string, form: FormData) {
    return fetch(`/api${path}`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: form,
    }).then(handle);
  },
  patchForm(path: string, form: FormData) {
    return fetch(`/api${path}`, {
      method: "PATCH",
      headers: { ...authHeaders() },
      body: form,
    }).then(handle);
  },
};
