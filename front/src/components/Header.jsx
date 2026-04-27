
export default function Header({ title, subtitle, onMenuToggle, restaurant }) {
  const couleur = restaurant?.couleur_primaire || "#C9A84C";
 
  return (
    <div style={{
      height: 60,
      background: "#fff",
      borderBottom: `1px solid #eee`,
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 16,
      flexShrink: 0,
    }}>
      {/* Mobile menu toggle */}
      <button onClick={onMenuToggle} style={{
        background: "none", border: "none",
        fontSize: 20, cursor: "pointer", color: "#888",
      }}>☰</button>
 
      {/* Titres */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: "#999", marginTop: 2, letterSpacing: .3 }}>{subtitle}</div>
        )}
      </div>
 
      {/* Branding restaurant */}
      {restaurant && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "6px 14px",
          background: couleur + "15",
          border: `1.5px solid ${couleur}40`,
          borderRadius: 24,
          flexShrink: 0,
        }}>
          {/* Logo ou initiale */}
          <div style={{
            width: 28, height: 28, borderRadius: 8, overflow: "hidden",
            background: couleur + "25",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.nom}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={e => { e.target.style.display = "none"; }}
              />
            ) : (
              <span style={{ fontSize: 14, fontWeight: 700, color: couleur }}>
                {restaurant.nom?.charAt(0)?.toUpperCase() || "R"}
              </span>
            )}
          </div>
 
          {/* Nom + statut */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: couleur, lineHeight: 1.1 }}>
              {restaurant.nom}
            </div>
            {restaurant.statut && (
              <div style={{ fontSize: 9, color: restaurant.statut === "actif" ? "#22C55E" : "#EF4444", letterSpacing: .5 }}>
                {restaurant.statut === "actif" ? "● Actif" : "● Suspendu"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}