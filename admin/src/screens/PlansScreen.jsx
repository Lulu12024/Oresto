import { useState, useEffect } from "react";
import { C } from "../styles/tokens";
import { Card, Btn, Badge, Modal, Input, Spinner } from "../components/ui";
import { plansApi } from "../api/client";

const EMPTY = { nom: "starter", prix_mensuel: "", max_tables: "10", max_utilisateurs: "5", module_commandes: true, module_stock: false, description: "" };

export default function PlansScreen({ toast }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    plansApi.list()
      .then(p => setPlans(Array.isArray(p) ? p : (p.results || [])))
      .catch(e => toast.error("Erreur", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ nom: p.nom, prix_mensuel: String(p.prix_mensuel), max_tables: String(p.max_tables), max_utilisateurs: String(p.max_utilisateurs), module_commandes: p.module_commandes, module_stock: p.module_stock, description: p.description });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, prix_mensuel: parseFloat(form.prix_mensuel), max_tables: parseInt(form.max_tables), max_utilisateurs: parseInt(form.max_utilisateurs) };
      if (editing) await plansApi.update(editing.id, payload);
      else         await plansApi.create(payload);
      toast.success(editing ? "Plan mis à jour" : "Plan créé");
      setShowForm(false);
      load();
    } catch (e) { toast.error("Erreur", e.message); }
    finally { setSaving(false); }
  };

  const planColors = { starter: C.info, pro: C.gold, enterprise: C.purple };

  return (
    <div className="anim-fadeUp">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Plans tarifaires</h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Gérez les offres de la plateforme</p>
        </div>
        <Btn onClick={openCreate}>+ Nouveau plan</Btn>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
          {plans.map(plan => {
            const color = planColors[plan.nom] || C.gold;
            return (
              <Card key={plan.id} style={{ padding: "28px 24px", border: `1px solid ${color}25` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <Badge color={color} style={{ marginBottom: 10 }}>{plan.nom.toUpperCase()}</Badge>
                    <div className="serif" style={{ fontSize: "1.9rem", fontWeight: 700, color: C.text }}>
                      {parseFloat(plan.prix_mensuel).toLocaleString()}
                      <span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}> FCFA/mois</span>
                    </div>
                  </div>
                  <Btn small variant="ghost" onClick={() => openEdit(plan)}>✏ Modifier</Btn>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Tables max", val: plan.max_tables },
                    { label: "Utilisateurs max", val: plan.max_utilisateurs },
                    { label: "Module commandes", val: plan.module_commandes ? "✓ Inclus" : "✗ Non inclus", ok: plan.module_commandes },
                    { label: "Module stock", val: plan.module_stock ? "✓ Inclus" : "✗ Non inclus", ok: plan.module_stock },
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: C.muted }}>{f.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: f.ok !== undefined ? (f.ok ? C.success : C.danger) : C.text }}>{f.val}</span>
                    </div>
                  ))}
                </div>

                {plan.description && (
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}`, lineHeight: 1.6 }}>
                    {plan.description}
                  </p>
                )}
              </Card>
            );
          })}

          {plans.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px", color: C.muted, fontSize: 14 }}>
              Aucun plan configuré. Créez votre premier plan.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Modifier le plan" : "Nouveau plan"} width={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 6 }}>Nom du plan *</label>
            <select value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
              style={{ width: "100%", padding: "10px 13px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.bg1, color: C.text, fontFamily: "'Inter',sans-serif" }}>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <Input label="Prix mensuel (FCFA)" type="number" value={form.prix_mensuel} onChange={v => setForm(p => ({ ...p, prix_mensuel: v }))} required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Tables max" type="number" value={form.max_tables} onChange={v => setForm(p => ({ ...p, max_tables: v }))} />
            <Input label="Utilisateurs max" type="number" value={form.max_utilisateurs} onChange={v => setForm(p => ({ ...p, max_utilisateurs: v }))} />
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[["module_commandes", "Module commandes"], ["module_stock", "Module stock"]].map(([key, label]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: C.textSub }}>
                <input type="checkbox" checked={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: C.gold }} />
                {label}
              </label>
            ))}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 6 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3} placeholder="Description courte du plan…"
              style={{ width: "100%", padding: "10px 13px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.bg1, color: C.text, resize: "vertical", fontFamily: "'Inter',sans-serif" }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Btn variant="ghost" onClick={() => setShowForm(false)}>Annuler</Btn>
          <Btn onClick={handleSave} loading={saving}>{editing ? "Enregistrer" : "Créer le plan"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
