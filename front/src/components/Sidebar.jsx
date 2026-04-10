import { C } from "../styles/tokens";
import { OrestoLogo } from "./ui";

function normalizeRole(rawRole) {
  const r = (rawRole || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (r === "serveur")                         return "serveur";
  if (r === "cuisinier")                       return "cuisinier";
  if (r === "gerant")                          return "gerant";
  if (r.includes("gestionnaire"))              return "gestionnaire";
  if (r === "manager")                         return "manager";
  if (r === "auditeur")                        return "auditeur";
  if (r === "administrateur" || r === "admin") return "admin";
  return "admin";
}

// On utilise des caractères Unicode simples à la place des emojis :
// les emojis font varier la hauteur de ligne selon l'OS, rendant le menu aéré.
const NAV_ITEMS = {
  serveur: [
    { id: "dashboard", icon: "▦", label: "Tableau de bord" },
    { id: "tables",    icon: "⬡", label: "Tables" },
    { id: "orders",    icon: "≡", label: "Commandes" },
    { id: "invoices",  icon: "▤", label: "Factures" },
    { id: "stats",     icon: "◈", label: "Mes stats" },
  ],
  cuisinier: [
    { id: "dashboard",     icon: "▦", label: "Tableau de bord" },
    { id: "kitchen",       icon: "⚑", label: "Cuisine" },
    { id: "stock-request", icon: "◎", label: "Demandes stock" },
    { id: "stats",         icon: "◈", label: "Mes stats" },
  ],
  gerant: [
    { id: "dashboard",     icon: "▦", label: "Tableau de bord" },
    { id: "tables",        icon: "⬡", label: "Tables" },
    { id: "orders",        icon: "≡", label: "Commandes" },
    { id: "menu",          icon: "◉", label: "Menu" },
    { id: "invoices",      icon: "▤", label: "Factures" },
    { id: "stock",         icon: "◎", label: "Stock" },
    { id: "stock-entries", icon: "↓", label: "Entrées stock" },
    { id: "stock-exits",   icon: "↑", label: "Sorties stock" },
    { id: "demandes",      icon: "◷", label: "Demandes" },
    { id: "reports",       icon: "◈", label: "Rapports" },
  ],
  gestionnaire: [
    { id: "dashboard",     icon: "▦", label: "Tableau de bord" },
    { id: "stock",         icon: "◎", label: "Stock" },
    { id: "stock-entries", icon: "↓", label: "Entrées" },
    { id: "stock-exits",   icon: "↑", label: "Sorties" },
    { id: "stock-history", icon: "⊙", label: "Historique" },
    { id: "demandes",      icon: "◷", label: "Demandes" },
    { id: "reports",       icon: "◈", label: "Rapports" },
  ],
  manager: [
    { id: "dashboard",      icon: "▦", label: "Tableau de bord" },
    { id: "tables",         icon: "⬡", label: "Tables" },
    { id: "orders",         icon: "≡", label: "Commandes" },
    { id: "menu",           icon: "◉", label: "Menu" },
    { id: "invoices",       icon: "▤", label: "Factures" },
    { id: "stock",          icon: "◎", label: "Stock" },
    { id: "stock-validate", icon: "✓", label: "Validation" },
    { id: "stock-history",  icon: "⊙", label: "Historique" },
    { id: "reports",        icon: "◈", label: "Rapports" },
    { id: "team",           icon: "◑", label: "Équipe" },
    { id: "audit",          icon: "⊞", label: "Audit" },
    { id: "settings",       icon: "⚙", label: "Paramètres" },
  ],
  auditeur: [
    { id: "dashboard", icon: "▦", label: "Tableau de bord" },
    { id: "audit",     icon: "⊞", label: "Audit" },
    { id: "reports",   icon: "◈", label: "Rapports" },
  ],
  admin: [
    { id: "dashboard",     icon: "▦", label: "Tableau de bord" },
    { id: "tables",        icon: "⬡", label: "Tables" },
    { id: "orders",        icon: "≡", label: "Commandes" },
    { id: "kitchen",       icon: "⚑", label: "Cuisine" },
    { id: "menu",          icon: "◉", label: "Menu" },
    { id: "invoices",      icon: "▤", label: "Factures" },
    { id: "stock",         icon: "◎", label: "Stock" },
    { id: "stock-entries", icon: "↓", label: "Entrées" },
    { id: "stock-exits",   icon: "↑", label: "Sorties" },
    { id: "stock-history", icon: "⊙", label: "Historique" },
    { id: "demandes",      icon: "◷", label: "Demandes" },
    { id: "reports",       icon: "◈", label: "Rapports" },
    { id: "team",          icon: "◑", label: "Équipe" },
    { id: "audit",         icon: "⊞", label: "Audit" },
    { id: "import",        icon: "↥", label: "Import" },
    { id: "settings",      icon: "⚙", label: "Paramètres" },
  ],
};

const ROLE_COLORS = {
  serveur: "#3B82F6", cuisinier: "#F59E0B", gerant: "#10B981",
  gestionnaire: "#8B5CF6", manager: "#EC4899", auditeur: "#6B7280", admin: "#EF4444",
};
const ROLE_LABELS = {
  serveur: "Serveur", cuisinier: "Cuisinier", gerant: "Gérant",
  gestionnaire: "Gestionnaire", manager: "Manager", auditeur: "Auditeur", admin: "Admin",
};

export default function Sidebar({
  role: rawRole, screen, onNav, user, onLogout,
  collapsed, setCollapsed, notifCount,
  mobileOpen, onMobileClose,
}) {
  const role       = normalizeRole(rawRole);
  const items      = NAV_ITEMS[role] ?? NAV_ITEMS.admin;
  const W          = collapsed ? 52 : 218;
  const roleColor  = ROLE_COLORS[role] || C.gold;
  const nomComplet = user
    ? `${user.firstName || user.first_name || ""} ${user.lastName || user.last_name || ""}`.trim()
    : "";

  return (
    <>
      {mobileOpen && (
        <div onClick={onMobileClose} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)",
          zIndex: 99, backdropFilter: "blur(2px)",
        }} />
      )}

      <aside style={{
        width: W, minWidth: W,
        height: "100vh",
        background: C.bg0,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width .2s ease",
        overflow: "hidden",
        zIndex: 100,
        flexShrink: 0,
        boxShadow: "1px 0 6px rgba(0,0,0,0.05)",
        ...(mobileOpen
          ? { position: "fixed", left: 0, top: 0, bottom: 0, width: 218, minWidth: 218 }
          : {}),
      }}>

        {/* ── En-tête logo ─── */}
        <div style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 0" : "0 12px",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <OrestoLogo size={24} withText={!collapsed} />
          <button
            onClick={() => setCollapsed(v => !v)}
            style={{
              background: "none", border: "none",
              cursor: "pointer", color: C.muted,
              fontSize: 16, lineHeight: 1, padding: "4px 6px",
              display: "flex", alignItems: "center",
            }}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* ── Navigation ─── */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 5px" }}>
          {items.map((item) => {
            const active = screen === item.id;
            const badge  = item.id === "dashboard" && notifCount > 0;
            return (
              <button
                key={item.id}
                onClick={() => onNav(item.id)}
                title={collapsed ? item.label : undefined}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  // Hauteur fixe : évite que les icônes gonflent la ligne
                  height: 34,
                  padding: collapsed ? "0" : "0 10px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active ? `${C.gold}16` : "transparent",
                  border: "none",
                  borderLeft: active ? `3px solid ${C.gold}` : "3px solid transparent",
                  borderRadius: active ? "0 6px 6px 0" : "0 6px 6px 0",
                  color: active ? (C.goldD || C.gold) : C.textSub,
                  fontWeight: active ? 600 : 400,
                  fontSize: 12.5,
                  lineHeight: "1",       // ← clé : empêche les variations de hauteur
                  cursor: "pointer",
                  position: "relative",
                  marginBottom: 1,
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: "nowrap",
                  transition: "background .1s, color .1s",
                  textAlign: "left",
                }}
              >
                <span style={{
                  width: 16,
                  textAlign: "center",
                  fontSize: 13,
                  lineHeight: 1,
                  color: active ? C.gold : C.muted,
                  flexShrink: 0,
                  display: "inline-block",
                }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.label}
                  </span>
                )}
                {badge && (
                  <span style={{
                    position: "absolute",
                    right: collapsed ? 3 : 8,
                    top: "50%",
                    transform: "translateY(-50%) translateY(-6px)",
                    background: C.danger || "#EF4444",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    lineHeight: 1,
                    borderRadius: 8,
                    padding: "2px 4px",
                    minWidth: 14,
                    textAlign: "center",
                  }}>
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Footer utilisateur ─── */}
        <div style={{
          borderTop: `1px solid ${C.border}`,
          padding: collapsed ? "8px 0" : "8px 10px",
          flexShrink: 0,
        }}>
          {!collapsed && (
            <div style={{ marginBottom: 7 }}>
              <div style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: C.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
              }}>
                {nomComplet || user?.login || "Utilisateur"}
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center",
                gap: 4, marginTop: 4,
                padding: "2px 7px",
                background: roleColor + "15",
                border: `1px solid ${roleColor}35`,
                borderRadius: 10,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: roleColor, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: roleColor, lineHeight: 1 }}>
                  {ROLE_LABELS[role] || user?.role}
                </span>
              </div>
              {user?.restaurant?.nom && (
                <div style={{
                  fontSize: 10, color: C.muted, marginTop: 3, lineHeight: 1.2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {user.restaurant.nom}
                </div>
              )}
            </div>
          )}
          <button
            onClick={onLogout}
            title="Déconnexion"
            style={{
              width: "100%",
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              height: 30,
              padding: collapsed ? "0" : "0 8px",
              color: C.muted,
              fontSize: 11,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 6,
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: 12, lineHeight: 1 }}>⏏</span>
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
