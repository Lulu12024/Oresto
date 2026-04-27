import { useState, useEffect, useMemo } from "react";
import { injectGlobalCSS } from "./styles/tokens";
import { authService } from "./api/auth";
import { unwrap, getUser } from "./api/client";   // getUser vient de client, PAS de auth
import { useToast, useOfflineDetect, useLocalState } from "./hooks";
import { tablesService } from "./api/tables";
import { ordersService } from "./api/orders";
import { productsService, movementsService } from "./api/stock";
import { invoicesService } from "./api/services";
import { platsService } from "./api/plats";

import LandingPage        from "./screens/LandingPage";
import LoginScreen        from "./screens/LoginScreen";
import QROrderPage        from "./screens/QROrderPage";
import DashboardScreen    from "./screens/DashboardScreen";
import TablesScreen       from "./screens/TablesScreen";
import TableDetailScreen  from "./screens/TableDetailScreen";
import KitchenScreen      from "./screens/KitchenScreen";
import OrdersListScreen   from "./screens/OrdersListScreen";
import StockScreen        from "./screens/StockScreen";
import StockEntriesScreen from "./screens/StockEntriesScreen";
import MovementsScreen    from "./screens/MovementsScreen";
import StockRequestScreen from "./screens/StockRequestScreen";
import InvoicesScreen     from "./screens/InvoicesScreen";
import ReportsScreen      from "./screens/ReportsScreen";
import TeamScreen         from "./screens/TeamScreen";
import AuditScreen        from "./screens/AuditScreen";
import StatsScreen        from "./screens/StatsScreen";
import PlatsScreen        from "./screens/PlatsScreen";
import DemandesScreen     from "./screens/DemandesScreen";
import ImportScreen       from "./screens/ImportScreen";
import SettingsScreen     from "./screens/SettingsScreen";
import RegisterScreen     from "./screens/RegisterScreen";
import Sidebar from "./components/Sidebar";
import Header  from "./components/Header";
// OfflineBanner EST DANS ./components/ui — pas de fichier séparé
import { ToastContainer, OfflineBanner } from "./components/ui";

/**
 * normalizeRole — convertit le rôle brut du backend en clé de navigation.
 *
 * Le backend Django renvoie role.nom tel quel depuis la BD :
 *   "Serveur", "Cuisinier", "Gérant", "Gestionnaire de stock",
 *   "Manager", "Auditeur", "Administrateur"
 *
 * On supprime les accents et on met tout en minuscule pour avoir
 * des clés stables côté front, indépendantes de l'encodage.
 */
export function normalizeRole(rawRole) {
  const r = (rawRole || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // é→e, è→e, ê→e…

  if (r === "serveur")                         return "serveur";
  if (r === "cuisinier")                       return "cuisinier";
  if (r === "gerant")                          return "gerant";
  if (r.includes("gestionnaire"))              return "gestionnaire";
  if (r === "manager")                         return "manager";
  if (r === "auditeur")                        return "auditeur";
  if (r === "administrateur" || r === "admin") return "admin";

  console.warn("[App] Rôle non reconnu :", rawRole, "→ fallback admin");
  return "admin";
}

export default function App() {
  useEffect(() => { injectGlobalCSS(); }, []);

  const path    = window.location.pathname;
  const qrMatch = path.match(/^\/scan\/([a-f0-9-]{36})$/i);
  if (qrMatch) return <QROrderPage qrToken={qrMatch[1]} />;

  return <MainApp />;
}

function MainApp() {
  const [appView, setAppView]         = useLocalState("oresto_view", "landing");
  const [user, setUser]               = useState(() => getUser());
  const [screen, setScreen]           = useLocalState("oresto_screen", "dashboard");
  const [collapsed, setCollapsed]     = useState(false);
  const [selTable, setSelTable]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [tables,    setTables]    = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [products,  setProducts]  = useState([]);
  const [movements, setMovements] = useState([]);
  const [invoices,  setInvoices]  = useState([]);
  const [plats,     setPlats]     = useState([]);
  const [demandes,  setDemandes]  = useState([]);

  const { toasts, toast, removeToast } = useToast();
  const { isOnline } = useOfflineDetect();

  // Si user stocké → aller directement à l'app
  useEffect(() => { if (user) setAppView("app"); }, []);

  // Chargement données selon rôle
  useEffect(() => {
    if (!user) return;
    const role = normalizeRole(user.role);

    tablesService.list().then(d => d && setTables(unwrap(d))).catch(() => {});
    platsService.list().then(d => d && setPlats(unwrap(d))).catch(() => {});

    if (role !== "auditeur") {
      ordersService.list().then(d => d && setOrders(unwrap(d))).catch(() => {});
    }
    if (["gerant", "gestionnaire", "manager", "admin"].includes(role)) {
      productsService.list().then(d => d && setProducts(unwrap(d))).catch(() => {});
      movementsService.list().then(d => d && setMovements(unwrap(d))).catch(() => {});
    }
    if (["gerant", "manager", "admin", "serveur"].includes(role)) {
      invoicesService.list().then(d => d && setInvoices(unwrap(d))).catch(() => {});
    }
  }, [user]);

  // WebSocket
  useEffect(() => {
    if (!user) return;
    let ws;
    try {
      const wsBase = process.env.REACT_APP_WS_URL || "ws://localhost:8000/ws";
      ws = new WebSocket(`${wsBase}/notifications/`);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "new_order")   toast.info("Nouvelle commande", msg.data?.table_num ? `Table ${msg.data.table_num}` : "");
          if (msg.type === "stock_alert") toast.warning("Alerte stock", msg.data?.message || "");
        } catch {}
      };
    } catch {}
    return () => ws?.close();
  }, [user]);

  const handleLogin    = (u) => { setUser(u); setAppView("app"); setScreen("dashboard"); };
  const handleLogout   = ()  => { authService.logout(); setUser(null); setAppView("landing"); };
  const handleNav      = (s) => { setScreen(s); setSelTable(null); setSidebarOpen(false); };
  const handleSelTable = (t) => {
    setSelTable(t);
    setScreen("table-detail");
    ordersService.list({ table_id: t.id })
      .then(d => d && setOrders(prev => [
        ...prev.filter(o => (o.table_id || o.tableId) !== t.id),
        ...unwrap(d),
      ]))
      .catch(() => {});
  };

  const notifCount = useMemo(() =>
    orders.filter(o => o.statut === "EN_ATTENTE_ACCEPTATION").length +
    products.filter(p => p.qte < p.seuil).length
  , [orders, products]);

  // ── Vues sans auth ────────────────────────────────────────────────────
  
  if (appView === "landing") return (
    <>
      <LandingPage
        onGoToLogin={() => setAppView("login")}
        onGoToRegister={() => setAppView("register")}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
 
  if (appView === "register") return (
    <>
      <RegisterScreen
        onGoToLogin={() => setAppView("login")}
        onBack={() => setAppView("landing")}
        toast={toast}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );

  if (appView === "login" || !user) return (
    <>
      <LoginScreen onLogin={handleLogin} toast={toast} onBack={() => setAppView("landing")} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );

  // ── App authentifiée ──────────────────────────────────────────────────
  const role        = normalizeRole(user.role);
  const sharedProps = { role, toast };

  const SCREEN_TITLES = {
    dashboard: "Tableau de bord", tables: "Gestion des tables", kitchen: "Cuisine",
    orders: "Commandes", stock: "Stock", "stock-entries": "Entrées de stock",
    "stock-exits": "Sorties de stock", "stock-history": "Historique",
    "stock-validate": "Validation stock", "stock-request": "Demande de stock",
    invoices: "Factures", reports: "Rapports & KPI", team: "Équipe & Utilisateurs",
    menu: "Gestion du menu", audit: "Journal d'audit", stats: "Mes statistiques",
    demandes: "Demandes cuisiniers", settings: "Paramètres du restaurant",
    "table-detail": `Table ${selTable?.numero || ""}`,
  };

  const renderScreen = () => {
    if (screen === "table-detail" && selTable) {
      const liveTable = tables.find(t => t.id === selTable?.id) ?? selTable;
      return <TableDetailScreen {...sharedProps} table={liveTable} orders={orders} setOrders={setOrders} setTables={setTables} plats={plats} />;
    }
    switch (screen) {
      case "dashboard":      return <DashboardScreen {...sharedProps} tables={tables} orders={orders} products={products} movements={movements} />;
      case "tables":         return <TablesScreen {...sharedProps} tables={tables} setTables={setTables} orders={orders} onSelectTable={handleSelTable} />;
      case "kitchen":        return <KitchenScreen {...sharedProps} orders={orders} setOrders={setOrders} products={products} movements={movements} setMovements={setMovements} demandes={demandes} setDemandes={setDemandes} />;
      case "orders":         return <OrdersListScreen {...sharedProps} orders={orders} setOrders={setOrders} tables={tables} />;
      case "stock":          return <StockScreen {...sharedProps} products={products} setProducts={setProducts} movements={movements} setMovements={setMovements} />;
      case "stock-entries":  return <StockEntriesScreen {...sharedProps} products={products} movements={movements} setMovements={setMovements} />;
      case "stock-exits":    return <MovementsScreen {...sharedProps} movements={movements} setMovements={setMovements} products={products} typeFilter="SUPPRESSION" />;
      case "stock-history":  return <MovementsScreen {...sharedProps} movements={movements} setMovements={setMovements} products={products} typeFilter="ALL" />;
      case "stock-validate": return <MovementsScreen {...sharedProps} movements={movements} setMovements={setMovements} products={products} typeFilter="ALL" />;
      case "stock-request":  return <StockRequestScreen {...sharedProps} products={products} movements={movements} setMovements={setMovements} />;
      case "invoices":       return <InvoicesScreen {...sharedProps} />;
      case "reports":        return <ReportsScreen {...sharedProps} orders={orders} products={products} movements={movements} />;
      case "team":           return <TeamScreen {...sharedProps} />;
      case "audit":          return <AuditScreen {...sharedProps} />;
      case "stats":          return <StatsScreen {...sharedProps} orders={orders} />;
      case "demandes":       return <DemandesScreen {...sharedProps} />;
      case "menu":           return <PlatsScreen role={role} toast={toast} plats={plats} setPlats={setPlats} />;
      case "import":         return <ImportScreen {...sharedProps} setProducts={setProducts} setMovements={setMovements} setPlats={setPlats} />;
      case "settings":       return <SettingsScreen {...sharedProps} user={user} setUser={setUser} />;
      default:               return <DashboardScreen {...sharedProps} tables={tables} orders={orders} products={products} movements={movements} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        role={role}           // rôle déjà normalisé
        screen={screen}
        onNav={handleNav}
        user={user}
        onLogout={handleLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        notifCount={notifCount}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <OfflineBanner isOnline={isOnline} />
        <Header
          title={SCREEN_TITLES[screen] || ""}
          subtitle={screen === "table-detail" && selTable ? `${selTable.statut}` : ""}
          onMenuToggle={() => setSidebarOpen(true)}
          restaurant={user?.restaurant}
        />
        <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {renderScreen()}
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
