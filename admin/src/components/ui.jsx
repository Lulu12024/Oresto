import { useState } from "react";
import { C } from "../styles/tokens";

/* ── Logo Oresto Admin ── */
export const AdminLogo = ({ size = 36, withText = true }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" fill={C.gold} opacity="0.12"/>
      <circle cx="24" cy="24" r="20" stroke={C.gold} strokeWidth="2" fill="none"/>
      <path d="M12 28 Q24 12 36 28" stroke={C.gold} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <line x1="16" y1="33" x2="32" y2="33" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="24" cy="8" r="2" fill={C.gold}/>
      <circle cx="38" cy="16" r="1.5" fill={C.gold} opacity="0.7"/>
      <circle cx="10" cy="16" r="1.5" fill={C.gold} opacity="0.7"/>
    </svg>
    {withText && (
      <div>
        <div className="serif" style={{ fontSize: size * 0.44, fontWeight: 700, color: C.goldD, letterSpacing: 2, lineHeight: 1 }}>
          ORESTO
        </div>
        <div style={{ fontSize: size * 0.19, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>
          Administration
        </div>
      </div>
    )}
  </div>
);

/* ── Button ── */
export const Btn = ({ children, variant = "primary", onClick, style: s = {}, disabled = false, small = false, loading = false }) => {
  const base = {
    primary: { background: `linear-gradient(135deg,${C.gold},${C.goldD})`, color: "#fff", border: "none", fontWeight: 700, boxShadow: C.shadowGold },
    outline: { background: "transparent", color: C.goldD, border: `1.5px solid ${C.gold}` },
    ghost:   { background: "transparent", color: C.textSub, border: `1px solid ${C.border}` },
    danger:  { background: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBdr}` },
    success: { background: C.successBg, color: C.success, border: `1px solid ${C.successBdr}` },
    info:    { background: C.infoBg, color: C.info, border: `1px solid ${C.infoBdr}` },
    dark:    { background: C.text, color: "#fff", border: "none", fontWeight: 600 },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className="hover-lift"
      style={{
        ...base[variant],
        padding: small ? "5px 13px" : "9px 20px",
        borderRadius: 8, fontSize: small ? 11 : 13,
        fontFamily: "'Inter',sans-serif",
        opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        whiteSpace: "nowrap", transition: "all .2s", ...s,
      }}>
      {loading
        ? <span className="spin" style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block" }} />
        : children}
    </button>
  );
};

/* ── Card ── */
export const Card = ({ children, style: s = {} }) => (
  <div className="card" style={{ padding: 20, ...s }}>{children}</div>
);

/* ── Input ── */
export const Input = ({ label, value, onChange, type = "text", placeholder, required, style: s = {}, error, disabled }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && (
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, letterSpacing: .4 }}>
        {label}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
      </label>
    )}
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
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

/* ── Select ── */
export const Select = ({ label, value, onChange, options = [], required, style: s = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && (
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, letterSpacing: .4 }}>
        {label}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
      </label>
    )}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        padding: "10px 13px",
        background: C.bg1, border: `1.5px solid ${C.border}`,
        borderRadius: 8, color: C.text, fontSize: 13,
        cursor: "pointer", ...s,
      }}>
      <option value="">— Choisir —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

/* ── Badge ── */
export const Badge = ({ children, color = C.gold, style: s = {} }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 600, color,
    background: `${color}14`, border: `1px solid ${color}30`,
    letterSpacing: .3, whiteSpace: "nowrap", ...s,
  }}>{children}</span>
);

/* ── Spinner ── */
export const Spinner = ({ size = 24, color = C.gold }) => (
  <span className="spin" style={{
    display: "inline-block", width: size, height: size,
    border: `2.5px solid ${color}28`, borderTopColor: color, borderRadius: "50%",
  }} />
);

/* ── Stat Card ── */
export const StatCard = ({ label, value, icon, color = C.gold, delta }) => (
  <div className="card hover-lift" style={{ padding: "20px 24px", cursor: "default" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: .8 }}>{label}</div>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
    </div>
    <div style={{ fontSize: "1.9rem", fontWeight: 700, color: C.text, letterSpacing: -1 }}>{value}</div>
    {delta !== undefined && (
      <div style={{ fontSize: 11, color: delta >= 0 ? C.success : C.danger, marginTop: 6, fontWeight: 600 }}>
        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% ce mois
      </div>
    )}
  </div>
);

/* ── Modal ── */
export const Modal = ({ open, onClose, title, children, width = 560 }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.28)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(3px)",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="anim-scaleIn card" style={{ width, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.muted, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ── Toast ── */
export const ToastContainer = ({ toasts, removeToast }) => (
  <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
    {toasts.map(t => (
      <div key={t.id} className="anim-scaleIn" onClick={() => removeToast(t.id)} style={{
        background: C.bg0, border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${t.type === "error" ? C.danger : t.type === "success" ? C.success : C.gold}`,
        borderRadius: 10, padding: "12px 16px", minWidth: 280, maxWidth: 360,
        boxShadow: C.shadowMd, cursor: "pointer",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.title}</div>
        {t.message && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{t.message}</div>}
      </div>
    ))}
  </div>
);

/* ── Table ── */
export const Table = ({ columns, rows, emptyLabel = "Aucune donnée" }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: `2px solid ${C.border}` }}>
          {columns.map((col, i) => (
            <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: .8, whiteSpace: "nowrap" }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={columns.length} style={{ padding: "32px", textAlign: "center", color: C.mutedL, fontSize: 13 }}>{emptyLabel}</td></tr>
        ) : rows.map((row, ri) => (
          <tr key={ri} className="hover-bg" style={{ borderBottom: `1px solid ${C.border}` }}>
            {columns.map((col, ci) => (
              <td key={ci} style={{ padding: "12px 14px", fontSize: 13, color: C.text, verticalAlign: "middle" }}>
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
