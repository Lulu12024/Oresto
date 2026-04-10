import { C } from "../styles/tokens";
import { OrestoLogo } from "./ui";

const NAV_ITEMS = {
  serveur: [
    { id: "dashboard", icon: "⊞", label: "Tableau de bord" },
    { id: "tables", icon: "🍽", label: "Tables" },
    { id: "orders", icon: "📋", label: "Commandes" },
    { id: "invoices", icon: "🧾", label: "Factures" },
  ],
  cuisinier: [
    { id: "dashboard", icon: "⊞", label: "Tableau de bord" },
    { id: "kitchen", icon: "🍳", label: "Cuisine" },
    { id: "stock-request", icon: "📦", label: "Demandes stock" },
    { id: "stats", icon: "📊", label: "Mes stats" },
  ],
  gérant: [
    { id: "dashboard", icon: "⊞", label: "Tableau de bord" },
    { id: "tables", icon: "🍽", label: "Tables" },
    { id: "orders", icon: "📋", label: "Commandes" },
    { id: "menu", icon: "📜", label: "Menu" },
    { id: "invoices", icon: "🧾", label: "Factures" },
    { id: "stock", icon: "📦", label: "Stock" },
    { id: "stock-entries", icon: "⬇", label: "Entrées" },
    { id: "demandes", icon: "🔔", label: "Demandes" },
    { id: "reports", icon: "📊", label: "Rapports" },
  ],
  gestionnaire: [
    { id: "dashboard", icon: "⊞", label: "Tableau de bord" },
    { id: "stock", icon: "📦", label: "Stock" },
    { id: "stock-entries", icon: "⬇", label: "Entrées" },
    { id: "stock-exits", icon: "⬆", label: "Sorties" },
    { id: "stock-history", icon: "🕐", label: "Historique" },
    { id: "demandes", icon: "🔔", label: "Demandes" },
    { id: "reports", icon: "📊", label: "Rapports" },
  ],
  manager: [
    { id: "dashboard", icon: "⊞", label: "Tableau de bord" },
    { id: "tables", icon: "🍽", label: "Tables" },
    { id: "orders", icon: "📋", label: "Commandes" },
    { id: "stock", icon: "📦", label: "Stock" },
    { id: "stock-validate", icon: "✓", label: "Validation" },
    { id: "stock-history", icon: "🕐", label: "Historique" },
    { id: "reports", icon: "📊", label: "Rapports" },
    { id: "team", icon: "👥", label: "Équipe" },
    { id: "audit", icon: "🔍", label: "Audit" },
  ],
  auditeur: [
    { id: "dashboard", icon: "⊞", label: "Tableau de bord" },
    { id: "audit", icon: "🔍", label: "Audit" },
    { id: "reports", icon: "📊", label: "Rapports" },
  ],
  admin: [
    { id: "dashboard", icon: "⊞", label: "Tableau de bord" },
    { id: "tables", icon: "🍽", label: "Tables" },
    { id: "orders", icon: "📋", label: "Commandes" },
    { id: "kitchen", icon: "🍳", label: "Cuisine" },
    { id: "menu", icon: "📜", label: "Menu" },
    { id: "invoices", icon: "🧾", label: "Factures" },
    { id: "stock", icon: "📦", label: "Stock" },
    { id: "stock-entries", icon: "⬇", label: "Entrées" },
    { id: "stock-exits", icon: "⬆", label: "Sorties" },
    { id: "stock-history", icon: "🕐", label: "Historique" },
    { id: "demandes", icon: "🔔", label: "Demandes" },
    { id: "reports", icon: "📊", label: "Rapports" },
    { id: "team", icon: "👥", label: "Équipe" },
    { id: "audit", icon: "🔍", label: "Audit" },
    { id: "import", icon: "⬆", label: "Import" },
  ],
};

export default function Sidebar({ role, screen, onNav, user, onLogout, collapsed, setCollapsed, notifCount, mobileOpen, onMobileClose }) {
  const items = NAV_ITEMS[role] || NAV_ITEMS.admin;
  const W = collapsed ? 64 : 230;

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div onClick={onMobileClose} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
          zIndex: 99, backdropFilter: "blur(2px)",
        }} />
      )}

      <aside style={{
        width: W,
        minWidth: W,
        height: "100vh",
        background: C.bg0,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width .25s ease",
        overflow: "hidden",
        position: "relative",
        zIndex: 100,
        boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
        // Mobile
        ...(mobileOpen ? {
          position: "fixed", left: 0, top: 0, bottom: 0,
          width: 230, minWidth: 230,
        } : {}),
      }}>
        {/* Header */}
        <div style={{
          padding: collapsed ? "20px 0" : "20px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          minHeight: 68,
        }}>
          {!collapsed && <OrestoLogo size={32} withText />}
          {collapsed && <OrestoLogo size={32} withText={false} />}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.muted, fontSize: 18, padding: 4,
              borderRadius: 6, transition: "color .2s",
            }}>⟨</button>
          )}
        </div>

        {/* Expand btn when collapsed */}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, fontSize: 18, padding: "8px 0",
            width: "100%", textAlign: "center", transition: "color .2s",
          }}>⟩</button>
        )}

        {/* Restaurant badge */}
        {!collapsed && user?.restaurant && (
          <div style={{
            margin: "12px 12px 0",
            padding: "8px 12px",
            background: C.goldBg,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, color: C.goldD, fontWeight: 700, letterSpacing: .5 }}>
              🍽 {user.restaurant.nom}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{user.restaurant.statut}</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
          {items.map(item => {
            const active = screen === item.id;
            const hasNotif = item.id === "orders" && notifCount > 0;
            return (
              <button key={item.id} onClick={() => onNav(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 10,
                  padding: collapsed ? "10px 0" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active ? C.goldBg : "transparent",
                  border: active ? `1px solid ${C.goldBorder}` : "1px solid transparent",
                  borderRadius: 8,
                  color: active ? C.goldD : C.textSub,
                  fontWeight: active ? 700 : 400,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all .18s",
                  marginBottom: 2,
                  position: "relative",
                  fontFamily: "'Inter',sans-serif",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.text; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; } }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
                {hasNotif && (
                  <span style={{
                    marginLeft: "auto", background: C.danger, color: "#fff",
                    borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                    flexShrink: 0,
                  }}>{notifCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: collapsed ? "12px 0" : "12px 12px" }}>
          {!collapsed && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{user?.role}</div>
            </div>
          )}
          <button onClick={onLogout} style={{
            width: "100%", background: "none",
            border: `1px solid ${C.border}`, borderRadius: 8,
            padding: collapsed ? "8px 0" : "8px 12px",
            color: C.danger, fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
            gap: 8, fontFamily: "'Inter',sans-serif", transition: "all .2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = C.dangerBg}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <span>↩</span>
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
