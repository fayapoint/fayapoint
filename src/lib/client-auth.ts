export function getClientBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fayai_token");
}

export function getClientAuthHeaders(): Record<string, string> {
  const token = getClientBearerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
