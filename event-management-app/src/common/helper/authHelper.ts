/**
 * Simple JWT helper to extract payload from token stored in localStorage under `token`.
 * Falls back to `idUser` stored separately by OAuth flow.
 */
export const authHelper = {
  getRawToken(): string | null {
    try {
      const t = localStorage.getItem("token");
      if (!t) return null;
      const parsed = JSON.parse(t);
      if (parsed && parsed.token) return parsed.token;
      return typeof t === "string" ? t : null;
    } catch {
      return null;
    }
  },

  decodePayload<T = any>(): T | null {
    const token = this.getRawToken();
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      const payload = parts[1];
      const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decodeURIComponent(escape(json))) as T;
    } catch (e) {
      try {
        // fallback simple base64
        const json = atob(parts[1]);
        return JSON.parse(json) as T;
      } catch {
        return null;
      }
    }
  },

  getUserId(): number | null {
    const p = this.decodePayload();
    if (p) {
      if (p.userId) return Number(p.userId);
      if (p.sub) return Number(p.sub);
      if (p.id) return Number(p.id);
      if (p.idUser) return Number(p.idUser);
    }
    // fallback to separate localStorage set by OAuth redirect or login
    const id = localStorage.getItem("idUser");
    return id ? Number(id) : null;
  },

  getRole(): string | null {
    const p = this.decodePayload();
    if (p) return p.role || p.roles || null;
    const r = localStorage.getItem("role");
    return r || null;
  },
};
