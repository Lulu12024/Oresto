import { useState, useEffect } from "react";
import { C } from "../styles/tokens";
import { Card, Btn, Badge, Modal, Input, Spinner } from "../components/ui";
import { plansApi } from "../api/client";

/**
 * Plans tarifaires — différenciés par modules :
 *  - module_commandes : Restaurant + Équipe (commandes, tables, facturation)
 *  - module_stock     : + Gestion des stocks
 *  - module_support   : + Support 24h/24 prioritaire
 *
 * Plus de limite de tables ou d'utilisateurs : les restaurants gèrent eux-mêmes.
 */

const EMPTY = {
  nom: "",
  prix_mensuel: "",
  description: "",
  module_commandes: true,
  module_stock: false,
  module_support: false,
  is_active: true,
};

const MODULE_INFO = [
  {
    key: "module_commandes",
    label: "Restaurant & Équipe",
    desc: "Tables, commandes, QR code, facturation, menu, utilisateurs",
    icon: "🍽",
    color: C.info,
    required: true,
  },
  {
    key: "module_stock",
    label: "Gestion des stocks",
    desc: "Entrées/sorties stock, alertes, historique, rapports",
    icon: "📦",
    color: C.gold,
  },
  {
    key: "module_support",
    label: "Support 24h/24",
    desc: "Support prioritaire, accompagnement, accès direct à l'équipe",
    icon: "🎧",
    color: C.purple || "#8B5CF6",
  },
];

export default function PlansScreen({ toast }) {
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    plansApi.list()
      .then(p => setPlans(Array.isArray(p) ? p : (p.results || [])))
      .catch(e => toast.error("Erreur", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      nom:              p.nom,
      prix_mensuel:     String(p.prix_mensuel),
      description:      p.description || "",
      module_commandes: p.module_commandes ?? true,
      module_stock:     p.module_stock     ?? false,
      module_support:   p.module_support   ?? false,
      is_active:        p.is_active        ?? true,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) {
      toast.error("Erreur", "Le nom du plan est obligatoire.");
      return;
    }
    if (!form.prix_mensuel || isNaN(parseFloat(form.prix_mensuel))) {
      toast.error("Erreur", "Le prix mensuel est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nom:              form.nom.trim(),
        prix_mensuel:     parseFloat(form.prix_mensuel),
        description:      form.description,
        module_commandes: form.module_commandes,
        module_stock:     form.module_stock,
        module_support:   form.module_support,
        is_active:        form.is_active,
      };
      if (editing) await plansApi.update(editing.id, payload);
      else         await plansApi.create(payload);
      toast.success(editing ? "Plan mis à jour" : "Plan créé");
      setShowForm(false);
      load();
    } catch (e) {
      toast.error("Erreur", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Supprimer le plan "${plan.nom}" ?`)) return;
    try {
      await plansApi.delete(plan.id);
      toast.success("Plan supprimé");
      load();
    } catch (e) {
      toast.error("Erreur", e.message);
    }
  };

  const toggleModule = (key) => {
    if (key === "module_commandes") return; // toujours activé
    setForm(f => {
      const updated = { ...f, [key]: !f[key] };
      // Si on désactive stock, désactiver aussi support
      if (key === "module_stock" && !updated.module_stock) {
        updated.module_support = false;
      }
      // Si on active support, activer aussi stock
      if (key === "module_support" && updated.module_support) {
        updated.module_stock = true;
      }
      return updated;
    });
  };

  const getModuleLabel = (plan) => {
    const mods = [];
    if (plan.module_commandes) mods.push("Restaurant & Équipe");
    if (plan.module_stock)     mods.push("Stock");
    if (plan.module_support)   mods.push("Support 24h/24");
    return mods.join(" + ");
  };

  return (
    <div className="anim-fadeUp">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Plans tarifaires</h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
            Différenciez vos plans par modules activés. Les restaurants peuvent créer autant de tables et d'utilisateurs qu'ils souhaitent.
          </p>
        </div>
        <Btn onClick={openCreate}>+ Nouveau plan</Btn>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", paddingTop: 60 }}><Spinner /></div>
      ) : plans.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
          Aucun plan créé. Créez votre premier plan.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
          {plans.map(plan => {
            const color = plan.module_support
              ? (C.purple || "#8B5CF6")
              : plan.module_stock ? C.gold : C.info;
            return (
              <Card key={plan.id} style={{ padding: "24px 22px", position: "relative" }}>
                {!plan.is_active && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    fontSize: 10, background: C.muted + "20", color: C.muted,
                    padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                  }}>
                    Inactif
                  </div>
                )}

                {/* Nom & prix */}
                <div style={{ fontSize: 12, color, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
                  {plan.nom}
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: C.text, marginBottom: 4 }}>
                  {parseFloat(plan.prix_mensuel).toLocaleString("fr-FR")}
                  <span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}> FCFA/mois</span>
                </div>
                {plan.description && (
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{plan.description}</div>
                )}

                {/* Modules */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Modules inclus
                  </div>
                  {MODULE_INFO.map(mod => {
                    const active = plan[mod.key];
                    return (
                      <div key={mod.key} style={{
                        display: "flex", gap: 8, alignItems: "center", marginBottom: 6,
                        opacity: active ? 1 : 0.35,
                      }}>
                        <span style={{ fontSize: 14 }}>{active ? "✅" : "⬜"}</span>
                        <span style={{ fontSize: 12, color: active ? C.text : C.muted, fontWeight: active ? 600 : 400 }}>
                          {mod.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => openEdit(plan)}>
                    ✏️ Modifier
                  </Btn>
                  <Btn variant="ghost" style={{ fontSize: 12, color: C.danger, borderColor: C.danger + "40" }} onClick={() => handleDelete(plan)}>
                    🗑
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Modal création / édition ──────────────────────────────── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? `Modifier : ${editing.nom}` : "Nouveau plan tarifaire"}
        width={500}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 24 }}>

          {/* Nom */}
          <Input
            label="Nom du plan *"
            value={form.nom}
            onChange={v => setForm(f => ({ ...f, nom: v }))}
            placeholder="Ex: Starter, Pro, Business…"
            required
          />

          {/* Prix */}
          <Input
            label="Prix mensuel (FCFA) *"
            type="number"
            value={form.prix_mensuel}
            onChange={v => setForm(f => ({ ...f, prix_mensuel: v }))}
            placeholder="15000"
            required
          />

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 6 }}>
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Idéal pour les petits restaurants…"
              style={{
                width: "100%", padding: "10px 13px",
                border: `1.5px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, background: C.bg1, color: C.text,
                resize: "vertical", fontFamily: "'Inter',sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Sélection modules */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 12 }}>
              Modules inclus *
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MODULE_INFO.map(mod => {
                const active = form[mod.key];
                const locked = mod.required;
                return (
                  <div
                    key={mod.key}
                    onClick={() => !locked && toggleModule(mod.key)}
                    style={{
                      display: "flex", gap: 14, alignItems: "flex-start",
                      padding: "12px 14px", borderRadius: 10,
                      border: `1.5px solid ${active ? mod.color + "60" : C.border}`,
                      background: active ? mod.color + "0D" : "transparent",
                      cursor: locked ? "default" : "pointer",
                      transition: "all .15s",
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      border: `2px solid ${active ? mod.color : C.border}`,
                      background: active ? mod.color : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 1,
                    }}>
                      {active && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                        <span>{mod.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{mod.label}</span>
                        {locked && (
                          <span style={{ fontSize: 10, color: C.muted, background: C.bg3, padding: "1px 6px", borderRadius: 8 }}>
                            Inclus
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>{mod.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
              ℹ️ Aucune limite de tables ni d'utilisateurs — les restaurants gèrent librement.
            </p>
          </div>

          {/* Visible sur landing page */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: C.textSub }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: C.gold }}
            />
            Afficher sur la page d'accueil (landing page)
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Btn variant="ghost" onClick={() => setShowForm(false)}>Annuler</Btn>
          <Btn onClick={handleSave} loading={saving}>
            {editing ? "Enregistrer les modifications" : "Créer le plan"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
