/**
 * Oresto — Services API (factures, utilisateurs, audit, rapports, notifications, restaurant)
 */
import { api, downloadFile, unwrap, BASE_URL, getToken } from "./client";
import { MOCK_INVOICES, MOCK_USERS, MOCK_AUDIT } from "../mock";


// ══════════════════════════════════════════════════════════════
//   RESTAURANT SERVICE — paramètres du restaurant courant
//   GET   /api/restaurant/my/   → RestaurantSettings
//   PATCH /api/restaurant/my/   → RestaurantSettings
// ══════════════════════════════════════════════════════════════

export const restaurantService = {
  async getMyRestaurant() {
    try {
      return await api.get("/restaurant/my/");
    } catch (err) {
      throw err;
    }
  },

  async updateMyRestaurant(payload) {
    try {
      return await api.patch("/restaurant/my/", payload);
    } catch (err) {
      throw err;
    }
  },
};


// ══════════════════════════════════════════════════════════════
//   INVOICES API Service
//   GET    /api/invoices/           → Invoice[]
//   GET    /api/invoices/{id}/      → Invoice
//   GET    /api/invoices/{id}/pdf/  → PDF (download)
// ══════════════════════════════════════════════════════════════

export const invoicesService = {
  async list(params = {}) {
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      ).toString();
      const data = await api.get(`/invoices/${qs ? "?" + qs : ""}`);
      return unwrap(data);
    } catch (err) {
      if (err.isNetwork) return [...MOCK_INVOICES];
      throw err;
    }
  },

  async get(id) {
    try {
      return await api.get(`/invoices/${id}/`);
    } catch (err) {
      if (err.isNetwork) return MOCK_INVOICES.find(i => i.id === id);
      throw err;
    }
  },

  async downloadPdf(id, filename) {
    try {
      await downloadFile(`/invoices/${id}/pdf/`, filename || `facture-${id}.pdf`);
    } catch (err) {
      if (err.isNetwork) throw new Error("PDF indisponible en mode hors-ligne.");
      throw err;
    }
  },

  async printTicket(id) {
    const response = await fetch(`${BASE_URL}/invoices/${id}/pdf/`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 2000);
    };
  },
};


// ══════════════════════════════════════════════════════════════
//   USERS API Service
//   GET    /api/users/               → User[]
//   POST   /api/users/               → User
//   PUT    /api/users/{id}/          → User
//   DELETE /api/users/{id}/          → 204
//   POST   /api/users/{id}/toggle/   → User
//   POST   /api/users/{id}/reset-password/ → 200
// ══════════════════════════════════════════════════════════════

export const usersService = {
  async list() {
    try {
      const data = await api.get("/users/");
      return unwrap(data);
    } catch (err) {
      if (err.isNetwork) return [...MOCK_USERS];
      throw err;
    }
  },

  async create(payload) {
    try {
      return await api.post("/users/", payload);
    } catch (err) {
      if (err.isNetwork) return { id: Date.now(), ...payload, isActive: true };
      throw err;
    }
  },

  async update(id, payload) {
    try {
      return await api.put(`/users/${id}/`, payload);
    } catch (err) {
      if (err.isNetwork) return { id, ...payload };
      throw err;
    }
  },

  async remove(id) {
    try {
      return await api.delete(`/users/${id}/`);
    } catch (err) {
      if (err.isNetwork) return null;
      throw err;
    }
  },

  async toggle(id) {
    try {
      return await api.post(`/users/${id}/toggle/`);
    } catch (err) {
      if (err.isNetwork) return { id, toggled: true };
      throw err;
    }
  },

  async resetPassword(id, newPassword) {
    try {
      return await api.post(`/users/${id}/reset-password/`, { new_password: newPassword });
    } catch (err) {
      if (err.isNetwork) return { success: true };
      throw err;
    }
  },
};


// ══════════════════════════════════════════════════════════════
//   AUDIT API Service
//   GET    /api/audit-logs/          → Log[]
//   GET    /api/audit-logs/export/   → file
// ══════════════════════════════════════════════════════════════

export const auditService = {
  async list(params = {}) {
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      ).toString();
      const data = await api.get(`/audit-logs/${qs ? "?" + qs : ""}`);
      if (data && Array.isArray(data.results)) return data;
      return {
        count: Array.isArray(data) ? data.length : 0,
        next: null, previous: null,
        results: Array.isArray(data) ? data : [],
      };
    } catch (err) {
      if (err.isNetwork) return {
        count: MOCK_AUDIT.length, next: null, previous: null, results: [...MOCK_AUDIT],
      };
      throw err;
    }
  },

  async export(format = "csv") {
    try {
      await downloadFile(`/audit-logs/export/?format=${format}`, `audit-logs.${format}`);
    } catch (err) {
      if (err.isNetwork) throw new Error("Export indisponible en mode hors-ligne.");
      throw err;
    }
  },
};


// ══════════════════════════════════════════════════════════════
//   NOTIFICATIONS API Service
//   GET    /api/notifications/         → Notification[]
//   POST   /api/notifications/{id}/read/ → 200
//   POST   /api/notifications/read-all/  → 200
// ══════════════════════════════════════════════════════════════

export const notificationsService = {
  async list() {
    try {
      const data = await api.get("/notifications/");
      return unwrap(data);
    } catch (err) {
      if (err.isNetwork) return [];
      throw err;
    }
  },

  async markRead(id) {
    try {
      return await api.post(`/notifications/${id}/read/`);
    } catch (err) {
      if (err.isNetwork) return null;
      throw err;
    }
  },

  async markAllRead() {
    try {
      return await api.post("/notifications/read-all/");
    } catch (err) {
      if (err.isNetwork) return null;
      throw err;
    }
  },

  connectWebSocket(onMessage) {
    const wsUrl = (process.env.REACT_APP_WS_URL || "ws://localhost:8000/ws") + "/notifications/";
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen    = () => console.log("[WS] Connecté aux notifications");
      ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch (_) {} };
      ws.onerror   = () => console.warn("[WS] WebSocket indisponible");
      ws.onclose   = () => console.log("[WS] Déconnecté");
    } catch (_) {
      console.warn("[WS] WebSocket non supporté");
    }
    return () => ws && ws.close();
  },
};


// ══════════════════════════════════════════════════════════════
//   REPORTS API Service
//   GET    /api/reports/dashboard/    → Stats
//   GET    /api/reports/orders/       → OrderStats
//   GET    /api/reports/stock/        → StockStats
//   GET    /api/reports/kpi/          → KPIData
//   GET    /api/reports/export/       → file
// ══════════════════════════════════════════════════════════════

export const reportsService = {
  async dashboard() {
    try {
      return await api.get("/reports/dashboard/");
    } catch (err) {
      if (err.isNetwork) return null;
      throw err;
    }
  },

  async orders(period = "day") {
    try {
      return await api.get(`/reports/orders/?period=${period}`);
    } catch (err) {
      if (err.isNetwork) return null;
      throw err;
    }
  },

  async stock() {
    try {
      return await api.get("/reports/stock/");
    } catch (err) {
      if (err.isNetwork) return null;
      throw err;
    }
  },

  async kpi(period = "month") {
    try {
      return await api.get(`/reports/kpi/?period=${period}`);
    } catch (err) {
      if (err.isNetwork) return null;
      throw err;
    }
  },

  async export(type, format = "pdf") {
    try {
      await downloadFile(`/reports/export/?type=${type}&format=${format}`, `rapport-${type}.${format}`);
    } catch (err) {
      if (err.isNetwork) throw new Error("Export indisponible en mode hors-ligne.");
      throw err;
    }
  },
};
