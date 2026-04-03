"use client";

const API_BASE = "http://localhost:8000/api";
const API_ORIGIN = "http://localhost:8000";

export type TokenPair = { access: string; refresh?: string };

export type RegisterResponse = {
  user: { id: number; username: string; email: string };
  access: string;
  refresh: string;
};

function hasWindow() {
  return typeof window !== "undefined";
}

function lsGet(key: string) {
  if (!hasWindow()) return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function lsSet(key: string, value: string) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch { }
}

function lsRemove(key: string) {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch { }
}

function normalizePath(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return path;
}

function isAbsoluteUrl(path: string) {
  return /^https?:\/\//i.test(path);
}

function buildUrl(path: string) {
  if (isAbsoluteUrl(path)) return path;
  return `${API_BASE}${normalizePath(path)}`;
}

function getAccess() {
  return lsGet("access");
}

function getRefresh() {
  return lsGet("refresh");
}

function notifyAuthChanged() {
  if (hasWindow()) window.dispatchEvent(new Event("praxia-auth-changed"));
}

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefresh();
  if (!refresh) throw new Error("No refresh token");

  const res = await fetch(buildUrl("/auth/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    lsRemove("access");
    lsRemove("refresh");
    lsRemove("praxia_username");
    notifyAuthChanged();
    throw new Error("Refresh token invalid");
  }

  const data = (await res.json()) as { access: string };
  lsSet("access", data.access);
  return data.access;
}

function isFormData(body: any): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function mergeHeaders(base?: HeadersInit, extra?: Record<string, string>) {
  const h = new Headers(base || {});
  Object.entries(extra || {}).forEach(([k, v]) => h.set(k, v));
  return h;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { parseAs?: "json" | "text" | "blob" } = {},
  retry = true
): Promise<T> {
  const url = buildUrl(path);
  const access = getAccess();
  const parseAs = options.parseAs || "json";

  const body = (options as any).body;
  const hasBody = body !== undefined && body !== null;

  const headers = mergeHeaders(options.headers, {
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...(hasBody && !isFormData(body) ? { "Content-Type": "application/json" } : {}),
  });

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && retry) {
    try {
      const newAccess = await refreshAccessToken();
      const headers2 = mergeHeaders(options.headers, {
        Authorization: `Bearer ${newAccess}`,
        ...(hasBody && !isFormData(body) ? { "Content-Type": "application/json" } : {}),
      });

      const res2 = await fetch(url, { ...options, headers: headers2 });

      if (!res2.ok) {
        const txt = await res2.text();
        throw new Error(txt || `Request failed (${res2.status}) after refresh`);
      }

      if (res2.status === 204) return {} as T;
      if (parseAs === "blob") return (await res2.blob()) as unknown as T;
      if (parseAs === "text") return (await res2.text()) as unknown as T;
      return (await res2.json()) as T;
    } catch (err) {
      // Refresh failed
      throw err;
    }
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Request failed (${res.status})`);
  }

  if (res.status === 204) return {} as T;
  
  if (parseAs === "blob") return (await res.blob()) as unknown as T;
  if (parseAs === "text") return (await res.text()) as unknown as T;
  
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return (await res.text()) as unknown as T;

  return (await res.json()) as T;
}

export async function login(username: string, password: string): Promise<TokenPair> {
  const res = await fetch(buildUrl("/auth/token/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "Login failed");
  }

  const data = (await res.json()) as TokenPair;

  lsSet("access", data.access);
  if (data.refresh) lsSet("refresh", data.refresh);

  lsSet("praxia_username", username);
  notifyAuthChanged();

  return data;
}

// ✅ REGISTER (matches backend response)
export async function register(payload: {
  username: string;
  email?: string;
  password: string;
}): Promise<RegisterResponse> {
  const url = `${API_ORIGIN}/api/auth/register/`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Register failed (${res.status})`);
  }

  const data = (await res.json()) as RegisterResponse;

  // Optional: store tokens immediately (even if you also login after)
  if (data?.access) lsSet("access", data.access);
  if (data?.refresh) lsSet("refresh", data.refresh);
  if (data?.user?.username) lsSet("praxia_username", data.user.username);

  notifyAuthChanged();
  return data;
}

export function logout() {
  lsRemove("access");
  lsRemove("refresh");
  lsRemove("praxia_username");
  notifyAuthChanged();
}

export function isLoggedIn() {
  return Boolean(getAccess());
}

export function getStoredUsername() {
  return lsGet("praxia_username");
}
