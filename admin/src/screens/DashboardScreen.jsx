import { useState, useEffect } from "react";
import { C } from "../styles/tokens";
import { Card, StatCard, Badge, Spinner } from "../components/ui";
import { restaurantsApi, abonnementsApi } from "../api/client";

export default function DashboardScreen({ toast }) {
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([restaurantsApi.stats(), restaurantsApi.list()])
      .then(([s, r]) => {
        setStats(s);
        setRestaurants(Array.isArray(r) ? r : (r.results || []));
      })
      .catch(e => toast.error("Erreur", e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <Spinner size={36} />
    </div>
  );

  const recents = [...restaurants]
    .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
    .slice(0, 6);

  const statutColor = { actif: C.success, suspendu: C.warning, inactif: C.danger };

  return (
    <div className="anim-fadeUp">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Vue d'ensemble</h2>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Santé de la plateforme Oresto en temps réel</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 18, marginBottom: 32 }}>
        <StatCard label="Total restaurants" value={stats?.total_restaurants ?? "—"} icon="🍽" color={C.gold} />
        <StatCard label="Restaurants actifs" value={stats?.actifs ?? "—"} icon="✅" color={C.success} />
        <StatCard label="Suspendus" value={stats?.suspendus ?? "—"} icon="⚠" color={C.warning} />
        <StatCard label="Plans actifs" value={stats?.par_plan?.length ?? "—"} icon="📋" color={C.info} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Restaurants récents */}
        <Card>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Restaurants récents</h3>
          </div>
          {recents.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "24px 0" }}>Aucun restaurant</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {recents.map((r, i) => (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 0",
                  borderBottom: i < recents.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: C.goldBg, border: `1px solid ${C.goldBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>🍽</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }} className="truncate">{r.nom}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{r.ville || r.pays} · {r.plan_nom || "Sans plan"}</div>
                  </div>
                  <Badge color={statutColor[r.statut] || C.muted}>
                    {r.statut}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Répartition par plan */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 18 }}>Par plan</h3>
          {(stats?.par_plan || []).length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13 }}>Aucune donnée</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(stats?.par_plan || []).map((p, i) => {
                const colors = [C.gold, C.info, C.purple];
                const color = colors[i % colors.length];
                const pct = stats.total_restaurants > 0
                  ? Math.round((p.nb / stats.total_restaurants) * 100) : 0;
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.textSub, textTransform: "capitalize" }}>{p.nom}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.nb}</span>
                    </div>
                    <div style={{ height: 6, background: C.bg3, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width .5s" }} />
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{pct}% du total</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Légende statuts */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 12 }}>Statuts</div>
            {[
              { label: "Actif", color: C.success, val: stats?.actifs },
              { label: "Suspendu", color: C.warning, val: stats?.suspendus },
              { label: "Inactif", color: C.danger, val: (stats?.total_restaurants || 0) - (stats?.actifs || 0) - (stats?.suspendus || 0) },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.val ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
