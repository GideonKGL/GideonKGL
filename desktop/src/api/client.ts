const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; roles: string[] };
};

export const tokenStore = {
  get: () => window.localStorage.getItem("guardian_console_access_token"),
  set: (session: Session) => {
    window.localStorage.setItem("guardian_console_access_token", session.accessToken);
    window.localStorage.setItem("guardian_console_user", JSON.stringify(session.user));
  },
  clear: () => window.localStorage.clear()
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export async function login(email: string, password: string) {
  const session = await api<Session>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  tokenStore.set(session);
  return session;
}
