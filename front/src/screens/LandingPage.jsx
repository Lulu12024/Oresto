import { useState, useEffect } from "react";
import { C } from "../styles/tokens";
import { OrestoLogo, Btn, Spinner } from "../components/ui";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const FEATURES = [
  { icon: "📱", titre: "Commandes QR Code",     desc: "Vos clients scannent le QR sur leur table et commandent directement depuis leur téléphone. Zéro friction, zéro erreur." },
  { icon: "🍳", titre: "Suivi en temps réel",   desc: "Les serveurs et cuisiniers reçoivent les commandes instantanément. Chaque étape est tracée, du QR code à la livraison." },
  { icon: "📦", titre: "Gestion des stocks",    desc: "Suivez vos entrées et sorties, recevez des alertes stock faible et dates de péremption, générez des rapports détaillés." },
  { icon: "📊", titre: "Tableaux de bord",      desc: "KPIs, statistiques de ventes, performances cuisiniers — tout en un seul coup d'œil pour piloter votre restaurant." },
  { icon: "🔒", titre: "Rôles & Permissions",   desc: "7 rôles personnalisés : serveur, cuisinier, gérant, gestionnaire, manager, auditeur, admin. Chacun voit ce dont il a besoin." },
  { icon: "🧾", titre: "Facturation automatique", desc: "Factures générées automatiquement avec l'en-tête de votre restaurant, export PDF, historique complet." },
];

const STATS = [
  { val: "500+",   label: "Restaurants" },
  { val: "50 000+", label: "Commandes/jour" },
  { val: "99.9%",  label: "Disponibilité" },
  { val: "< 1s",   label: "Notification QR" },
];

/** Construit les features affichées pour chaque plan selon ses modules */
function buildPlanFeatures(plan) {
  const features = [];
  if (plan.module_commandes) {
    features.push("Gestion des tables & commandes");
    features.push("Commandes QR Code client");
    features.push("Facturation & reçus PDF");
    features.push("Gestion du menu");
    features.push("Équipe & utilisateurs illimités");
  }
  if (plan.module_stock) {
    features.push("Gestion des stocks complète");
    features.push("Alertes stock faible / péremption");
    features.push("Historique & rapports stock");
  }
  if (plan.module_support) {
    features.push("Support prioritaire 24h/24");
    features.push("Accompagnement à l'onboarding");
  }
  return features;
}

/** Couleur par position dans la liste des plans */
const PLAN_COLORS = [C.info, C.gold, C.purple];

export default function LandingPage({ onGoToLogin , onGoToRegister }) {
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans]       = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Scroll effect
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  // Charger les plans depuis l'API (sans authentification)
  useEffect(() => {
    fetch(`${API_BASE}/plans/`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setPlans(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => {
        // Fallback si l'API est indisponible
        setPlans([
          {
            id: 1, nom: "Starter", prix_mensuel: 15000,
            description: "Idéal pour démarrer",
            module_commandes: true, module_stock: false, module_support: false,
          },
          {
            id: 2, nom: "Pro", prix_mensuel: 35000,
            description: "Pour les restaurants en croissance",
            module_commandes: true, module_stock: true, module_support: false,
          },
          {
            id: 3, nom: "Business", prix_mensuel: 65000,
            description: "Tout inclus + support dédié",
            module_commandes: true, module_stock: true, module_support: true,
          },
        ]);
      })
      .finally(() => setPlansLoading(false));
  }, []);

  const fmtPrix = (prix) => {
    const n = parseFloat(prix);
    if (!n || isNaN(n)) return "Sur devis";
    return n.toLocaleString("fr-FR");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg0, color: C.text }}>

      {/* ── NAVBAR ───────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 5%", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(255,255,255,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        transition: "all .3s",
      }}>
        <OrestoLogo size={36} withText />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {["Fonctionnalités", "Tarifs", "Contact"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{
              fontSize: 13, color: C.textSub, fontWeight: 500,
              textDecoration: "none", transition: "color .2s",
            }}
              onMouseEnter={e => e.target.style.color = C.gold}
              onMouseLeave={e => e.target.style.color = C.textSub}
            >{item}</a>
          ))}
          <Btn onClick={onGoToLogin} style={{ padding: "8px 22px" }}>
            Se connecter
          </Btn>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "100px 5% 60px",
        background: `linear-gradient(135deg, ${C.bg0} 0%, ${C.bg1} 40%, ${C.goldFaint || C.bg1} 100%)`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", width: 600, height: 600, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.gold}10 0%, transparent 70%)`,
          top: -100, right: -100, pointerEvents: "none",
        }} />

        <div className="anim-fadeUp" style={{ textAlign: "center", maxWidth: 780, position: "relative" }}>
         
          <h1 className="serif" style={{
            fontSize: "clamp(2.4rem, 6vw, 4rem)",
            fontWeight: 700, color: C.text, lineHeight: 1.15, marginBottom: 24,
          }}>
            Gérez votre restaurant<br />
            <span style={{ color: C.gold }}>intelligemment</span>
          </h1>

          <p style={{ fontSize: 17, color: C.textSub, lineHeight: 1.7, maxWidth: 580, margin: "0 auto 40px" }}>
            Du QR code sur chaque table jusqu'à la facture finale, Oresto centralise
            commandes, stocks et équipes en temps réel.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={onGoToRegister} style={{ padding: "14px 32px", fontSize: 15 }}>
              Commencer l'essai gratuit →
            </Btn>
            <Btn variant="outline" style={{ padding: "14px 32px", fontSize: 15 }}>
                Demander une Démo
              </Btn>
            {/* <a href="#fonctionnalités" style={{ textDecoration: "none" }}>
              <Btn variant="outline" style={{ padding: "14px 32px", fontSize: 15 }}>
                Voir les fonctionnalités
              </Btn>
            </a> */}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section style={{ background: C.text, padding: "48px 5%" }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 32,
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div className="serif" style={{ fontSize: "2.4rem", fontWeight: 700, color: C.gold }}>{s.val}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4, letterSpacing: .5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="fonctionnalités" style={{ padding: "96px 5%", background: C.bg1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Fonctionnalités
            </div>
            <h2 className="serif" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: C.text }}>
              Tout ce dont votre restaurant a besoin
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="card" style={{ padding: "28px 24px" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10 }}>{f.titre}</h3>
                <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFS ───────────────────────────────────────────────────── */}
      <section id="tarifs" style={{ padding: "96px 5%", background: C.bg0 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Tarifs
            </div>
            <h2 className="serif" style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 700, color: C.text }}>
              Des offres pour chaque restaurant
            </h2>
            <p style={{ fontSize: 14, color: C.muted, marginTop: 12 }}>
              Essai gratuit 30 jours sur tous les plans. Sans engagement.
            </p>
          </div>

          {plansLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Spinner size={32} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
              {plans.map((plan, i) => {
                const color   = PLAN_COLORS[i % PLAN_COLORS.length];
                const popular = i === 1; // le 2e plan est "populaire"
                const features = buildPlanFeatures(plan);
                return (
                  <div key={plan.id} className="card hover-lift" style={{
                    padding: "32px 28px",
                    border: popular ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                    position: "relative",
                  }}>
                    {popular && (
                      <div style={{
                        position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                        background: `linear-gradient(135deg,${C.gold},${C.goldD || C.gold})`,
                        color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 1,
                        padding: "4px 16px", borderRadius: 20,
                      }}>
                        ★ POPULAIRE
                      </div>
                    )}

                    <div style={{ fontSize: 12, color, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                      {plan.nom}
                    </div>
                    {plan.description && (
                      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{plan.description}</div>
                    )}

                    {/* Prix */}
                    <div style={{ marginBottom: 24 }}>
                      <span className="serif" style={{ fontSize: "2rem", fontWeight: 700, color: C.text }}>
                        {fmtPrix(plan.prix_mensuel)}
                      </span>
                      {parseFloat(plan.prix_mensuel) > 0 && (
                        <span style={{ fontSize: 13, color: C.muted }}> FCFA/mois</span>
                      )}
                    </div>

                    {/* Modules inclus — badges */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                      {plan.module_commandes && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${C.info}20`, color: C.info, border: `1px solid ${C.info}40` }}>
                          Restaurant & Équipe
                        </span>
                      )}
                      {plan.module_stock && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${C.gold}20`, color: C.gold, border: `1px solid ${C.gold}40` }}>
                          + Stock
                        </span>
                      )}
                      {plan.module_support && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${C.purple || C.gold}20`, color: C.purple || C.gold, border: `1px solid ${C.purple || C.gold}40` }}>
                          + Support 24h/24
                        </span>
                      )}
                    </div>

                    {/* Liste des fonctionnalités */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 28 }}>
                      {features.map((f, j) => (
                        <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 13, color: C.textSub }}>{f}</span>
                        </div>
                      ))}
                    </div>

                    <Btn
                      variant={popular ? "primary" : "outline"}
                      onClick={onGoToRegister}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      Commencer l'essai
                    </Btn>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section id="contact" style={{
        padding: "96px 5%",
        background: `linear-gradient(135deg, ${C.text} 0%, #2D2820 100%)`,
        textAlign: "center",
      }}>
        <h2 className="serif" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>
          Prêt à connecter votre restaurant ?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>
          Essai gratuit 30 jours, sans carte bancaire. Démarrez en moins de 5 minutes.
        </p>
        <Btn onClick={onGoToRegister} style={{ padding: "16px 40px", fontSize: 16 }}>
          Démarrer gratuitement →
        </Btn>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ background: C.bg0, borderTop: `1px solid ${C.border}`, padding: "32px 5%", textAlign: "center" }}>
        <OrestoLogo size={28} withText />
        <p style={{ fontSize: 12, color: C.muted, marginTop: 16 }}>
          © {new Date().getFullYear()} Oresto — Plateforme SaaS de gestion de restaurants
        </p>
      </footer>
    </div>
  );
}
