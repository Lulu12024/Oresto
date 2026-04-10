/**
 * ORESTO ADMIN — Design Tokens
 * Interface d'administration de la plateforme
 * Palette : Or · Blanc · Gris (identique au front)
 */

export const C = {
  bg0:  "#FFFFFF",
  bg1:  "#F8F7F5",
  bg2:  "#F2F0EC",
  bg3:  "#E8E5DF",
  bg4:  "#D6D2C8",
  bg5:  "#C4BFB3",

  gold:      "#C9A84C",
  goldL:     "#D4B86A",
  goldD:     "#A07830",
  goldXL:    "#E8D090",
  goldFaint: "rgba(201,168,76,0.07)",
  goldBorder:"rgba(201,168,76,0.28)",
  goldBg:    "rgba(201,168,76,0.09)",

  text:    "#1A1714",
  textSub: "#4A4640",
  muted:   "#7A7268",
  mutedL:  "#A09888",
  mutedD:  "#5A5248",

  success:    "#2E8B57",
  successBg:  "rgba(46,139,87,0.09)",
  successBdr: "rgba(46,139,87,0.22)",

  danger:    "#C0392B",
  dangerBg:  "rgba(192,57,43,0.09)",
  dangerBdr: "rgba(192,57,43,0.22)",

  warning:    "#C47A1E",
  warningBg:  "rgba(196,122,30,0.09)",
  warningBdr: "rgba(196,122,30,0.22)",

  info:    "#2471A3",
  infoBg:  "rgba(36,113,163,0.09)",
  infoBdr: "rgba(36,113,163,0.22)",

  border:     "rgba(0,0,0,0.08)",
  borderHover:"rgba(201,168,76,0.35)",
  shadow:     "0 2px 12px rgba(0,0,0,0.07)",
  shadowMd:   "0 4px 24px rgba(0,0,0,0.09)",
  shadowLg:   "0 8px 40px rgba(0,0,0,0.11)",
  shadowGold: "0 4px 20px rgba(201,168,76,0.18)",
};

export function injectGlobalCSS() {
  if (document.getElementById("oresto-admin-css")) return;
  const s = document.createElement("style");
  s.id = "oresto-admin-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; -webkit-font-smoothing: antialiased; }
    body { font-family: 'Inter', sans-serif; background: ${C.bg1}; color: ${C.text}; line-height: 1.55; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: ${C.bg2}; }
    ::-webkit-scrollbar-thumb { background: ${C.bg4}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${C.gold}; }
    input, textarea, select, button { font-family: 'Inter', sans-serif; outline: none; }
    button { cursor: pointer; }
    a { color: ${C.gold}; text-decoration: none; }
    @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes scaleIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    .anim-fadeUp  { animation: fadeUp  .4s cubic-bezier(.2,.8,.2,1) both; }
    .anim-fadeIn  { animation: fadeIn  .3s ease both; }
    .anim-scaleIn { animation: scaleIn .3s cubic-bezier(.2,.8,.2,1) both; }
    .spin         { animation: spin .7s linear infinite; }
    .hover-lift   { transition: transform .2s, box-shadow .2s; }
    .hover-lift:hover { transform: translateY(-2px); box-shadow: ${C.shadowMd} !important; }
    .hover-bg     { transition: background .15s; }
    .hover-bg:hover { background: ${C.bg2} !important; }
    .truncate     { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .serif        { font-family: 'Playfair Display', serif; }
    .card         { background: ${C.bg0}; border: 1px solid ${C.border}; border-radius: 12px; box-shadow: ${C.shadow}; }
  `;
  document.head.appendChild(s);
}
