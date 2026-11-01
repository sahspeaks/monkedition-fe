// Sign-in and profile calls against /api/v2/auth and /api/v2/me (P1-23).
import { api, clearSession, getRefreshToken, storeTokens, storeUser } from "./client";
import { toLegacyUser } from "./adapters";

/**
 * The signed-in user in the shape the pages read. Failing to load the address
 * book is not fatal: the profile is enough to stay signed in.
 */
export const loadUser = async (profile) => {
  const me = profile ?? (await api.get("/api/v2/me"));
  let defaultAddress = null;
  try {
    const { items = [] } = (await api.get("/api/v2/me/addresses")) ?? {};
    defaultAddress = items.find((address) => address.isDefault) ?? items[0] ?? null;
  } catch {
    /* the profile is enough to stay signed in */
  }
  const user = toLegacyUser(me, defaultAddress);
  storeUser(user);
  return user;
};

const startSession = async (data) => {
  storeTokens(data);
  return loadUser(data.user);
};

export const login = async (email, password) =>
  startSession(await api.post("/api/v2/auth/login", { email, password }, { auth: false }));

export const register = async ({ firstName, lastName, email, password, phone }) =>
  startSession(
    await api.post("/api/v2/auth/register", { firstName, lastName, email, password, phone }, { auth: false }),
  );

/** @param {string} idToken the credential from Google's sign-in button */
export const loginWithGoogle = async (idToken) =>
  startSession(await api.post("/api/v2/auth/google", { idToken }, { auth: false }));

/** Ends this device's session on the server too, when it has a v2 token. */
export const logout = async () => {
  const refreshToken = getRefreshToken();
  clearSession();
  if (refreshToken && refreshToken.includes(".") && refreshToken.length < 100) {
    await api.post("/api/v2/auth/logout", { refreshToken }, { auth: false }).catch(() => {});
  }
};

export const updateProfile = (updates) => api.patch("/api/v2/me", updates);

export const listAddresses = async () =>
  ((await api.get("/api/v2/me/addresses")) ?? {}).items ?? [];
export const createAddress = (address) => api.post("/api/v2/me/addresses", address);
export const updateAddress = (id, address) => api.patch(`/api/v2/me/addresses/${id}`, address);
export const deleteAddress = (id) => api.delete(`/api/v2/me/addresses/${id}`);
export const makeDefaultAddress = (id) => api.post(`/api/v2/me/addresses/${id}/default`, {});

export const resendVerificationEmail = () => api.post("/api/v2/auth/email/resend", {});
export const changePassword = (currentPassword, newPassword) =>
  api.post("/api/v2/auth/password/change", { currentPassword, newPassword });
export const logoutEverywhere = () => api.post("/api/v2/auth/logout-all", {});

/** Always succeeds for a well-formed email, so it cannot reveal who has an account. */
export const requestPasswordReset = (email) =>
  api.post("/api/v2/auth/password/forgot", { email }, { auth: false });

export const resetPassword = (token, password) =>
  api.post("/api/v2/auth/password/reset", { token, password }, { auth: false });

export const verifyEmail = (token) =>
  api.post("/api/v2/auth/email/verify", { token }, { auth: false });

export const requestEmailOtp = () => api.post("/api/v2/auth/email/otp", {});
export const verifyEmailOtp = (code) => api.post("/api/v2/auth/email/otp/verify", { code });
