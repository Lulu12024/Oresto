import { C } from "../styles/tokens";

export default function Header({ title, subtitle, onMenuToggle, restaurant }) {
  return (
    <div style={{
      height: 60,
      background: C.bg0,
      borderBottom: `1px solid ${C.border}`,
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 16,
      flexShrink: 0,
    }}>
      {/* Mobile menu toggle */}
      <button onClick={onMenuToggle} style={{
        display: "none",
        background: "none", border: "none",
        fontSize: 20, cursor: "pointer", color: C.textSub,
        "@media (max-width:768px)": { display: "flex" },
      }}>☰</button>

      {/* Titres */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2, letterSpacing: .3 }}>{subtitle}</div>
        )}
      </div>

      {/* Restaurant info */}
      {restaurant && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px",
          background: C.goldBg,
          border: `1px solid ${C.goldBorder}`,
          borderRadius: 20,
          flexShrink: 0,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: restaurant.statut === 'actif' ? C.success : C.danger }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.goldD }}>
            {restaurant.nom}
          </span>
        </div>
      )}
    </div>
  );
}
