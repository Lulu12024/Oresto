import { useState } from "react";
import { C } from "../styles/tokens";
import { OrestoLogo, Card, Input, Btn } from "../components/ui";
import { authService } from "../api/auth";

export default function LoginScreen({ onLogin, toast, onBack }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!login || !password) return;
    setLoading(true);
    setError("");
    try {
      const user = await authService.login(login, password);
      toast?.success("Bienvenue !", user.firstName || user.login);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: 20,
    }}>
      {/* Déco background */}
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.gold}12 0%, transparent 70%)`,
        top: -100, right: -100, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 350, height: 350, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.gold}08 0%, transparent 70%)`,
        bottom: -50, left: -50, pointerEvents: "none",
      }} />

      <div className="anim-fadeUp" style={{ width: "100%", maxWidth: 420, position: "relative" }}>

        {/* Back to landing */}
        {onBack && (
          <button onClick={onBack} style={{
            background: "none", border: "none", color: C.muted,
            fontSize: 13, cursor: "pointer", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 6,
            transition: "color .2s",
          }}
            onMouseEnter={e => e.target.style.color = C.gold}
            onMouseLeave={e => e.target.style.color = C.muted}
          >
            ← Retour à l'accueil
          </button>
        )}

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <OrestoLogo size={56} withText />
          </div>
          <p style={{ fontSize: 13, color: C.muted, letterSpacing: .5 }}>
            Connectez-vous à votre espace restaurant
          </p>
        </div>

        {/* Formulaire */}
        <div style={{
          background: C.bg0,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 32,
          boxShadow: C.shadowMd,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Input
              label="Identifiant"
              value={login}
              onChange={setLogin}
              placeholder="votre.identifiant"
              required
              onKeyDown={handleKey}
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
              style={{ letterSpacing: 2 }}
              onKeyDown={handleKey}
            />

            {error && (
              <div style={{
                background: C.dangerBg,
                border: `1px solid ${C.dangerBdr}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 12,
                color: C.danger,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                ⚠ {error}
              </div>
            )}

            <Btn
              onClick={handleSubmit}
              loading={loading}
              disabled={!login || !password}
              style={{ width: "100%", justifyContent: "center", padding: "13px 20px", fontSize: 14 }}
            >
              Se connecter
            </Btn>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: C.mutedL, marginTop: 24, letterSpacing: .5 }}>
          Oresto · v2.0 · 2026 © Tous droits réservés
        </p>
      </div>
    </div>
  );
}
