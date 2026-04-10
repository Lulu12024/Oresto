/**
 * ORESTO — Application Principale
 * Routing: Landing → Login → Dashboard | /scan/:token → QR Order
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { injectGlobalCSS, C } from "./styles/tokens";
import { useToast, useOfflineDetect, useLocalState } from "./hooks";
import { authService } from "./api/auth";
import { tablesService } from "./api/tables";
import { ordersService } from "./api/orders";
import { productsService, movementsService } from "./api/stock";
import { invoicesService, usersService, auditService, reportsService, notificationsService, demandesService } from "./api/services";
import { unwrap, getUser } from "./api/client";
import { platsService } from "./api/plats";

// ── Composants layout ──
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { ToastContainer, OfflineBanner, OrestoLogo, Spinner } from "./components/ui";

// ── Écrans spéciaux ──
import LandingPage from "./screens/LandingPage";
import LoginScreen from "./screens/LoginScreen";
import QROrderPage from "./screens/QROrderPage";

// ── Écrans application ──
import DashboardScreen from "./screens/DashboardScreen";
import TablesScreen from "./screens/TablesScreen";
import TableDetailScreen from "./screens/TableDetailScreen";
import KitchenScreen from "./screens/KitchenScreen";
import OrdersListScreen from "./screens/OrdersListScreen";
import StockScreen from "./screens/StockScreen";
import StockEntriesScreen from "./screens/StockEntriesScreen";
import MovementsScreen from "./screens/MovementsScreen";
import StockRequestScreen from "./screens/StockRequestScreen";
import InvoicesScreen from "./screens/InvoicesScreen";
import ReportsScreen from "./screens/ReportsScreen";
import TeamScreen from "./screens/TeamScreen";
import AuditScreen from "./screens/AuditScreen";
import StatsScreen from "./screens/StatsScreen";
import PlatsScreen from "./screens/PlatsScreen";
import DemandesScreen from "./screens/DemandesScreen";
import ImportScreen from "./screens/ImportScreen";

export default function App() {
  useEffect(() => { injectGlobalCSS(); }, []);

  // ── Détection QR scan (/scan/:token) ──────────────────────────────
  const path = window.location.pathname;
  const qrMatch = path.match(/^\/scan\/([a-f0-9-]{36})$/i);
  if (qrMatch) {
    return <QROrderPage qrToken={qrMatch[1]} />;
  }

  return <MainApp />;
}

function MainApp() {
  const [appView, setAppView] = useLocalState("oresto_view", "landing"); // landing | login | app
  const [user, setUser] = useState(() => getUser());
  const [screen, setScreen] = useLocalState("oresto_screen", "dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [selTable, setSelTable] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [plats, setPlats] = useState([]);
  const [demandes, setDemandes] = useState([]);

  const { toasts, toast, removeToast } = useToast();
  const { isOnline } = useOfflineDetect();

  // Si un user existe en storage → aller directement à l'app
  useEffect(() => {
    if (user) setAppView("app");
  }, []);

  // Chargement données
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [t, o, p, m, i, pl, d] = await Promise.allSettled([
          tablesService.list(),
          ordersService.list(),
          productsService.list(),
          movementsService.list(),
          invoicesService.list(),
          platsService.list(),
          demandesService.list(),
        ]);
        if (t.status === "fulfilled" && t.value) setTables(unwrap(t.value));
        if (o.status === "fulfilled" && o.value) setOrders(unwrap(o.value));
        if (p.status === "fulfilled" && p.value) setProducts(unwrap(p.value));
        if (m.status === "fulfilled" && m.value) setMovements(unwrap(m.value));
        if (i.status === "fulfilled" && i.value) setInvoices(unwrap(i.value));
        if (pl.status === "fulfilled" && pl.value) setPlats(unwrap(pl.value));
        if (d.status === "fulfilled" && d.value) setDemandes(unwrap(d.value));
      } catch { /* mode offline */ }
    };
    load();
  }, [user]);

  // WebSocket — room par restaurant
  useEffect(() => {
    if (!user || !user.restaurant) return;
    const wsUrl = `${process.env.REACT_APP_WS_URL || "ws://localhost:8000/ws"}/restaurant/${user.restaurant.id}/`;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "new_order") {
            toast.info("Nouvelle commande", `Table ${msg.data?.table_num}`);
            ordersService.list().then(d => d && setOrders(unwrap(d))).catch(() => {});
          }
          if (msg.type === "order_ready") {
            toast.success("Commande prête", msg.data?.table_num ? `Table ${msg.data.table_num}` : "");
          }
          if (msg.type === "stock_alert") {
            toast.warning("Alerte stock", msg.data?.message || "");
          }
        } catch {}
      };
    } catch {}
    return () => ws?.close();
  }, [user]);

  const handleLogin = (u) => { setUser(u); setAppView("app"); setScreen("dashboard"); };
  const handleLogout = () => { authService.logout(); setUser(null); setAppView("landing"); };
  const handleNav = (s) => { setScreen(s); setSelTable(null); setSidebarOpen(false); };
  const handleSelTable = (t) => {
    setSelTable(t);
    setScreen("table-detail");
    ordersService.list({ table_id: t.id })
      .then(d => d && setOrders(prev => [...prev.filter(o => (o.table_id || o.tableId) !== t.id), ...unwrap(d)]))
      .catch(() => {});
  };

  const notifCount = useMemo(() =>
    orders.filter(o => o.statut === "EN_ATTENTE_ACCEPTATION").length +
    products.filter(p => p.qte < p.seuil).length
  , [orders, products]);

  // ── Routing principal ─────────────────────────────────────────────
  if (appView === "landing") {
    return (
      <>
        <LandingPage onGoToLogin={() => setAppView("login")} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  if (appView === "login" || !user) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} toast={toast} onBack={() => setAppView("landing")} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // ── Application restaurant ─────────────────────────────────────────
  const role = (user?.role || "").toLowerCase()
    .replace("gestionnaire de stock", "gestionnaire")
    .replace("administrateur", "admin");

  const sharedProps = { role, toast };

  const SCREEN_TITLES = {
    dashboard: "Tableau de bord",
    tables: "Gestion des tables",
    kitchen: "Cuisine",
    orders: "Commandes",
    stock: "Stock",
    "stock-entries": "Entrées de stock",
    "stock-exits": "Sorties de stock",
    "stock-history": "Historique",
    "stock-validate": "Validation stock",
    "stock-request": "Demande de stock",
    invoices: "Factures",
    reports: "Rapports & KPI",
    team: "Équipe & Utilisateurs",
    menu: "Gestion du menu",
    audit: "Journal d'audit",
    stats: "Mes statistiques",
    "table-detail": `Table ${selTable?.numero || ""}`,
    demandes: "Demandes cuisiniers",
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
      case "stock-request":  return <StockRequestScreen {...sharedProps} products={products} movements={movements} setMovements={setMovements} />;
      case "invoices":       return <InvoicesScreen {...sharedProps} />;
      case "reports":        return <ReportsScreen {...sharedProps} orders={orders} products={products} movements={movements} />;
      case "team":           return <TeamScreen {...sharedProps} />;
      case "audit":          return <AuditScreen {...sharedProps} />;
      case "stats":          return <StatsScreen {...sharedProps} orders={orders} />;
      case "demandes":       return <DemandesScreen {...sharedProps} />;
      case "menu":           return <PlatsScreen role={role} toast={toast} plats={plats} setPlats={setPlats} />;
      case "import":         return <ImportScreen {...sharedProps} setProducts={setProducts} setMovements={setMovements} setPlats={setPlats} />;
      default:               return <DashboardScreen {...sharedProps} tables={tables} orders={orders} products={products} movements={movements} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg1 }}>
      <Sidebar
        role={role}
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
