import { useState, useEffect } from "react";
import { C } from "../styles/tokens";
import { Card, Btn, Input, Spinner } from "../components/ui";
import { api } from "../api/client";

/**
 * SettingsScreen — Paramètres du restaurant
 * Accessible aux rôles : admin, manager
 * Permet de modifier : nom, adresse, téléphone, email, logo_url, ville, pays, couleur_primaire
 * Ces infos apparaissent dans l'en-tête des factures PDF.
 */
const SettingsScreen = ({ toast, user, setUser }) => {
  const [form, setForm]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]  = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Charger les infos du restaurant depuis /api/restaurant/my/
  useEffect(() => {
    setLoading(true);
    api.get("/restaurant/my/")
      .then(data => {
        setForm({
          nom:              data.nom              || "",
          email:            data.email            || "",
          telephone:        data.telephone        || "",
          adresse:          data.adresse          || "",
          ville:            data.ville            || "",
          pays:             data.pays             || "Bénin",
          logo_url:         data.logo_url         || "",
          couleur_primaire: data.couleur_primaire || "#C9A84C",
        });
      })
      .catch(() => {
        // Fallback sur les infos disponibles dans user.restaurant
        const r = user?.restaurant || {};
        setForm({
          nom:              r.nom              || "",
          email:            r.email            || "",
          telephone:        r.telephone        || "",
          adresse:          r.adresse          || "",
          ville:            r.ville            || "",
          pays:             r.pays             || "Bénin",
          logo_url:         r.logo_url         || "",
          couleur_primaire: r.couleur_primaire || "#C9A84C",
        });
        toast.warning("Avertissement", "Impossible de charger toutes les informations du restaurant.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.nom?.trim()) {
      toast.error("Erreur", "Le nom du restaurant est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      const data = await api.patch("/restaurant/my/", form);
      toast.success("Enregistré", "Paramètres du restaurant mis à jour.");
      // Mettre à jour user.restaurant dans l'état local
      if (setUser && user) {
        setUser(u => ({ ...u, restaurant: { ...u.restaurant, ...data } }));
      }
    } catch (e) {
      toast.error("Erreur", e.message || "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingTop: 80 }}>
        <Spinner size={36} />
      </div>
    );
  }

  return (
    <div className="anim-fadeUp" style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* ── Bandeau info ─────────────────────────────────────────────── */}
      <div style={{
        background: `${C.gold}12`, border: `1px solid ${C.gold}30`,
        borderRadius: 10, padding: "12px 16px", marginBottom: 28,
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 20 }}>🧾</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.goldD || C.gold }}>
            Ces informations apparaissent sur vos factures PDF
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
            Nom, adresse, téléphone, email et logo du restaurant sont affichés en en-tête de chaque reçu client.
          </div>
        </div>
      </div>

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <Card style={{ padding: "24px 28px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 20 }}>
          Logo du restaurant
        </h3>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Prévisualisation */}
          <div style={{
            width: 96, height: 96, borderRadius: 12,
            border: `1.5px solid ${C.border}`,
            background: C.bg1,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", flexShrink: 0,
          }}>
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={e => { e.target.style.display = "none"; }}
              />
            ) : (
              <span style={{ fontSize: 32 }}>🍽</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              label="URL du logo (lien public)"
              value={form.logo_url}
              onChange={v => upd("logo_url", v)}
              placeholder="https://exemple.com/logo.png"
            />
            <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              Utilisez un lien image public (PNG, JPG). Le logo s'affichera en haut de chaque facture PDF.
            </p>
          </div>
        </div>
      </Card>

      {/* ── Infos principales ────────────────────────────────────────── */}
      <Card style={{ padding: "24px 28px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 20 }}>
          Informations du restaurant
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Nom du restaurant *"
            value={form.nom}
            onChange={v => upd("nom", v)}
            required
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input
              label="Téléphone"
              value={form.telephone}
              onChange={v => upd("telephone", v)}
              placeholder="+229 96 00 00 00"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={v => upd("email", v)}
              placeholder="contact@monrestaurant.bj"
            />
          </div>
          <Input
            label="Adresse"
            value={form.adresse}
            onChange={v => upd("adresse", v)}
            placeholder="123 Rue de la Paix"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input
              label="Ville"
              value={form.ville}
              onChange={v => upd("ville", v)}
              placeholder="Cotonou"
            />
            <Input
              label="Pays"
              value={form.pays}
              onChange={v => upd("pays", v)}
              placeholder="Bénin"
            />
          </div>
        </div>
      </Card>

      {/* ── Personnalisation ─────────────────────────────────────────── */}
      <Card style={{ padding: "24px 28px", marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 20 }}>
          Personnalisation
        </h3>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 8 }}>
              Couleur principale
            </label>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                type="color"
                value={form.couleur_primaire}
                onChange={e => upd("couleur_primaire", e.target.value)}
                style={{
                  width: 48, height: 48, borderRadius: 8, border: `1.5px solid ${C.border}`,
                  cursor: "pointer", background: "none", padding: 2,
                }}
              />
              <input
                type="text"
                value={form.couleur_primaire}
                onChange={e => upd("couleur_primaire", e.target.value)}
                maxLength={7}
                style={{
                  width: 100, padding: "8px 12px", fontSize: 13,
                  border: `1.5px solid ${C.border}`, borderRadius: 8,
                  background: C.bg1, color: C.text, fontFamily: "monospace",
                }}
              />
              <div style={{
                width: 48, height: 48, borderRadius: 8,
                background: form.couleur_primaire,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }} />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Bouton enregistrer ───────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Btn onClick={handleSave} loading={saving} style={{ padding: "12px 32px" }}>
          💾 Enregistrer les paramètres
        </Btn>
      </div>
    </div>
  );
};

export default SettingsScreen;
