import { useState, useEffect } from "react";
import { C } from "../styles/tokens";
import { Card, Btn, Badge, Modal, Input, Select, Spinner, Table } from "../components/ui";
import { abonnementsApi, restaurantsApi, plansApi } from "../api/client";

const statutColor = { actif: C.success, expiré: C.danger, annulé: C.danger, essai: C.info };

export default function AbonnementsScreen({ toast }) {
  const [abonnements, setAbonnements] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showRenew, setShowRenew] = useState(null);
  const [filterResto, setFilterResto] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [form, setForm] = useState({ restaurant: "", plan: "", statut: "essai", date_debut: "", date_fin: "", montant_paye: "0" });
  const [renewMois, setRenewMois] = useState("1");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([abonnementsApi.list(), restaurantsApi.list(), plansApi.list()])
      .then(([a, r, p]) => {
        setAbonnements(Array.isArray(a) ? a : (a.results || []));
        setRestaurants(Array.isArray(r) ? r : (r.results || []));
        setPlans(Array.isArray(p) ? p : (p.results || []));
      })
      .catch(e => toast.error("Erreur", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = abonnements.filter(a => {
    const matchResto = !filterResto || String(a.restaurant) === filterResto;
    const matchStatut = !filterStatut || a.statut === filterStatut;
    return matchResto && matchStatut;
  });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await abonnementsApi.create({
        restaurant: form.restaurant,
        plan: form.plan,
        statut: form.statut,
        date_debut: form.date_debut || undefined,
        date_fin: form.date_fin || undefined,
        montant_paye: parseFloat(form.montant_paye) || 0,
      });
      toast.success("Abonnement créé");
      setShowNew(false);
      load();
    } catch (e) { toast.error("Erreur", e.message); }
    finally { setSaving(false); }
  };

  const handleRenew = async () => {
    setSaving(true);
    try {
      await abonnementsApi.renouveler(showRenew.id, parseInt(renewMois));
      toast.success("Abonnement renouvelé", `+${renewMois} mois`);
      setShowRenew(null);
      load();
    } catch (e) { toast.error("Erreur", e.message); }
    finally { setSaving(false); }
  };

  const restoMap = Object.fromEntries(restaurants.map(r => [String(r.id), r.nom]));
  const planMap  = Object.fromEntries(plans.map(p => [String(p.id), p.nom]));

  const columns = [
    {
      label: "Restaurant",
      render: a => <span style={{ fontWeight: 600, color: C.text }}>{restoMap[String(a.restaurant)] || a.restaurant}</span>,
    },
    {
      label: "Plan",
      render: a => <Badge color={C.gold}>{planMap[String(a.plan)] || a.plan}</Badge>,
    },
    {
      label: "Statut",
      render: a => <Badge color={statutColor[a.statut] || C.muted}>{a.statut}</Badge>,
    },
    {
      label: "Début",
      render: a => <span style={{ fontSize: 12, color: C.muted }}>{a.date_debut || "—"}</span>,
    },
    {
      label: "Fin",
      render: a => {
        if (!a.date_fin) return <span style={{ fontSize: 12, color: C.mutedL }}>Indéfinie</span>;
        const expired = new Date(a.date_fin) < new Date();
        return <span style={{ fontSize: 12, color: expired ? C.danger : C.text, fontWeight: expired ? 700 : 400 }}>{a.date_fin}</span>;
      },
    },
    {
      label: "Montant payé",
      render: a => <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{parseFloat(a.montant_paye || 0).toLocaleString()} FCFA</span>,
    },
    {
      label: "Actions",
      render: a => (
        <Btn small variant="outline" onClick={() => { setShowRenew(a); setRenewMois("1"); }}>
          Renouveler
        </Btn>
      ),
    },
  ];

  const restoOptions = restaurants.map(r => ({ value: r.id, label: r.nom }));
  const planOptions  = plans.map(p => ({ value: p.id, label: `${p.nom} — ${p.prix_mensuel} FCFA/mois` }));

  return (
    <div className="anim-fadeUp">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Abonnements</h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{filtered.length} abonnement{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Btn onClick={() => setShowNew(true)}>+ Nouvel abonnement</Btn>
      </div>

      {/* Filtres */}
      <Card style={{ padding: "14px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filterResto} onChange={e => setFilterResto(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: "9px 13px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.bg1, color: C.text, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
            <option value="">Tous les restaurants</option>
            {restaurants.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
          </select>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: "9px 13px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.bg1, color: C.text, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
            <option value="">Tous les statuts</option>
            {["actif", "essai", "expiré", "annulé"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filterResto || filterStatut) && (
            <Btn small variant="ghost" onClick={() => { setFilterResto(""); setFilterStatut(""); }}>Réinitialiser</Btn>
          )}
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner /></div>
        ) : (
          <Table columns={columns} rows={filtered} emptyLabel="Aucun abonnement" />
        )}
      </Card>

      {/* Modal nouvel abonnement */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouvel abonnement" width={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          <Select label="Restaurant" value={form.restaurant} onChange={v => setForm(p => ({ ...p, restaurant: v }))} options={restoOptions} required />
          <Select label="Plan" value={form.plan} onChange={v => setForm(p => ({ ...p, plan: v }))} options={planOptions} required />
          <Select label="Statut" value={form.statut} onChange={v => setForm(p => ({ ...p, statut: v }))}
            options={[
              { value: "essai", label: "Essai gratuit" },
              { value: "actif", label: "Actif" },
              { value: "expiré", label: "Expiré" },
              { value: "annulé", label: "Annulé" },
            ]} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Date début" type="date" value={form.date_debut} onChange={v => setForm(p => ({ ...p, date_debut: v }))} />
            <Input label="Date fin" type="date" value={form.date_fin} onChange={v => setForm(p => ({ ...p, date_fin: v }))} />
          </div>
          <Input label="Montant payé (FCFA)" type="number" value={form.montant_paye} onChange={v => setForm(p => ({ ...p, montant_paye: v }))} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Btn variant="ghost" onClick={() => setShowNew(false)}>Annuler</Btn>
          <Btn onClick={handleCreate} loading={saving}>Créer l'abonnement</Btn>
        </div>
      </Modal>

      {/* Modal renouvellement */}
      <Modal open={!!showRenew} onClose={() => setShowRenew(null)} title="Renouveler l'abonnement" width={400}>
        {showRenew && (
          <div>
            <p style={{ fontSize: 13, color: C.textSub, marginBottom: 20 }}>
              Renouveler l'abonnement <strong>{planMap[String(showRenew.plan)] || "?"}</strong> de <strong>{restoMap[String(showRenew.restaurant)] || "?"}</strong>
            </p>
            <Select label="Durée" value={renewMois} onChange={setRenewMois}
              options={[1,2,3,6,12].map(n => ({ value: n, label: `${n} mois` }))} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <Btn variant="ghost" onClick={() => setShowRenew(null)}>Annuler</Btn>
              <Btn onClick={handleRenew} loading={saving}>Renouveler +{renewMois} mois</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
