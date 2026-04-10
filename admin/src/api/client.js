const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

let _token = localStorage.getItem("oresto_admin_token") || "";
let _user  = null;
try { _user = JSON.parse(localStorage.getItem("oresto_admin_user") || "null"); } catch {}

export const setToken = (t, user) => {
  _token = t;
  _user  = user;
  localStorage.setItem("oresto_admin_token", t);
  localStorage.setItem("oresto_admin_user", JSON.stringify(user));
};

export const clearToken = () => {
  _token = "";
  _user  = null;
  localStorage.removeItem("oresto_admin_token");
  localStorage.removeItem("oresto_admin_user");
};

export const getStoredUser = () => _user;
export const getStoredToken = () => _token;

async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("oresto:unauthorized"));
    throw new Error("Session expirée");
  }

  if (!res.ok) {
    let detail = `Erreur ${res.status}`;
    try { const d = await res.json(); detail = d.detail || JSON.stringify(d); } catch {}
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get:    (path)        => req("GET",    path),
  post:   (path, body)  => req("POST",   path, body),
  put:    (path, body)  => req("PUT",    path, body),
  patch:  (path, body)  => req("PATCH",  path, body),
  delete: (path)        => req("DELETE", path),
};

/* ── Services ── */
export const authApi = {
  login: (login, password) => api.post("/auth/login/", { login, password }),
  me:    ()                 => api.get("/auth/me/"),
  logout:()                 => api.post("/auth/logout/", {}),
};

export const restaurantsApi = {
  list:     ()           => api.get("/admin/restaurants/"),
  get:      (id)         => api.get(`/admin/restaurants/${id}/`),
  create:   (data)       => api.post("/admin/restaurants/", data),
  update:   (id, data)   => api.put(`/admin/restaurants/${id}/`, data),
  suspend:  (id)         => api.post(`/admin/restaurants/${id}/suspend/`, {}),
  activate: (id)         => api.post(`/admin/restaurants/${id}/activate/`, {}),
  stats:    ()           => api.get("/admin/restaurants/stats/"),
};

export const plansApi = {
  list:   ()         => api.get("/admin/plans/"),
  create: (data)     => api.post("/admin/plans/", data),
  update: (id, data) => api.put(`/admin/plans/${id}/`, data),
  delete: (id)       => api.delete(`/admin/plans/${id}/`),
};

export const abonnementsApi = {
  list:      (restaurantId) => api.get(`/admin/abonnements/?restaurant=${restaurantId || ""}`),
  create:    (data)         => api.post("/admin/abonnements/", data),
  renouveler:(id, mois)     => api.post(`/admin/abonnements/${id}/renouveler/`, { mois }),
  update:    (id, data)     => api.patch(`/admin/abonnements/${id}/`, data),
};
