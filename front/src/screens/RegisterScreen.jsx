/**
 * RegisterScreen — Inscription self-service d'un restaurant
 * 4 étapes :
 *  1. Infos entreprise
 *  2. Compte administrateur
 *  3. Choix du plan
 *  4. Succès
 */
import { useState, useEffect } from "react";
import { C } from "../styles/tokens";
import { OrestoLogo, Btn, Input, Spinner } from "../components/ui";
import LogoUpload from "../components/LogoUpload";
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const STEPS = [
  { num: 1, label: "Votre entreprise" },
  { num: 2, label: "Compte admin"     },
  { num: 3, label: "Votre plan"       },
];

/* ── Petits helpers UI ─────────────────────────────────────────── */
const Field = ({ label, error, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && (
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, letterSpacing: .3 }}>
        {label}
      </label>
    )}
    {children}
    {error && <span style={{ fontSize: 11, color: C.danger }}>{error}</span>}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = "text", disabled }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    style={{
      padding: "10px 14px", borderRadius: 8, fontSize: 13,
      border: `1.5px solid ${C.border}`, background: C.bg0,
      color: C.text, fontFamily: "'Inter',sans-serif",
      outline: "none", transition: "border .2s",
      width: "100%", boxSizing: "border-box",
    }}
    onFocus={e => e.target.style.borderColor = C.gold}
    onBlur={e => e.target.style.borderColor = C.border}
  />
);

/* ── Barre de progression ─────────────────────────────────────── */
const StepBar = ({ current }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
    {STEPS.map((s, i) => {
      const done   = current > s.num;
      const active = current === s.num;
      return (
        <div key={s.num} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", fontSize: 13, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: done ? C.gold : active ? C.gold : C.bg2,
              color: done || active ? "#fff" : C.muted,
              border: `2px solid ${done || active ? C.gold : C.border}`,
              transition: "all .3s",
            }}>
              {done ? "✓" : s.num}
            </div>
            <span style={{ fontSize: 10, color: active ? C.goldD : C.muted, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 6px", marginBottom: 16,
              background: done ? C.gold : C.border, transition: "background .3s",
            }} />
          )}
        </div>
      );
    })}
  </div>
);

/* ── Étape 1 : Infos entreprise ───────────────────────────────── */
function Step1({ form, setForm, errors }) {
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-slug depuis le nom
  const handleNom = (v) => {
    const slug = v.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setForm(f => ({ ...f, nom: v, slug }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label="Nom de votre restaurant / entreprise *" error={errors.nom}>
        <TextInput value={form.nom} onChange={handleNom} placeholder="Ex : Le Clos des Saveurs" />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Email professionnel *" error={errors.email}>
          <TextInput type="email" value={form.email} onChange={v => upd("email", v)} placeholder="contact@monrestaurant.bj" />
        </Field>
        <Field label="Téléphone" error={errors.telephone}>
          <TextInput value={form.telephone} onChange={v => upd("telephone", v)} placeholder="+229 96 00 00 00" />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Ville" error={errors.ville}>
          <TextInput value={form.ville} onChange={v => upd("ville", v)} placeholder="Cotonou" />
        </Field>
        <Field label="Pays">
          <TextInput value={form.pays} onChange={v => upd("pays", v)} placeholder="Bénin" />
        </Field>
      </div>

      <Field label="Adresse">
        <TextInput value={form.adresse} onChange={v => upd("adresse", v)} placeholder="123 Rue de la Paix, Cotonou" />
      </Field>

      {/* Couleur & Logo */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
 
    {/* Couleur */}
    <Field label="Couleur principale de votre espace">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input
            type="color"
            value={form.couleur_primaire}
            onChange={e => upd("couleur_primaire", e.target.value)}
            style={{ width: 44, height: 40, border: "none", borderRadius: 8, cursor: "pointer", padding: 2 }}
        />
        <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>
            {form.couleur_primaire}
        </span>
        {/* Swatches rapides */}
        {["#C9A84C", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"].map(c => (
            <div
            key={c}
            onClick={() => upd("couleur_primaire", c)}
            style={{
                width: 22, height: 22, borderRadius: 6, background: c, cursor: "pointer",
                border: form.couleur_primaire === c ? `2px solid ${C.text}` : "2px solid transparent",
                transition: "border .15s",
            }}
            />
        ))}
        </div>
    </Field>
    
    {/* Upload logo */}
    <LogoUpload
        label="Logo de votre restaurant (optionnel)"
        value={form.logo_url}
        onChange={url => upd("logo_url", url)}
        size={80}
    />
    
    </div>

      {/* Aperçu couleur */}
      <div style={{
        padding: "12px 16px", borderRadius: 10, marginTop: 4,
        background: form.couleur_primaire + "15",
        border: `1px solid ${form.couleur_primaire}40`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, overflow: "hidden",
          background: form.couleur_primaire + "30",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {form.logo_url
            ? <img src={form.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => e.target.style.display = "none"} />
            : <span style={{ fontSize: 18 }}>🍽</span>}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: form.couleur_primaire }}>{form.nom || "Nom de votre restaurant"}</div>
          <div style={{ fontSize: 11, color: C.muted }}>Aperçu de votre espace</div>
        </div>
      </div>
    </div>
  );
}

/* ── Étape 2 : Compte administrateur ─────────────────────────── */
function Step2({ form, setForm, errors }) {
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        padding: "12px 16px", borderRadius: 10, marginBottom: 4,
        background: C.gold + "12", border: `1px solid ${C.gold}30`,
        fontSize: 12, color: C.goldD, lineHeight: 1.6,
      }}>
        🔑 Ce compte sera l'<strong>administrateur principal</strong> de votre restaurant.
        Il pourra créer des utilisateurs, gérer les menus, tables et consulter tous les rapports.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Prénom *" error={errors.admin_first_name}>
          <TextInput value={form.admin_first_name} onChange={v => upd("admin_first_name", v)} placeholder="Jean" />
        </Field>
        <Field label="Nom *" error={errors.admin_last_name}>
          <TextInput value={form.admin_last_name} onChange={v => upd("admin_last_name", v)} placeholder="DUPONT" />
        </Field>
      </div>

      <Field label="Email du compte admin" error={errors.admin_email}>
        <TextInput type="email" value={form.admin_email} onChange={v => upd("admin_email", v)} placeholder="admin@monrestaurant.bj" />
      </Field>

      <Field label="Identifiant de connexion *" error={errors.admin_login}>
        <TextInput value={form.admin_login} onChange={v => upd("admin_login", v.toLowerCase().replace(/\s+/g, ""))} placeholder="jean.dupont" />
      </Field>

      <Field label="Mot de passe *" error={errors.admin_password}>
        <TextInput type="password" value={form.admin_password} onChange={v => upd("admin_password", v)} placeholder="Min. 8 caractères" />
      </Field>

      <Field label="Confirmer le mot de passe *" error={errors.admin_password2}>
        <TextInput type="password" value={form.admin_password2} onChange={v => upd("admin_password2", v)} placeholder="Répétez le mot de passe" />
      </Field>

      {/* Force du mot de passe */}
      {form.admin_password && (
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            {[1, 2, 3, 4].map(i => {
              const strength = [
                form.admin_password.length >= 8,
                /[A-Z]/.test(form.admin_password),
                /[0-9]/.test(form.admin_password),
                /[^a-zA-Z0-9]/.test(form.admin_password),
              ].filter(Boolean).length;
              return (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i <= strength
                    ? strength <= 1 ? C.danger : strength <= 2 ? C.warning : C.success
                    : C.border,
                  transition: "background .3s",
                }} />
              );
            })}
          </div>
          <span style={{ fontSize: 10, color: C.muted }}>
            {(() => {
              const s = [
                form.admin_password.length >= 8,
                /[A-Z]/.test(form.admin_password),
                /[0-9]/.test(form.admin_password),
                /[^a-zA-Z0-9]/.test(form.admin_password),
              ].filter(Boolean).length;
              return s <= 1 ? "Faible" : s <= 2 ? "Moyen" : s <= 3 ? "Fort" : "Très fort";
            })()}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Étape 3 : Choix du plan ─────────────────────────────────── */
function Step3({ form, setForm, plans, loadingPlans }) {
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (loadingPlans) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={32} /></div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Essai gratuit toggle */}
      <div
        onClick={() => upd("essai_gratuit", !form.essai_gratuit)}
        style={{
          padding: "14px 18px", borderRadius: 12, cursor: "pointer",
          background: form.essai_gratuit ? C.gold + "15" : C.bg1,
          border: `2px solid ${form.essai_gratuit ? C.gold : C.border}`,
          display: "flex", alignItems: "center", gap: 14, transition: "all .2s",
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: form.essai_gratuit ? C.gold : "transparent",
          border: `2px solid ${form.essai_gratuit ? C.gold : C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all .2s",
        }}>
          {form.essai_gratuit && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>🎁 Démarrer avec l'essai gratuit 30 jours</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Sans carte bancaire — annulable à tout moment</div>
        </div>
      </div>

      {/* Plans */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {plans.map((plan, i) => {
          const colors = [C.info || "#3B82F6", C.gold, C.purple || "#8B5CF6"];
          const color = colors[i % colors.length];
          const selected = form.plan_id === plan.id;

          const features = [];
          if (plan.module_commandes) features.push("Commandes QR, tables, facturation");
          if (plan.module_stock) features.push("Gestion des stocks");
          if (plan.module_support) features.push("Support prioritaire 24h/24");

          return (
            <div
              key={plan.id}
              onClick={() => upd("plan_id", plan.id)}
              style={{
                padding: "16px 18px", borderRadius: 12, cursor: "pointer",
                border: `2px solid ${selected ? color : C.border}`,
                background: selected ? color + "10" : C.bg0,
                transition: "all .2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: `2px solid ${selected ? color : C.border}`,
                    background: selected ? color : "transparent",
                    flexShrink: 0, transition: "all .2s",
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{plan.nom}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color }}>
                  {Number(plan.prix_mensuel).toLocaleString("fr-FR")} FCFA<span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>/mois</span>
                </span>
              </div>
              <div style={{ paddingLeft: 28, display: "flex", flexDirection: "column", gap: 4 }}>
                {features.map((f, j) => (
                  <div key={j} style={{ fontSize: 12, color: C.textSub, display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color, fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {/* Option sans plan */}
        <div
          onClick={() => upd("plan_id", null)}
          style={{
            padding: "12px 18px", borderRadius: 12, cursor: "pointer",
            border: `2px solid ${form.plan_id === null ? C.border : C.border}`,
            background: form.plan_id === null ? C.bg1 : C.bg0,
            display: "flex", alignItems: "center", gap: 10, transition: "all .2s",
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: "50%",
            border: `2px solid ${form.plan_id === null ? C.goldD : C.border}`,
            background: form.plan_id === null ? C.goldD : "transparent",
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Choisir plus tard</div>
            <div style={{ fontSize: 11, color: C.muted }}>Je veux d'abord explorer la plateforme</div>
          </div>
        </div>
      </div>

      {/* Récap */}
      <div style={{
        padding: "14px 18px", borderRadius: 10,
        background: C.bg1, border: `1px solid ${C.border}`,
        fontSize: 12, color: C.textSub, lineHeight: 1.7,
      }}>
        <strong style={{ color: C.text }}>Récapitulatif :</strong><br />
        🏢 <strong>{form.nom}</strong><br />
        👤 Admin : {form.admin_first_name} {form.admin_last_name} ({form.admin_login})<br />
        📦 Plan : {plans.find(p => p.id === form.plan_id)?.nom || "Non sélectionné"}<br />
        🎁 Essai gratuit : {form.essai_gratuit ? "Oui (30 jours)" : "Non"}
      </div>
    </div>
  );
}

/* ── Étape 4 : Succès ────────────────────────────────────────── */
function Step4({ form, onGoToLogin }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
        background: C.gold + "20", border: `2px solid ${C.gold}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32,
      }}>🎉</div>
      <h3 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 10 }}>
        Bienvenue sur Oresto !
      </h3>
      <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7, marginBottom: 8 }}>
        Votre espace <strong style={{ color: C.goldD }}>{form.nom}</strong> est prêt.
      </p>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 32 }}>
        Connectez-vous avec l'identifiant <strong style={{ color: C.text, fontFamily: "monospace" }}>{form.admin_login}</strong>
      </p>
      {form.essai_gratuit && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: C.gold + "15", border: `1px solid ${C.gold}40`,
          borderRadius: 20, padding: "8px 16px", marginBottom: 28, fontSize: 12, color: C.goldD,
        }}>
          Votre essai gratuit de 30 jours a démarré aujourd'hui
        </div>
      )}
      <div>
        <Btn onClick={onGoToLogin} style={{ padding: "13px 40px", fontSize: 14 }}>
          Se connecter →
        </Btn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
export default function RegisterScreen({ onGoToLogin, onBack, toast }) {
  const [step, setStep]   = useState(1);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    // Étape 1
    nom: "", slug: "", email: "", telephone: "", adresse: "",
    ville: "", pays: "Bénin", couleur_primaire: "#C9A84C", logo_url: "",
    // Étape 2
    admin_first_name: "", admin_last_name: "", admin_email: "",
    admin_login: "", admin_password: "", admin_password2: "",
    // Étape 3
    plan_id: null, essai_gratuit: true,
  });

  useEffect(() => {
    fetch(`${API_BASE}/plans/`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  /* ── Validation par étape ─────────────────────────────────── */
  const validate = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.nom.trim())   errs.nom   = "Le nom est obligatoire";
      if (!form.email.trim()) errs.email = "L'email est obligatoire";
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email invalide";
    }
    if (s === 2) {
      if (!form.admin_first_name.trim()) errs.admin_first_name = "Requis";
      if (!form.admin_last_name.trim())  errs.admin_last_name  = "Requis";
      if (!form.admin_login.trim())      errs.admin_login      = "Requis";
      if (!form.admin_password)          errs.admin_password   = "Requis";
      else if (form.admin_password.length < 8) errs.admin_password = "8 caractères minimum";
      if (form.admin_password !== form.admin_password2)
        errs.admin_password2 = "Les mots de passe ne correspondent pas";
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validate(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        nom:              form.nom,
        slug:             form.slug,
        email:            form.email,
        telephone:        form.telephone,
        adresse:          form.adresse,
        ville:            form.ville,
        pays:             form.pays,
        couleur_primaire: form.couleur_primaire,
        logo_url:         form.logo_url,
        admin_first_name: form.admin_first_name,
        admin_last_name:  form.admin_last_name,
        admin_email:      form.admin_email || form.email,
        admin_login:      form.admin_login,
        admin_password:   form.admin_password,
        essai_gratuit:    form.essai_gratuit,
      };
      if (form.plan_id) payload.plan_id = form.plan_id;

      const res = await fetch(`${API_BASE}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.detail || data.email?.[0] || data.nom?.[0] || "Erreur lors de l'inscription";
        toast?.error("Erreur", msg);
        return;
      }

      setStep(4); // Succès
    } catch (e) {
      toast?.error("Erreur", "Impossible de contacter le serveur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg1,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, position: "relative", overflow: "hidden",
    }}>
      {/* Déco */}
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.gold}10 0%, transparent 70%)`,
        top: -150, right: -100, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.gold}08 0%, transparent 70%)`,
        bottom: -80, left: -80, pointerEvents: "none",
      }} />

      <div className="anim-fadeUp" style={{ width: "100%", maxWidth: 520, position: "relative" }}>

        {/* Retour */}
        {onBack && step < 4 && (
          <button onClick={step === 1 ? onBack : () => setStep(s => s - 1)} style={{
            background: "none", border: "none", color: C.muted,
            fontSize: 13, cursor: "pointer", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            ← {step === 1 ? "Retour à l'accueil" : "Étape précédente"}
          </button>
        )}

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <OrestoLogo size={44} withText />
          </div>
          {step < 4 && (
            <p style={{ fontSize: 13, color: C.muted }}>
              Créez votre espace restaurant en quelques minutes
            </p>
          )}
        </div>

        {/* Card */}
        <div style={{
          background: C.bg0, borderRadius: 16,
          border: `1px solid ${C.border}`,
          padding: 32, boxShadow: C.shadowMd,
        }}>
          {step < 4 && <StepBar current={step} />}

          {step < 4 && (
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 24 }}>
              {step === 1 && "Votre entreprise"}
              {step === 2 && "Compte administrateur"}
              {step === 3 && "Choisissez votre plan"}
            </h2>
          )}

          {step === 1 && <Step1 form={form} setForm={setForm} errors={errors} />}
          {step === 2 && <Step2 form={form} setForm={setForm} errors={errors} />}
          {step === 3 && <Step3 form={form} setForm={setForm} plans={plans} loadingPlans={loadingPlans} />}
          {step === 4 && <Step4 form={form} onGoToLogin={onGoToLogin} />}

          {/* Boutons navigation */}
          {step < 4 && (
            <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
              {step < 3 && (
                <Btn onClick={handleNext} style={{ padding: "11px 28px" }}>
                  Continuer →
                </Btn>
              )}
              {step === 3 && (
                <Btn onClick={handleSubmit} loading={submitting} style={{ padding: "11px 28px" }}>
                  {submitting ? "Création en cours…" : "Créer mon espace →"}
                </Btn>
              )}
            </div>
          )}
        </div>

        {/* Lien login */}
        {step < 4 && (
          <p style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: 20 }}>
            Déjà un compte ?{" "}
            <button onClick={onGoToLogin} style={{ background: "none", border: "none", color: C.goldD, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
              Se connecter
            </button>
          </p>
        )}
      </div>
    </div>
  );
}