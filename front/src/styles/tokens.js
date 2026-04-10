/**
 * ORESTO — Design Tokens
 * Palette : Or · Blanc · Gris + exports de compatibilité pour tous les écrans
 */

export const C = {
  /* ── Backgrounds (clairs) ── */
  bg0:  "#FFFFFF",
  bg1:  "#F8F7F5",
  bg2:  "#F2F0EC",
  bg3:  "#E8E5DF",
  bg4:  "#D6D2C8",
  bg5:  "#C4BFB3",

  /* ── Brand gold ── */
  gold:      "#C9A84C",
  goldL:     "#D4B86A",
  goldD:     "#A07830",
  goldXL:    "#E8D090",
  goldFaint: "rgba(201,168,76,0.08)",
  goldBorder:"rgba(201,168,76,0.30)",
  goldBg:    "rgba(201,168,76,0.10)",

  /* ── Text ── */
  text:    "#1A1714",
  textSub: "#4A4640",
  muted:   "#7A7268",
  mutedL:  "#A09888",
  mutedD:  "#5A5248",

  /* ── Alias rétrocompatibilité (anciens écrans utilisent C.cream) ── */
  cream:   "#1A1714",   // remplacé par text dans le nouveau thème

  /* ── Semantic ── */
  success:    "#2E8B57",
  successBg:  "rgba(46,139,87,0.10)",
  successBdr: "rgba(46,139,87,0.25)",

  danger:    "#C0392B",
  dangerBg:  "rgba(192,57,43,0.10)",
  dangerBdr: "rgba(192,57,43,0.25)",

  warning:    "#C47A1E",
  warningBg:  "rgba(196,122,30,0.10)",
  warningBdr: "rgba(196,122,30,0.25)",

  info:    "#2471A3",
  infoBg:  "rgba(36,113,163,0.10)",
  infoBdr: "rgba(36,113,163,0.25)",

  purple:    "#7D3C98",
  purpleBg:  "rgba(125,60,152,0.10)",
  purpleBdr: "rgba(125,60,152,0.25)",

  /* ── Borders & shadows ── */
  border:      "rgba(0,0,0,0.09)",
  borderHover: "rgba(201,168,76,0.40)",
  shadow:      "0 2px 12px rgba(0,0,0,0.08)",
  shadowMd:    "0 4px 24px rgba(0,0,0,0.10)",
  shadowLg:    "0 8px 40px rgba(0,0,0,0.12)",
  shadowGold:  "0 4px 20px rgba(201,168,76,0.20)",
};

export const ROLE_COLORS = {
  serveur:      C.info,
  cuisinier:    C.warning,
  gerant:       C.gold,
  gestionnaire: C.success,
  manager:      C.purple,
  auditeur:     C.mutedL,
  admin:        C.danger,
};

export const TABLE_STATUS = {
  DISPONIBLE:          { label:"Disponible",         color:C.success,  bg:C.successBg  },
  RÉSERVÉE:            { label:"Réservée",            color:C.gold,     bg:C.goldBg     },
  COMMANDES_PASSÉE:    { label:"Commandes passées",   color:C.info,     bg:C.infoBg     },
  EN_SERVICE:          { label:"En service",          color:C.warning,  bg:C.warningBg  },
  EN_ATTENTE_PAIEMENT: { label:"Attente paiement",    color:C.purple,   bg:C.purpleBg   },
  PAYÉE:               { label:"Payée",               color:C.mutedL,   bg:C.bg3        },
};

export const ORDER_STATUS = {
  STOCKÉE:               { label:"Stockée",           color:C.mutedL   },
  EN_ATTENTE_ACCEPTATION:{ label:"En attente",         color:C.warning  },
  EN_PRÉPARATION:        { label:"En préparation",     color:C.info     },
  EN_ATTENTE_LIVRAISON:  { label:"Prête à servir",     color:C.success  },
  EN_ATTENTE_PAIEMENT:   { label:"Attente paiement",   color:C.purple   },
  PAYÉE:                 { label:"Payée",              color:C.mutedL   },
  ANNULÉE:               { label:"Annulée",            color:C.danger   },
  REFUSÉE:               { label:"Refusée",            color:C.danger   },
};

/* ── Mouvements stock ──────────────────────────────────────── */
export const MVT_TYPE_META = {
  ENTRÉE:      { label:"Entrée",      color:C.success, icon:"📥" },
  SORTIE:      { label:"Sortie",      color:C.warning, icon:"📤" },
  SUPPRESSION: { label:"Suppression", color:C.danger,  icon:"🗑️" },
};

export const MVT_STATUS_META = {
  EN_ATTENTE: { label:"En attente", color:C.warning },
  VALIDÉE:    { label:"Validée",    color:C.success },
  REJETÉE:    { label:"Rejetée",    color:C.danger  },
};

/* ── Helpers ───────────────────────────────────────────────── */
export const fmt = (n) =>
  (n ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " FCFA";

export const now = () => new Date().toISOString();

export const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
};

/* ── Global CSS ────────────────────────────────────────────── */
export function injectGlobalCSS() {
  if (document.getElementById("oresto-global-css")) return;

  const style = document.createElement("style");
  style.id = "oresto-global-css";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; -webkit-font-smoothing: antialiased; }
    body {
      font-family: 'Inter', sans-serif;
      background: ${C.bg1};
      color: ${C.text};
      line-height: 1.55;
    }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: ${C.bg2}; }
    ::-webkit-scrollbar-thumb { background: ${C.bg4}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${C.gold}; }
    input, textarea, select, button { font-family: 'Inter', sans-serif; outline: none; }
    button { cursor: pointer; }
    a { color: ${C.gold}; text-decoration: none; }

    @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes slideIn  { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
    @keyframes scaleIn  { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    @keyframes pulse2   { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes toastIn  { from{transform:translateX(130%);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes goldGlow { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)} 50%{box-shadow:0 0 16px 4px rgba(201,168,76,0.15)} }

    .anim-fadeUp   { animation: fadeUp  .45s cubic-bezier(.2,.8,.2,1) both; }
    .anim-fadeIn   { animation: fadeIn  .35s ease both; }
    .anim-slideIn  { animation: slideIn .4s  cubic-bezier(.2,.8,.2,1) both; }
    .anim-scaleIn  { animation: scaleIn .3s  cubic-bezier(.2,.8,.2,1) both; }
    .pulse         { animation: pulse2 2s ease infinite; }
    .spin          { animation: spin .7s linear infinite; }

    .hover-lift    { transition: transform .2s, box-shadow .2s, border-color .2s; }
    .hover-lift:hover { transform: translateY(-2px); box-shadow: ${C.shadowMd} !important; }
    .hover-gold    { transition: color .18s, background .18s; }
    .hover-gold:hover { color: ${C.goldD} !important; }
    .hover-bg      { transition: background .18s; }
    .hover-bg:hover { background: ${C.bg2} !important; }
    .hover-border  { transition: border-color .18s; }
    .hover-border:hover { border-color: ${C.goldBorder} !important; }

    .text-gold   { color: ${C.gold}; }
    .text-goldD  { color: ${C.goldD}; }
    .text-muted  { color: ${C.muted}; }
    .text-text   { color: ${C.text}; }
    .serif       { font-family: 'Playfair Display', serif; }
    .uppercase   { text-transform: uppercase; letter-spacing: 1.5px; }
    .truncate    { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .flex-center { display: flex; align-items: center; justify-content: center; }

    .card {
      background: ${C.bg0};
      border: 1px solid ${C.border};
      border-radius: 12px;
      box-shadow: ${C.shadow};
    }
  `;
  document.head.appendChild(style);
}