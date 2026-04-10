import { useState, useEffect } from "react";
import { C } from "../styles/tokens";
import { OrestoLogo, Btn, Spinner } from "../components/ui";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

export default function QROrderPage({ qrToken }) {
  const [step, setStep] = useState("loading"); // loading | menu | form | confirm | done | error
  const [menuData, setMenuData] = useState(null);
  const [cart, setCart] = useState({});
  const [nomClient, setNomClient] = useState("");
  const [observations, setObservations] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/public/menu/${qrToken}/`)
      .then(r => r.json())
      .then(data => {
        if (data.detail) { setError(data.detail); setStep("error"); return; }
        setMenuData(data);
        setStep("menu");
      })
      .catch(() => { setError("Impossible de charger le menu"); setStep("error"); });
  }, [qrToken]);

  const addToCart = (platId, delta) => {
    setCart(prev => {
      const val = Math.max(0, (prev[platId] || 0) + delta);
      const next = { ...prev };
      if (val === 0) delete next[platId]; else next[platId] = val;
      return next;
    });
  };

  const cartItems = () => {
    if (!menuData) return [];
    const all = menuData.menu.flatMap(c => c.plats);
    return Object.entries(cart).map(([id, qte]) => {
      const plat = all.find(p => p.id === parseInt(id));
      return { ...plat, qte };
    }).filter(Boolean);
  };

  const totalCart = () => cartItems().reduce((s, i) => s + i.prix * i.qte, 0);
  const cartCount = () => Object.values(cart).reduce((s, v) => s + v, 0);

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const items = Object.entries(cart).map(([plat_id, qte]) => ({ plat_id: parseInt(plat_id), qte }));
      const res = await fetch(`${API_BASE}/public/order/${qrToken}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, nom_client: nomClient || "Client", observations }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Erreur"); return; }
      setOrderId(data.commande_id);
      setStep("done");
    } catch { setError("Erreur réseau"); }
    finally { setSubmitting(false); }
  };

  const gold = menuData?.restaurant?.couleur_primaire || C.gold;

  if (step === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg1 }}>
      <div style={{ textAlign: "center" }}>
        <Spinner size={40} color={gold} />
        <p style={{ marginTop: 16, color: C.muted, fontSize: 13 }}>Chargement du menu…</p>
      </div>
    </div>
  );

  if (step === "error") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg1, padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <h2 style={{ color: C.text, marginBottom: 8 }}>Oops !</h2>
        <p style={{ color: C.muted, fontSize: 13 }}>{error}</p>
      </div>
    </div>
  );

  if (step === "done") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg1, padding: 20 }}>
      <div className="anim-scaleIn" style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: `${C.success}15`, border: `2px solid ${C.successBdr}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, margin: "0 auto 24px",
        }}>✅</div>
        <h2 style={{ color: C.text, marginBottom: 12, fontSize: 22 }}>Commande envoyée !</h2>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
          Votre commande <strong style={{ color: gold }}>{orderId}</strong> a bien été transmise.
        </p>
        <p style={{ color: C.muted, fontSize: 13 }}>Un serveur va s'en occuper dans quelques instants. 🍽️</p>
        <button onClick={() => { setCart({}); setStep("menu"); setNomClient(""); setObservations(""); }}
          style={{ marginTop: 28, background: "none", border: `1.5px solid ${gold}`, color: gold, borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
          Commander à nouveau
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg1, paddingBottom: cartCount() > 0 ? 100 : 40 }}>
      {/* Header */}
      <div style={{
        background: C.bg0, borderBottom: `1px solid ${C.border}`,
        padding: "16px 20px", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 640, margin: "0 auto" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
              {menuData?.restaurant?.nom}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>Table {menuData?.table?.numero}</div>
          </div>
          <OrestoLogo size={28} withText={false} />
        </div>
      </div>

      {step === "form" ? (
        /* ── Formulaire confirmation ── */
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
          <button onClick={() => setStep("menu")} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", marginBottom: 20 }}>
            ← Retour au menu
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>Votre commande</h2>

          {cartItems().map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 14, color: C.text }}>{item.qte}× {item.nom}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{(item.prix * item.qte).toLocaleString()} FCFA</span>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", fontWeight: 700, fontSize: 16 }}>
            <span style={{ color: C.text }}>Total</span>
            <span style={{ color: gold }}>{totalCart().toLocaleString()} FCFA</span>
          </div>

          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 6 }}>Votre prénom (optionnel)</label>
              <input value={nomClient} onChange={e => setNomClient(e.target.value)}
                placeholder="Ex: Marie"
                style={{ width: "100%", padding: "10px 13px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Inter',sans-serif", background: C.bg0, color: C.text }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 6 }}>Observations (allergies, préférences…)</label>
              <textarea value={observations} onChange={e => setObservations(e.target.value)}
                placeholder="Sans piment, sans gluten…"
                rows={3}
                style={{ width: "100%", padding: "10px 13px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Inter',sans-serif", background: C.bg0, color: C.text, resize: "vertical" }} />
            </div>
          </div>

          {error && <div style={{ background: C.dangerBg, border: `1px solid ${C.dangerBdr}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.danger, marginTop: 12 }}>⚠ {error}</div>}

          <button onClick={submitOrder} disabled={submitting}
            style={{
              marginTop: 24, width: "100%",
              background: `linear-gradient(135deg,${gold},${C.goldD})`,
              color: "#fff", border: "none", borderRadius: 10,
              padding: "16px", fontSize: 15, fontWeight: 700,
              fontFamily: "'Inter',sans-serif", cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}>
            {submitting ? "Envoi en cours…" : "✓ Envoyer ma commande"}
          </button>
        </div>
      ) : (
        /* ── Menu ── */
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px" }}>
          {menuData?.menu?.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 32 }}>
              <h3 style={{
                fontSize: 13, fontWeight: 700, color: gold,
                textTransform: "uppercase", letterSpacing: 2,
                marginBottom: 14, paddingBottom: 8,
                borderBottom: `2px solid ${C.goldBorder}`,
              }}>
                {cat.categorie}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {cat.plats.map((plat, pi) => (
                  <div key={pi} style={{
                    background: C.bg0, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: 16, display: "flex", gap: 14, alignItems: "center",
                  }}>
                    {plat.image_url && (
                      <img src={plat.image_url} alt={plat.nom} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{plat.nom}</div>
                      {plat.description && <div style={{ fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>{plat.description}</div>}
                      <div style={{ fontSize: 14, fontWeight: 700, color: gold, marginTop: 6 }}>{plat.prix.toLocaleString()} FCFA</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <button onClick={() => addToCart(plat.id, -1)}
                        style={{ width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${C.border}`, background: C.bg2, color: C.text, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text, minWidth: 20, textAlign: "center" }}>{cart[plat.id] || 0}</span>
                      <button onClick={() => addToCart(plat.id, 1)}
                        style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: gold, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panier flottant */}
      {cartCount() > 0 && step === "menu" && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 50, width: "calc(100% - 40px)", maxWidth: 600,
        }}>
          <button onClick={() => setStep("form")} style={{
            width: "100%", padding: "16px 24px",
            background: `linear-gradient(135deg,${gold},${C.goldD})`,
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: `0 8px 30px ${gold}50`,
            fontFamily: "'Inter',sans-serif",
          }}>
            <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "2px 10px", fontSize: 13 }}>
              {cartCount()} article{cartCount() > 1 ? "s" : ""}
            </span>
            <span>Voir ma commande →</span>
            <span>{totalCart().toLocaleString()} FCFA</span>
          </button>
        </div>
      )}
    </div>
  );
}
