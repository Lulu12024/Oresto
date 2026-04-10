import { useState, useEffect } from "react";
import { C } from "../styles/tokens";
import { OrestoLogo, Btn } from "../components/ui";

const FEATURES = [
  {
    icon: "📱",
    titre: "Commandes QR Code",
    desc: "Vos clients scannent le QR sur leur table et commandent directement depuis leur téléphone. Zéro friction, zéro erreur.",
  },
  {
    icon: "🍳",
    titre: "Suivi en temps réel",
    desc: "Les serveurs et cuisiniers reçoivent les commandes instantanément. Chaque étape est tracée, du QR code à la livraison.",
  },
  {
    icon: "📦",
    titre: "Gestion des stocks",
    desc: "Suivez vos entrées et sorties, recevez des alertes stock faible et dates de péremption, générez des rapports détaillés.",
  },
  {
    icon: "📊",
    titre: "Tableaux de bord",
    desc: "KPIs, statistiques de ventes, performances cuisiniers — tout en un seul coup d'œil pour piloter votre restaurant.",
  },
  {
    icon: "🔒",
    titre: "Rôles & Permissions",
    desc: "7 rôles personnalisés : serveur, cuisinier, gérant, gestionnaire, manager, auditeur, admin. Chacun voit ce dont il a besoin.",
  },
  {
    icon: "🧾",
    titre: "Facturation automatique",
    desc: "Factures générées automatiquement, export PDF, historique complet. Mobile Money, carte, espèces : tout est géré.",
  },
];

const PLANS = [
  {
    nom: "Starter",
    prix: "15 000",
    desc: "Idéal pour les petits restaurants",
    features: ["Jusqu'à 10 tables", "Module commandes", "5 utilisateurs", "Notifications temps réel", "Export PDF"],
    color: C.info,
    popular: false,
  },
  {
    nom: "Pro",
    prix: "35 000",
    desc: "Pour les restaurants en croissance",
    features: ["Jusqu'à 30 tables", "Commandes + Stock", "15 utilisateurs", "QR Code clients", "Rapports avancés", "Support prioritaire"],
    color: C.gold,
    popular: true,
  },
  {
    nom: "Enterprise",
    prix: "Sur devis",
    desc: "Pour les chaînes et groupes",
    features: ["Tables illimitées", "Tous les modules", "Utilisateurs illimités", "Multi-établissements", "API dédiée", "Accompagnement"],
    color: C.purple,
    popular: false,
  },
];

const STATS = [
  { val: "500+", label: "Restaurants" },
  { val: "50 000+", label: "Commandes/jour" },
  { val: "99.9%", label: "Disponibilité" },
  { val: "< 1s", label: "Notification QR" },
];

export default function LandingPage({ onGoToLogin }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg0, color: C.text }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 5%",
        height: 68,
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
              transition: "color .2s",
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

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "100px 5% 60px",
        background: `linear-gradient(135deg, ${C.bg0} 0%, ${C.bg1} 40%, ${C.goldFaint} 100%)`,
        position: "relative", overflow: "hidden",
      }}>
        {/* Déco background */}
        <div style={{
          position: "absolute", width: 600, height: 600, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.gold}10 0%, transparent 70%)`,
          top: -100, right: -100, pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.gold}08 0%, transparent 70%)`,
          bottom: -50, left: -50, pointerEvents: "none",
        }} />

        <div className="anim-fadeUp" style={{ textAlign: "center", maxWidth: 780, position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: C.goldBg, border: `1px solid ${C.goldBorder}`,
            borderRadius: 24, padding: "6px 16px", marginBottom: 32,
          }}>
            <span style={{ fontSize: 14 }}>✨</span>
            <span style={{ fontSize: 12, color: C.goldD, fontWeight: 600, letterSpacing: 1 }}>
              La plateforme SaaS pour restaurants connectés
            </span>
          </div>

          <h1 className="serif" style={{
            fontSize: "clamp(2.4rem, 6vw, 4rem)",
            fontWeight: 700,
            color: C.text,
            lineHeight: 1.15,
            marginBottom: 24,
          }}>
            Gérez votre restaurant<br />
            <span style={{ color: C.gold }}>intelligemment</span>
          </h1>

          <p style={{
            fontSize: 17, color: C.textSub, lineHeight: 1.7,
            maxWidth: 580, margin: "0 auto 40px",
          }}>
            Du QR code sur chaque table jusqu'à la facture finale — Oresto centralise
            commandes, stocks et équipes en temps réel. Simple, rapide, fiable.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={onGoToLogin} style={{ padding: "14px 32px", fontSize: 15 }}>
              🚀 Démarrer gratuitement
            </Btn>
            <Btn variant="outline" onClick={() => document.getElementById('fonctionnalités')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: "14px 32px", fontSize: 15 }}>
              Voir les fonctionnalités
            </Btn>
          </div>

          {/* Preview mockup */}
          <div style={{ marginTop: 60, position: "relative" }}>
            <div style={{
              background: C.bg0,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              boxShadow: C.shadowLg,
              padding: "20px 24px",
              display: "inline-block",
              minWidth: 340,
            }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center" }}>
                <OrestoLogo size={28} withText={false} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Restaurant Le Jardin</div>
                  <div style={{ fontSize: 11, color: C.success, fontWeight: 500 }}>● 12 tables actives</div>
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>Aujourd'hui</div>
              </div>
              {[
                { table: "T-01", statut: "En service", color: C.warning, cmd: "3 commandes" },
                { table: "T-03", statut: "QR scanné", color: C.info, cmd: "Commande client" },
                { table: "T-07", statut: "Prête à payer", color: C.purple, cmd: "47 500 FCFA" },
              ].map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", background: C.bg1,
                  borderRadius: 8, marginBottom: 8, border: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: `${r.color}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: r.color,
                  }}>
                    {r.table}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{r.statut}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{r.cmd}</div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
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

      {/* ── FEATURES ── */}
      <section id="fonctionnalités" style={{ padding: "96px 5%", background: C.bg1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Fonctionnalités
            </div>
            <h2 className="serif" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: C.text }}>
              Tout ce dont votre restaurant a besoin
            </h2>
            <p style={{ fontSize: 15, color: C.muted, marginTop: 16, maxWidth: 500, margin: "16px auto 0" }}>
              Une plateforme complète, pensée pour les restaurants modernes.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="card hover-lift" style={{
                padding: "28px 24px",
                transition: "all .25s",
                cursor: "default",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: C.goldBg, border: `1px solid ${C.goldBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, marginBottom: 18,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10 }}>{f.titre}</h3>
                <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QR CODE FLOW ── */}
      <section style={{
        padding: "96px 5%",
        background: `linear-gradient(135deg, ${C.goldFaint} 0%, ${C.bg0} 100%)`,
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Nouveau flux client
            </div>
            <h2 className="serif" style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 700, color: C.text, marginBottom: 20 }}>
              Le client commande lui-même, sans application
            </h2>
            <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7, marginBottom: 28 }}>
              Un simple QR code sur chaque table suffit. Le client scanne, découvre le menu,
              passe sa commande — et le serveur est notifié instantanément.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { step: "1", label: "Le client scanne le QR code de sa table" },
                { step: "2", label: "Il consulte le menu et choisit ses plats" },
                { step: "3", label: "Sa commande arrive directement en cuisine" },
                { step: "4", label: "Le serveur valide, le cuisinier prépare" },
              ].map(s => (
                <div key={s.step} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: `linear-gradient(135deg,${C.gold},${C.goldD})`,
                    color: "#fff", fontWeight: 700, fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>{s.step}</div>
                  <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.5, paddingTop: 6 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Visuel QR mock */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              background: C.bg0, border: `1px solid ${C.border}`,
              borderRadius: 20, padding: 32, boxShadow: C.shadowLg,
              textAlign: "center", maxWidth: 280,
            }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, letterSpacing: 1 }}>TABLE N°05</div>
              {/* QR code simulé */}
              <div style={{
                width: 160, height: 160, margin: "0 auto 16px",
                border: `3px solid ${C.gold}`,
                borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: C.bg1,
                overflow: "hidden",
                position: "relative",
              }}>
                <svg viewBox="0 0 100 100" width="140" height="140">
                  {/* QR simplifié */}
                  {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => (
                    Math.random() > 0.5 || (r<3&&c<3) || (r<3&&c>3) || (r>3&&c<3) ?
                    <rect key={`${r}-${c}`} x={c*13+5} y={r*13+5} width="11" height="11" fill={C.gold} opacity={0.7+(Math.random()*0.3)} rx="1"/> : null
                  )))}
                  <rect x="5" y="5" width="35" height="35" fill="none" stroke={C.gold} strokeWidth="3" rx="3"/>
                  <rect x="60" y="5" width="35" height="35" fill="none" stroke={C.gold} strokeWidth="3" rx="3"/>
                  <rect x="5" y="60" width="35" height="35" fill="none" stroke={C.gold} strokeWidth="3" rx="3"/>
                </svg>
              </div>
              <div className="serif" style={{ fontSize: 16, fontWeight: 700, color: C.goldD }}>ORESTO</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Scannez pour commander</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TARIFS ── */}
      <section id="tarifs" style={{ padding: "96px 5%", background: C.bg1 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Tarifs</div>
            <h2 className="serif" style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 700, color: C.text }}>Des offres pour chaque restaurant</h2>
            <p style={{ fontSize: 14, color: C.muted, marginTop: 12 }}>Essai gratuit 30 jours sur tous les plans. Sans engagement.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 24 }}>
            {PLANS.map((plan, i) => (
              <div key={i} className="card hover-lift" style={{
                padding: "32px 28px",
                border: plan.popular ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                position: "relative",
              }}>
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: `linear-gradient(135deg,${C.gold},${C.goldD})`,
                    color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 1,
                    padding: "4px 16px", borderRadius: 20,
                  }}>
                    ★ POPULAIRE
                  </div>
                )}
                <div style={{ fontSize: 12, color: plan.color, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                  {plan.nom}
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{plan.desc}</div>
                <div style={{ marginBottom: 24 }}>
                  <span className="serif" style={{ fontSize: "2rem", fontWeight: 700, color: C.text }}>{plan.prix}</span>
                  {plan.prix !== "Sur devis" && <span style={{ fontSize: 13, color: C.muted }}> FCFA/mois</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: plan.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 13, color: C.textSub }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Btn
                  variant={plan.popular ? "primary" : "outline"}
                  onClick={onGoToLogin}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {plan.prix === "Sur devis" ? "Nous contacter" : "Commencer l'essai"}
                </Btn>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: "96px 5%",
        background: `linear-gradient(135deg, ${C.text} 0%, #2D2820 100%)`,
        textAlign: "center",
      }}>
        <h2 className="serif" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>
          Prêt à connecter votre restaurant ?
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}>
          Rejoignez les restaurants qui utilisent Oresto pour servir mieux et plus vite.
        </p>
        <Btn onClick={onGoToLogin} style={{ padding: "16px 40px", fontSize: 15 }}>
          🍽️ Démarrer maintenant — c'est gratuit
        </Btn>
      </section>

      {/* ── FOOTER ── */}
      <footer id="contact" style={{ background: "#111", padding: "40px 5%" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <OrestoLogo size={32} withText />
          <div style={{ display: "flex", gap: 24 }}>
            {["Fonctionnalités", "Tarifs", "Contact", "Politique de confidentialité"].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", transition: "color .2s" }}
                onMouseEnter={e => e.target.style.color = C.gold}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.4)"}
              >{l}</a>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            © 2026 Oresto · Restaurant Connecté
          </div>
        </div>
      </footer>
    </div>
  );
}
