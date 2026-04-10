import { useState } from "react";
import { C } from "../styles/tokens";

/* ══════════════════════════════════════
   LOGO ORESTO — SVG dynamique
   ══════════════════════════════════════ */
export const OrestoLogo = ({ size = 40, withText = true, dark = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" fill={C.gold} opacity="0.15"/>
      <circle cx="24" cy="24" r="20" stroke={C.gold} strokeWidth="2" fill="none"/>
      <path d="M12 28 Q24 12 36 28" stroke={C.gold} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <line x1="16" y1="33" x2="32" y2="33" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="24" cy="8" r="2" fill={C.gold}/>
      <circle cx="38" cy="16" r="1.5" fill={C.gold} opacity="0.7"/>
      <circle cx="10" cy="16" r="1.5" fill={C.gold} opacity="0.7"/>
      <line x1="24" y1="10" x2="26" y2="14" stroke={C.gold} strokeWidth="1" opacity="0.5"/>
      <line x1="37" y1="18" x2="34" y2="21" stroke={C.gold} strokeWidth="1" opacity="0.5"/>
      <line x1="11" y1="18" x2="14" y2="21" stroke={C.gold} strokeWidth="1" opacity="0.5"/>
    </svg>
    {withText && (
      <div>
        <div className="serif" style={{
          fontSize: size * 0.5, fontWeight: 700,
          color: dark ? C.text : C.goldD,
          letterSpacing: 3, lineHeight: 1,
        }}>ORESTO</div>
        <div style={{
          fontSize: size * 0.2, color: C.muted,
          letterSpacing: 2.5, textTransform: "uppercase", marginTop: 2,
        }}>Restaurant Connecté</div>
      </div>
    )}
  </div>
);

/* ══════════════════════════════════════
   BADGE
   ══════════════════════════════════════ */
export const Badge = ({ children, color = C.gold, style: s = {} }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 600, color,
    background: `${color}15`, border: `1px solid ${color}35`,
    letterSpacing: .4, whiteSpace: "nowrap", ...s,
  }}>{children}</span>
);

/* ══════════════════════════════════════
   DOT
   ══════════════════════════════════════ */
export const Dot = ({ color, size = 7 }) => (
  <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />
);

/* ══════════════════════════════════════
   BTN
   ══════════════════════════════════════ */
export const Btn = ({ children, variant = "primary", onClick, style: s = {}, disabled = false, small = false, loading = false }) => {
  const base = {
    primary: { background: `linear-gradient(135deg,${C.gold},${C.goldD})`, color: "#fff", border: "none", fontWeight: 700, boxShadow: C.shadowGold },
    outline: { background: "transparent", color: C.goldD, border: `1.5px solid ${C.gold}` },
    ghost:   { background: "transparent", color: C.textSub, border: `1px solid ${C.border}` },
    danger:  { background: C.dangerBg,  color: C.danger,  border: `1px solid ${C.dangerBdr}` },
    success: { background: C.successBg, color: C.success, border: `1px solid ${C.successBdr}` },
    info:    { background: C.infoBg,    color: C.info,    border: `1px solid ${C.infoBdr}` },
    purple:  { background: C.purpleBg,  color: C.purple,  border: `1px solid ${C.purpleBdr}` },
    warning: { background: C.warningBg, color: C.warning, border: `1px solid ${C.warningBdr}` },
    dark:    { background: C.text,      color: "#fff",    border: "none", fontWeight: 600 },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className="hover-lift"
      style={{
        ...base[variant],
        padding: small ? "5px 13px" : "9px 20px",
        borderRadius: 8, fontSize: small ? 11 : 13,
        fontFamily: "'Inter',sans-serif", transition: "all .2s",
        opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        whiteSpace: "nowrap", ...s,
      }}>
      {loading
        ? <span className="spin" style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block" }} />
        : children}
    </button>
  );
};

/* ══════════════════════════════════════
   CARD
   ══════════════════════════════════════ */
export const Card = ({ children, style: s = {}, hover = false, className = "" }) => (
  <div className={`card${hover ? " hover-lift" : ""}${className ? " " + className : ""}`} style={{ padding: 20, ...s }}>
    {children}
  </div>
);

/* ══════════════════════════════════════
   INPUT
   ══════════════════════════════════════ */
export const Input = ({ label, value, onChange, type = "text", placeholder, required, style: s = {}, error, disabled, onKeyDown }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && (
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, letterSpacing: .5 }}>
        {label}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
      </label>
    )}
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      onKeyDown={onKeyDown}
      style={{
        padding: "10px 13px",
        background: disabled ? C.bg2 : C.bg1,
        border: `1.5px solid ${error ? C.dangerBdr : C.border}`,
        borderRadius: 8, color: C.text, fontSize: 13,
        transition: "border-color .2s", ...s,
      }}
      onFocus={e => e.target.style.borderColor = C.gold}
      onBlur={e => e.target.style.borderColor = error ? C.dangerBdr : C.border}
    />
    {error && <span style={{ fontSize: 11, color: C.danger }}>{error}</span>}
  </div>
);

/* ══════════════════════════════════════
   SELECT  ← manquait
   ══════════════════════════════════════ */
export const Select = ({ label, value, onChange, options = [], required, style: s = {}, disabled }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && (
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, letterSpacing: .5 }}>
        {label}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
      </label>
    )}
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      style={{
        padding: "10px 13px",
        background: disabled ? C.bg2 : C.bg1,
        border: `1.5px solid ${C.border}`,
        borderRadius: 8, color: C.text, fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Inter',sans-serif",
        transition: "border-color .2s", ...s,
      }}
      onFocus={e => e.target.style.borderColor = C.gold}
      onBlur={e => e.target.style.borderColor = C.border}
    >
      {options.map((o, i) => (
        <option key={i} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  </div>
);

/* ══════════════════════════════════════
   MODAL  ← manquait
   ══════════════════════════════════════ */
export const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.25)",
        zIndex: 1000, display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: 20, backdropFilter: "blur(3px)",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="anim-scaleIn card" style={{ width, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 22,
            cursor: "pointer", color: C.muted, lineHeight: 1, padding: "2px 6px",
            borderRadius: 6, transition: "background .15s",
          }}
            onMouseEnter={e => e.target.style.background = C.bg2}
            onMouseLeave={e => e.target.style.background = "none"}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   STAT CARD  ← manquait
   ══════════════════════════════════════ */
export const StatCard = ({ label, value, icon, color = C.gold, delta, sub }) => (
  <div className="card hover-lift" style={{ padding: "20px 22px", cursor: "default" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: .8 }}>{label}</div>
      {icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>{icon}</div>
      )}
    </div>
    <div style={{ fontSize: "1.85rem", fontWeight: 700, color: C.text, letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{sub}</div>}
    {delta !== undefined && (
      <div style={{ fontSize: 11, color: delta >= 0 ? C.success : C.danger, marginTop: 6, fontWeight: 600 }}>
        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs mois dernier
      </div>
    )}
  </div>
);

/* ══════════════════════════════════════
   EMPTY STATE  ← manquait
   ══════════════════════════════════════ */
export const Empty = ({ icon = "📭", text = "Aucune donnée", sub, style: s = {} }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "48px 24px", gap: 12, ...s,
  }}>
    <div style={{ fontSize: 40, opacity: .6 }}>{icon}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>{text}</div>
    {sub && <div style={{ fontSize: 12, color: C.mutedL, textAlign: "center", maxWidth: 280 }}>{sub}</div>}
  </div>
);

/* ══════════════════════════════════════
   SPINNER
   ══════════════════════════════════════ */
export const Spinner = ({ size = 24, color = C.gold }) => (
  <span className="spin" style={{
    display: "inline-block", width: size, height: size,
    border: `2.5px solid ${color}30`, borderTopColor: color, borderRadius: "50%",
  }} />
);

/* ══════════════════════════════════════
   TOAST CONTAINER
   ══════════════════════════════════════ */
export const ToastContainer = ({ toasts, removeToast }) => (
  <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
    {toasts.map(t => (
      <div key={t.id} className="anim-scaleIn" onClick={() => removeToast(t.id)} style={{
        background: C.bg0, border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${t.type === "error" ? C.danger : t.type === "success" ? C.success : C.gold}`,
        borderRadius: 10, padding: "12px 16px", minWidth: 280, maxWidth: 360,
        boxShadow: C.shadowMd, cursor: "pointer",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.title || "Oresto"}</div>
        {t.message && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{t.message}</div>}
      </div>
    ))}
  </div>
);

/* ══════════════════════════════════════
   OFFLINE BANNER
   ══════════════════════════════════════ */
export const OfflineBanner = ({ isOnline }) => {
  // if (isOnline) return null;
  // return (
  //   <div style={{
  //     background: C.warningBg, borderBottom: `1px solid ${C.warningBdr}`,
  //     padding: "8px 20px", fontSize: 12, color: C.warning, textAlign: "center", fontWeight: 500,
  //   }}>
  //     ⚠ Mode hors-ligne — Les données affichées peuvent ne pas être à jour
  //   </div>
  // );
};

/* ══════════════════════════════════════
   DIVIDER
   ══════════════════════════════════════ */
export const Divider = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0" }}>
    <div style={{ flex: 1, height: 1, background: C.border }} />
    {label && <span style={{ fontSize: 11, color: C.mutedL, whiteSpace: "nowrap", letterSpacing: 1 }}>{label}</span>}
    <div style={{ flex: 1, height: 1, background: C.border }} />
  </div>
);

export default OrestoLogo;