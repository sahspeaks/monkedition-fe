// One HTTP client for the storefront. Every authenticated call goes through
// request(), which refreshes the session on a 401 and retries once.
//
// v2 access tokens last 15 minutes (v1's lasted a day), so a call that reads
// the token from storage and never refreshes would start failing mid-session.
import { BASE_URL } from "../server/server";

const KEYS = { access: "accessToken", refresh: "refreshToken", user: "user" };

const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    } catch {
      /* storage full or blocked: the session lives in memory only */
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  constructor(message, { status, code, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

// --- session ----------------------------------------------------------------

export const getAccessToken = () => storage.get(KEYS.access);
export const getRefreshToken = () => storage.get(KEYS.refresh);

export const getStoredUser = () => {
  try {
    const raw = storage.get(KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const storeUser = (user) => storage.set(KEYS.user, user);

/** Saves a token pair from v2 ({ tokens: {...} }) or v1 ({ accessToken, refreshToken }). */
export const storeTokens = (data) => {
  const tokens = data?.tokens ?? data;
  if (tokens?.accessToken) storage.set(KEYS.access, tokens.accessToken);
  if (tokens?.refreshToken) storage.set(KEYS.refresh, tokens.refreshToken);
};

const listeners = new Set();

/** Called when the session can no longer be refreshed. Returns an unsubscribe. */
export const onSessionExpired = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const clearSession = () => {
  storage.remove(KEYS.access);
  storage.remove(KEYS.refresh);
  storage.remove(KEYS.user);
};

const expireSession = () => {
  clearSession();
  listeners.forEach((listener) => listener());
};

// v2 refresh tokens are opaque "<ULID>.<secret>"; anything else is a v1 JWT
// from a session that started before the switch.
const isV2RefreshToken = (token) => /^[0-9A-HJKMNP-TV-Z]{26}\.[A-Za-z0-9_-]{43}$/.test(token);

let refreshing = null;

/** Exchanges the refresh token for a new pair. Concurrent callers share one call. */
const refreshSession = () => {
  refreshing ??= (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    const path = isV2RefreshToken(refreshToken) ? "/api/v2/auth/refresh" : "/api/v1/refresh-token";
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      storeTokens(await response.json());
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
};

// --- requests ---------------------------------------------------------------

const parse = async (response) => {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * @param {string} path e.g. "/api/v2/products"
 * @param {{ method?: string, body?: unknown, auth?: boolean, headers?: Record<string, string>, retried?: boolean }} [options]
 */
export const request = async (path, { method = "GET", body, auth = true, headers = {}, retried = false } = {}) => {
  if (!navigator.onLine) throw new ApiError("No internet connection");
  const token = auth ? getAccessToken() : null;
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const data = await parse(response);

  if (response.status === 401 && auth && token && !retried) {
    if (await refreshSession()) {
      return request(path, { method, body, auth, headers, retried: true });
    }
    expireSession();
    throw new ApiError("Your session has expired. Please log in again.", { status: 401, code: "SESSION_EXPIRED" });
  }
  if (!response.ok) {
    // v2 sends problem+json ({ title, code }); v1 sends { message }.
    const message = data?.title || data?.message || "Something went wrong. Please try again.";
    throw new ApiError(message, { status: response.status, code: data?.code, body: data });
  }
  return data;
};

/**
 * fetch() to any URL with the signed-in user's token, refreshing the session
 * on a 401 and retrying once, like request(). Returns the raw Response, for
 * services other than the store API and for bodies that are not JSON
 * (file uploads, images, ZIPs).
 * @param {string} url
 * @param {RequestInit} [init]
 */
export const authFetch = async (url, init = {}, retried = false) => {
  if (!navigator.onLine) throw new ApiError("No internet connection");
  const token = getAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: { ...init.headers, ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (response.status === 401 && token && !retried) {
    if (await refreshSession()) return authFetch(url, init, true);
    expireSession();
    throw new ApiError("Your session has expired. Please log in again.", { status: 401, code: "SESSION_EXPIRED" });
  }
  return response;
};

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};
