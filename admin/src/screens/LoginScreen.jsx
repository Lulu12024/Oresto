import { useState } from "react";
import { C } from "../styles/tokens";
import { AdminLogo, Btn, Input } from "../components/ui";
import { authApi, setToken } from "../api/client";

export default function LoginScreen({ onLogin }) {
  const [login, setLogin]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async () => {
    if (!login || !password) return;
    setLoading(true); setError("");
    try {
      const data = await authApi.login(login, password);
      if (!data.user?.is_super_admin) {
        setError("Accès refusé — réservé aux super administrateurs Oresto");
        return;
      }
      setToken(data.token, data.user);
      onLogin(data.user);
    } catch (e) {
      setError(e.message || "Identifiants incorrects");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: `linear-gradient(135deg, ${C.bg1} 0%, ${C.bg0} 60%, ${C.goldFaint} 100%)`,
    }}>
      {/* Panneau gauche — branding */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", padding: 60, background: C.text,
        minHeight: "100vh",
      }}>
        <AdminLogo size={56} withText />
        <div style={{ marginTop: 40, maxWidth: 360, textAlign: "center" }}>
          <h2 className="serif" style={{ fontSize: "1.8rem", color: C.gold, fontWeight: 700, marginBottom: 16 }}>
            Console d'administration
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            Gérez les restaurants abonnés, les plans tarifaires et les
            abonnements de la plateforme Oresto.
          </p>
        </div>
        <div style={{ marginTop: 60, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, width: "100%", maxWidth: 340 }}>
          {[
            { val: "Restaurants", ico: "🍽" },
            { val: "Abonnements", ico: "💳" },
            { val: "Plans", ico: "📋" },
            { val: "Statistiques", ico: "📊" },
          ].map((f, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "16px 14px", textAlign: "center",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.ico}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{f.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div style={{
        width: 460, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "60px 48px",
        background: C.bg0, boxShadow: "-8px 0 40px rgba(0,0,0,0.08)",
      }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Connexion</h1>
          <p style={{ fontSize: 13, color: C.muted }}>Accès réservé aux super administrateurs</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Input label="Identifiant" value={login} onChange={setLogin} placeholder="admin.oresto" required />
          <Input label="Mot de passe" type="password" value={password} onChange={setPassword}
            placeholder="••••••••" required style={{ letterSpacing: 2 }} />

          {error && (
            <div style={{
              background: C.dangerBg, border: `1px solid ${C.dangerBdr}`,
              borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.danger,
            }}>⚠ {error}</div>
          )}

          <Btn onClick={handleSubmit} loading={loading} disabled={!login || !password}
            style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: 14, marginTop: 4 }}>
            Se connecter
          </Btn>
        </div>

        <p style={{ marginTop: 40, fontSize: 11, color: C.mutedL, textAlign: "center" }}>
          Oresto Admin · v2.0 · 2026 © Tous droits réservés
        </p>
      </div>
    </div>
  );
}
