import { useState, useEffect } from "react";
import { injectGlobalCSS, C } from "./styles/tokens";
import { AdminLogo, ToastContainer, Spinner } from "./components/ui";
import { useToast } from "./hooks";
import { authApi, getStoredUser, getStoredToken, clearToken, setToken } from "./api/client";

import LoginScreen     from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import RestaurantsScreen from "./screens/RestaurantsScreen";
import AbonnementsScreen from "./screens/AbonnementsScreen";
import PlansScreen       from "./screens/PlansScreen";

const NAV = [
  { id: "dashboard",    icon: "⊞", label: "Tableau de bord" },
  { id: "restaurants",  icon: "🍽", label: "Restaurants" },
  { id: "abonnements",  icon: "💳", label: "Abonnements" },
  { id: "plans",        icon: "📋", label: "Plans tarifaires" },
];

export default function App() {
  useEffect(() => { injectGlobalCSS(); }, []);

  const [user, setUser]   = useState(() => getStoredUser());
  const [screen, setScreen] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading]   = useState(!!getStoredToken() && !getStoredUser());
  const { toasts, toast, removeToast } = useToast();

  // Vérifier le token au démarrage
  useEffect(() => {
    if (getStoredToken() && !user) {
      authApi.me()
        .then(u => { if (u.is_super_admin) setUser(u); else { clearToken(); } })
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    }
  }, []);

  // Listener déconnexion
  useEffect(() => {
    const handler = () => { setUser(null); toast.error("Session expirée", "Reconnectez-vous"); };
    window.addEventListener("oresto:unauthorized", handler);
    return () => window.removeEventListener("oresto:unauthorized", handler);
  }, []);

  const handleLogin = (u) => { setUser(u); setScreen("dashboard"); };
  const handleLogout = () => {
    authApi.logout().catch(() => {}).finally(() => { clearToken(); setUser(null); });
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg1 }}>
      <div style={{ textAlign: "center" }}>
        <AdminLogo size={48} withText />
        <div style={{ marginTop: 24 }}><Spinner size={32} /></div>
      </div>
    </div>
  );

  if (!user) return (
    <>
      <LoginScreen onLogin={handleLogin} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );

  const W = collapsed ? 64 : 230;
  const sharedProps = { toast };

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":   return <DashboardScreen    {...sharedProps} />;
      case "restaurants": return <RestaurantsScreen  {...sharedProps} />;
      case "abonnements": return <AbonnementsScreen  {...sharedProps} />;
      case "plans":       return <PlansScreen        {...sharedProps} />;
      default:            return <DashboardScreen    {...sharedProps} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg1 }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: W, minWidth: W, height: "100vh",
        background: C.bg0, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        transition: "width .25s ease", overflow: "hidden",
        boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "20px 0" : "20px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
          minHeight: 68,
        }}>
          <AdminLogo size={32} withText={!collapsed} />
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18 }}>⟨</button>
          )}
        </div>
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18, padding: "8px 0", width: "100%", textAlign: "center" }}>⟩</button>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {NAV.map(item => {
            const active = screen === item.id;
            return (
              <button key={item.id} onClick={() => setScreen(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  gap: collapsed ? 0 : 10,
                  padding: collapsed ? "11px 0" : "11px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active ? C.goldBg : "transparent",
                  border: active ? `1px solid ${C.goldBorder}` : "1px solid transparent",
                  borderRadius: 8,
                  color: active ? C.goldD : C.textSub,
                  fontWeight: active ? 700 : 400,
                  fontSize: 13, cursor: "pointer",
                  transition: "all .18s", marginBottom: 3,
                  fontFamily: "'Inter',sans-serif",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.text; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; } }}
              >
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: collapsed ? "12px 0" : "14px 12px" }}>
          {!collapsed && (
            <div style={{ marginBottom: 10, padding: "8px 10px", background: C.goldBg, borderRadius: 8, border: `1px solid ${C.goldBorder}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.goldD }}>Super Admin</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{user.login}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: "100%", background: "none", border: `1px solid ${C.border}`, borderRadius: 8,
            padding: collapsed ? "8px 0" : "8px 12px", color: C.danger, fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
            gap: 8, fontFamily: "'Inter',sans-serif", transition: "all .2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = C.dangerBg}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <span>↩</span>
            {!collapsed && "Déconnexion"}
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Header */}
        <div style={{
          height: 60, background: C.bg0, borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", padding: "0 28px",
          justifyContent: "space-between", flexShrink: 0,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
            {NAV.find(n => n.id === screen)?.label || "Admin"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px", background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.goldD }}>Oresto Platform</span>
          </div>
        </div>

        {/* Main */}
        <main style={{ flex: 1, overflow: "auto", padding: 28 }}>
          {renderScreen()}
        </main>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
