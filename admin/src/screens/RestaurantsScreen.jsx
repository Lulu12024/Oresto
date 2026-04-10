import { useState, useEffect } from "react";
import { C } from "../styles/tokens";
import { Card, Btn, Badge, Modal, Input, Select, Spinner, Table } from "../components/ui";
import { restaurantsApi, plansApi } from "../api/client";

const statutColor = { actif: C.success, suspendu: C.warning, inactif: C.danger };

const EMPTY_FORM = {
  nom: "", slug: "", email: "", telephone: "", adresse: "", ville: "", pays: "Bénin",
  couleur_primaire: "#C9A84C",
  admin_login: "", admin_password: "", admin_first_name: "", admin_last_name: "", admin_email: "",
  plan_id: "",
};

export default function RestaurantsScreen({ toast }) {
  const [restaurants, setRestaurants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const load = () => {
    setLoading(true);
    Promise.all([restaurantsApi.list(), plansApi.list()])
      .then(([r, p]) => {
        setRestaurants(Array.isArray(r) ? r : (r.results || []));
        setPlans(Array.isArray(p) ? p : (p.results || []));
      })
      .catch(e => toast.error("Erreur chargement", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = restaurants.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.nom.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.ville||"").toLowerCase().includes(q);
    const matchStatut = !filterStatut || r.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const validate = () => {
    const errs = {};
    if (!form.nom) errs.nom = "Requis";
    if (!form.slug) errs.slug = "Requis";
    if (!form.email) errs.email = "Requis";
    if (!form.admin_login) errs.admin_login = "Requis";
    if (!form.admin_password || form.admin_password.length < 6) errs.admin_password = "6 caractères minimum";
    if (!form.admin_first_name) errs.admin_first_name = "Requis";
    if (!form.admin_last_name) errs.admin_last_name = "Requis";
    return errs;
  };

  const handleCreate = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.plan_id) delete payload.plan_id;
      else payload.plan_id = parseInt(payload.plan_id);
      await restaurantsApi.create(payload);
      toast.success("Restaurant créé !", `${form.nom} + admin ${form.admin_login}`);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
      load();
    } catch (e) {
      toast.error("Erreur création", e.message);
    } finally { setSaving(false); }
  };

  const handleSuspend = async (r) => {
    try {
      await restaurantsApi.suspend(r.id);
      toast.success("Suspendu", r.nom);
      load();
    } catch (e) { toast.error("Erreur", e.message); }
  };

  const handleActivate = async (r) => {
    try {
      await restaurantsApi.activate(r.id);
      toast.success("Activé", r.nom);
      load();
    } catch (e) { toast.error("Erreur", e.message); }
  };

  const setField = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (formErrors[k]) setFormErrors(prev => ({ ...prev, [k]: undefined }));
    // Auto-slug depuis le nom
    if (k === "nom") {
      const slug = v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      setForm(prev => ({ ...prev, nom: v, slug }));
    }
  };

  const planOptions = plans.map(p => ({ value: p.id, label: `${p.nom} — ${p.prix_mensuel} FCFA/mois` }));

  const columns = [
    {
      label: "Restaurant",
      render: r => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: C.goldBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🍽</div>
          <div>
            <div style={{ fontWeight: 600, color: C.text }}>{r.nom}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { label: "Ville", key: "ville" },
    {
      label: "Plan",
      render: r => r.plan_nom
        ? <Badge color={C.gold}>{r.plan_nom}</Badge>
        : <span style={{ fontSize: 12, color: C.mutedL }}>Sans plan</span>,
    },
    {
      label: "Utilisateurs",
      render: r => <span style={{ fontSize: 13, fontWeight: 600 }}>{r.nb_utilisateurs}</span>,
    },
    {
      label: "Statut",
      render: r => <Badge color={statutColor[r.statut] || C.muted}>{r.statut}</Badge>,
    },
    {
      label: "Créé le",
      render: r => <span style={{ fontSize: 12, color: C.muted }}>{new Date(r.date_creation).toLocaleDateString("fr-FR")}</span>,
    },
    {
      label: "Actions",
      render: r => (
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small variant="ghost" onClick={() => setShowDetail(r)}>Détails</Btn>
          {r.statut === "actif"
            ? <Btn small variant="warning" onClick={() => handleSuspend(r)}>Suspendre</Btn>
            : <Btn small variant="success" onClick={() => handleActivate(r)}>Activer</Btn>
          }
        </div>
      ),
    },
  ];

  return (
    <div className="anim-fadeUp">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Restaurants</h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{filtered.length} restaurant{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Btn onClick={() => { setShowCreate(true); setFormErrors({}); setForm(EMPTY_FORM); }}>
          + Nouveau restaurant
        </Btn>
      </div>

      {/* Filtres */}
      <Card style={{ padding: "14px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher par nom, email, ville…"
            style={{ flex: 1, minWidth: 220, padding: "9px 13px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.bg1, color: C.text, fontFamily: "'Inter',sans-serif" }}
          />
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: "9px 13px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.bg1, color: C.text, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="suspendu">Suspendu</option>
            <option value="inactif">Inactif</option>
          </select>
          {(search || filterStatut) && (
            <Btn small variant="ghost" onClick={() => { setSearch(""); setFilterStatut(""); }}>Réinitialiser</Btn>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner /></div>
        ) : (
          <Table columns={columns} rows={filtered} emptyLabel="Aucun restaurant trouvé" />
        )}
      </Card>

      {/* ── Modal création ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Créer un restaurant" width={640}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Input label="Nom du restaurant" value={form.nom} onChange={v => setField("nom", v)} required error={formErrors.nom} />
          <Input label="Slug (URL)" value={form.slug} onChange={v => setField("slug", v)} required error={formErrors.slug} placeholder="mon-restaurant" />
          <Input label="Email" type="email" value={form.email} onChange={v => setField("email", v)} required error={formErrors.email} />
          <Input label="Téléphone" value={form.telephone} onChange={v => setField("telephone", v)} />
          <Input label="Ville" value={form.ville} onChange={v => setField("ville", v)} />
          <Input label="Pays" value={form.pays} onChange={v => setField("pays", v)} />
          <div style={{ gridColumn: "1/-1" }}>
            <Input label="Adresse" value={form.adresse} onChange={v => setField("adresse", v)} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Select label="Plan tarifaire" value={form.plan_id} onChange={v => setField("plan_id", v)} options={planOptions} />
          </div>
        </div>

        <div style={{ padding: "16px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 6, padding: "2px 10px", fontSize: 11, color: C.goldD }}>Admin</span>
            Compte administrateur du restaurant
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Prénom admin" value={form.admin_first_name} onChange={v => setField("admin_first_name", v)} required error={formErrors.admin_first_name} />
            <Input label="Nom admin" value={form.admin_last_name} onChange={v => setField("admin_last_name", v)} required error={formErrors.admin_last_name} />
            <Input label="Login admin" value={form.admin_login} onChange={v => setField("admin_login", v)} required error={formErrors.admin_login} placeholder="admin.restaurant" />
            <Input label="Mot de passe" type="password" value={form.admin_password} onChange={v => setField("admin_password", v)} required error={formErrors.admin_password} />
            <div style={{ gridColumn: "1/-1" }}>
              <Input label="Email admin (optionnel)" type="email" value={form.admin_email} onChange={v => setField("admin_email", v)} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Btn variant="ghost" onClick={() => setShowCreate(false)}>Annuler</Btn>
          <Btn onClick={handleCreate} loading={saving}>
            ✓ Créer le restaurant
          </Btn>
        </div>
      </Modal>

      {/* ── Modal détail ── */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail?.nom || "Détail"} width={500}>
        {showDetail && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[
                ["Email", showDetail.email],
                ["Ville / Pays", `${showDetail.ville || "—"} · ${showDetail.pays}`],
                ["Plan", showDetail.plan_nom || "Sans plan"],
                ["Utilisateurs", showDetail.nb_utilisateurs],
                ["Statut", showDetail.statut],
                ["Créé le", new Date(showDetail.date_creation).toLocaleDateString("fr-FR")],
              ].map(([k, v], i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: .8, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
            {showDetail.abonnement_actif && (
              <div style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.goldD, marginBottom: 8 }}>Abonnement actif</div>
                <div style={{ fontSize: 13, color: C.textSub }}>
                  <b>{showDetail.abonnement_actif.plan_nom}</b> · {showDetail.abonnement_actif.statut}
                  {showDetail.abonnement_actif.date_fin && (
                    <span style={{ color: C.muted }}> · expire le {new Date(showDetail.abonnement_actif.date_fin).toLocaleDateString("fr-FR")}</span>
                  )}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              {showDetail.statut === "actif"
                ? <Btn variant="warning" onClick={() => { handleSuspend(showDetail); setShowDetail(null); }}>Suspendre</Btn>
                : <Btn variant="success" onClick={() => { handleActivate(showDetail); setShowDetail(null); }}>Activer</Btn>
              }
              <Btn variant="ghost" onClick={() => setShowDetail(null)}>Fermer</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
