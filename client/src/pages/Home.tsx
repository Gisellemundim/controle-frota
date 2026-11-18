import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChevronRight,
  ClipboardPlus,
  DollarSign,
  History,
  Menu,
  Package,
  Plus,
  Settings2,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type View = "painel" | "lancar" | "historico" | "cadastros";
type FormState = {
  serviceDate: string;
  vehicleId: string;
  km: string;
  maintenanceTypeId: string;
  vehicleSystemId: string;
  serviceDescription: string;
  material: string;
  partQuantity: string;
  partUnitValue: string;
  laborValue: string;
  supplierId: string;
  nextMaintenance: string;
  notes: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const blankForm = (): FormState => ({
  serviceDate: today(), vehicleId: "", km: "", maintenanceTypeId: "", vehicleSystemId: "",
  serviceDescription: "", material: "", partQuantity: "0", partUnitValue: "0", laborValue: "0",
  supplierId: "", nextMaintenance: "", notes: "",
});

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
const dateBr = (value?: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00`)) : "—";
const asNumber = (value: string) => Number(value.replace(",", ".")) || 0;

const navigation: { id: View; label: string; icon: typeof BarChart3 }[] = [
  { id: "painel", label: "Painel", icon: BarChart3 },
  { id: "lancar", label: "Lançar", icon: ClipboardPlus },
  { id: "historico", label: "Histórico", icon: History },
  { id: "cadastros", label: "Cadastros", icon: Settings2 },
];

function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{children}</div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-symbol">+</div><strong>{title}</strong><span>{text}</span></div>;
}

export default function Home() {
  const [view, setView] = useState<View>("painel");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [referenceDrafts, setReferenceDrafts] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({ vehicleId: "", maintenanceTypeId: "", vehicleSystemId: "", from: "", to: "" });

  const utils = trpc.useUtils();
  const bootstrap = trpc.fleet.bootstrap.useMutation();
  const references = trpc.fleet.references.useQuery();
  const dashboard = trpc.fleet.dashboard.useQuery();
  const history = trpc.fleet.list.useQuery({
    vehicleId: filters.vehicleId ? Number(filters.vehicleId) : undefined,
    maintenanceTypeId: filters.maintenanceTypeId ? Number(filters.maintenanceTypeId) : undefined,
    vehicleSystemId: filters.vehicleSystemId ? Number(filters.vehicleSystemId) : undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  });

  useEffect(() => { bootstrap.mutate(); }, []);

  const refresh = async () => {
    await Promise.all([utils.fleet.references.invalidate(), utils.fleet.dashboard.invalidate(), utils.fleet.list.invalidate()]);
  };

  const addReference = trpc.fleet.addReference.useMutation({
    onSuccess: async () => { await refresh(); toast.success("Cadastro incluído!"); },
    onError: error => toast.error(error.message || "Não foi possível salvar o cadastro."),
  });
  const saveMaintenance = trpc.fleet.create.useMutation({
    onSuccess: async () => { await refresh(); toast.success("Manutenção salva!"); setForm(blankForm()); setView("historico"); },
    onError: error => toast.error(error.message || "Confira os campos obrigatórios."),
  });
  const editMaintenance = trpc.fleet.update.useMutation({
    onSuccess: async () => { await refresh(); toast.success("Manutenção atualizada!"); setEditingId(null); setForm(blankForm()); setView("historico"); },
    onError: error => toast.error(error.message || "Não foi possível atualizar."),
  });
  const removeMaintenance = trpc.fleet.remove.useMutation({
    onSuccess: async () => { await refresh(); toast.success("Lançamento removido."); },
    onError: error => toast.error(error.message || "Não foi possível remover."),
  });

  const vehicles = references.data?.vehicles ?? [];
  const types = references.data?.types ?? [];
  const systems = references.data?.systems ?? [];
  const suppliers = references.data?.suppliers ?? [];
  const rows = history.data ?? [];
  const partsTotal = useMemo(() => asNumber(form.partQuantity) * asNumber(form.partUnitValue), [form.partQuantity, form.partUnitValue]);
  const total = partsTotal + asNumber(form.laborValue);

  const setField = (field: keyof FormState, value: string) => setForm(current => ({ ...current, [field]: value }));
  const selectView = (next: View) => { setView(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const submitMaintenance = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      serviceDate: form.serviceDate,
      vehicleId: Number(form.vehicleId),
      km: Number(form.km),
      maintenanceTypeId: Number(form.maintenanceTypeId),
      vehicleSystemId: Number(form.vehicleSystemId),
      serviceDescription: form.serviceDescription,
      material: form.material || null,
      partQuantity: asNumber(form.partQuantity),
      partUnitValue: asNumber(form.partUnitValue),
      laborValue: asNumber(form.laborValue),
      supplierId: form.supplierId ? Number(form.supplierId) : null,
      nextMaintenance: form.nextMaintenance || null,
      notes: form.notes || null,
    };
    if (!payload.vehicleId || !payload.maintenanceTypeId || !payload.vehicleSystemId || !payload.serviceDescription.trim() || !payload.km && payload.km !== 0) {
      toast.error("Preencha data, placa, KM, tipo, sistema e serviço executado.");
      return;
    }
    if (editingId) editMaintenance.mutate({ id: editingId, data: payload });
    else saveMaintenance.mutate(payload);
  };

  const beginEdit = (row: (typeof rows)[number]) => {
    setEditingId(row.id);
    setForm({
      serviceDate: row.serviceDate, vehicleId: String(row.vehicleId), km: String(row.km),
      maintenanceTypeId: String(row.maintenanceTypeId), vehicleSystemId: String(row.vehicleSystemId),
      serviceDescription: row.serviceDescription, material: row.material ?? "", partQuantity: String(row.partQuantity),
      partUnitValue: String(row.partUnitValue), laborValue: String(row.laborValue), supplierId: row.supplierId ? String(row.supplierId) : "",
      nextMaintenance: row.nextMaintenance ?? "", notes: row.notes ?? "",
    });
    selectView("lancar");
  };

  const addReferenceItem = (kind: "vehicle" | "type" | "system" | "supplier") => {
    const name = referenceDrafts[kind]?.trim();
    if (!name) return toast.error("Digite um nome antes de adicionar.");
    addReference.mutate({ kind, name });
    setReferenceDrafts(current => ({ ...current, [kind]: "" }));
  };

  const isSaving = saveMaintenance.isPending || editMaintenance.isPending;
  const isLoading = references.isLoading || dashboard.isLoading;

  const renderDashboard = () => {
    const data = dashboard.data;
    const kpis = data?.kpis;
    const systemsChart = data?.bySystem ?? [];
    const months = data?.months ?? [];
    const maxSystem = Math.max(...systemsChart.map(item => item.value), 1);
    const maxMonth = Math.max(...months.map(item => item.value), 1);
    return <>
      <SectionTitle eyebrow="VISÃO GERAL" title="Painel da frota"><button className="primary-button" onClick={() => selectView("lancar")}><Plus size={18}/> Novo lançamento</button></SectionTitle>
      <div className="kpi-grid">
        <Kpi icon={Wrench} label="Manutenções" value={String(kpis?.maintenanceCount ?? 0)} tone="blue" />
        <Kpi icon={DollarSign} label="Custo total" value={money(kpis?.totalCost ?? 0)} tone="amber" />
        <Kpi icon={Package} label="Peças" value={money(kpis?.partsCost ?? 0)} tone="teal" />
        <Kpi icon={Truck} label="Mão de obra" value={money(kpis?.laborCost ?? 0)} tone="purple" />
        <Kpi icon={CalendarDays} label="Próximas em 30 dias" value={String(kpis?.upcomingCount ?? 0)} tone="orange" />
      </div>
      <div className="dashboard-grid">
        <section className="panel panel-wide"><div className="panel-header"><div><span className="eyebrow">CUSTOS</span><h2>Gastos por sistema</h2></div><Wrench size={20}/></div>
          {systemsChart.length ? <div className="bars">{systemsChart.slice(0, 7).map(item => <div className="bar-row" key={item.name}><span>{item.name}</span><div className="bar-track"><i style={{ width: `${Math.max((item.value / maxSystem) * 100, 3)}%` }} /></div><strong>{money(item.value)}</strong></div>)}</div> : <EmptyState title="Ainda sem lançamentos" text="Os custos por sistema aparecerão aqui." />}
        </section>
        <section className="panel"><div className="panel-header"><div><span className="eyebrow">STATUS</span><h2>Próximas manutenções</h2></div><AlertTriangle size={20}/></div>
          {(data?.alerts ?? []).length ? <div className="alert-list">{data!.alerts.slice(0, 5).map(alert => <div className="alert-item" key={alert.id}><span className={`alert-dot ${alert.status === "Vencida" ? "late" : "soon"}`} /><div><strong>{alert.plate}</strong><small>{alert.systemName} · {alert.serviceDescription}</small></div><b>{dateBr(alert.nextMaintenance)}</b></div>)}</div> : <EmptyState title="Tudo tranquilo" text="Nenhuma manutenção vencida ou próxima." />}
        </section>
        <section className="panel"><div className="panel-header"><div><span className="eyebrow">TIPOS</span><h2>Manutenções por tipo</h2></div><ClipboardPlus size={20}/></div>
          {(data?.byType ?? []).length ? <div className="mini-list">{data!.byType.map(item => <div key={item.name}><span>{item.name}</span><strong>{item.count}</strong><small>{money(item.value)}</small></div>)}</div> : <EmptyState title="Sem dados ainda" text="Os tipos lançados ficarão aqui." />}
        </section>
        <section className="panel panel-wide"><div className="panel-header"><div><span className="eyebrow">TENDÊNCIA</span><h2>Custo por mês</h2></div><BarChart3 size={20}/></div>
          <div className="month-chart">{months.map(item => <div className="month-col" key={item.label}><b style={{ height: `${Math.max((item.value / maxMonth) * 100, item.value ? 4 : 0)}%` }} /><span>{item.label}</span><small>{item.value ? money(item.value) : "—"}</small></div>)}</div>
        </section>
      </div>
    </>;
  };

  const renderLaunch = () => <>
    <SectionTitle eyebrow={editingId ? "EDITAR LANÇAMENTO" : "NOVO LANÇAMENTO"} title={editingId ? "Atualize a manutenção" : "Lançar manutenção"}>
      {editingId ? <button className="ghost-button" onClick={() => { setEditingId(null); setForm(blankForm()); }}><X size={18}/> Cancelar edição</button> : <span className="hint">Os campos com * são obrigatórios</span>}
    </SectionTitle>
    <form className="launch-form" onSubmit={submitMaintenance}>
      <section className="form-section"><div className="form-section-head"><span>1</span><div><h2>Identificação</h2><p>Qual caminhão recebeu o serviço?</p></div></div><div className="form-grid">
        <Field label="Data *"><input type="date" value={form.serviceDate} onChange={e => setField("serviceDate", e.target.value)} required /></Field>
        <Field label="Placa *"><select value={form.vehicleId} onChange={e => setField("vehicleId", e.target.value)} required><option value="">Selecione a placa</option>{vehicles.map(item => <option value={item.id} key={item.id}>{item.plate}</option>)}</select></Field>
        <Field label="KM *"><input inputMode="numeric" min="0" type="number" placeholder="Ex.: 125000" value={form.km} onChange={e => setField("km", e.target.value)} required /></Field>
        <Field label="Tipo *"><select value={form.maintenanceTypeId} onChange={e => setField("maintenanceTypeId", e.target.value)} required><option value="">Selecione o tipo</option>{types.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Sistema *"><select value={form.vehicleSystemId} onChange={e => setField("vehicleSystemId", e.target.value)} required><option value="">Selecione o sistema</option>{systems.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Oficina / fornecedor"><select value={form.supplierId} onChange={e => setField("supplierId", e.target.value)}><option value="">Não informado</option>{suppliers.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field>
      </div></section>
      <section className="form-section"><div className="form-section-head"><span>2</span><div><h2>Serviço e peças</h2><p>Os valores totais são calculados sozinhos.</p></div></div><div className="form-grid">
        <Field label="Serviço executado *" wide><input value={form.serviceDescription} onChange={e => setField("serviceDescription", e.target.value)} placeholder="Ex.: Troca de óleo e filtros" required /></Field>
        <Field label="Peça / material" wide><input value={form.material} onChange={e => setField("material", e.target.value)} placeholder="Ex.: Filtro de óleo" /></Field>
        <Field label="Quantidade de peças"><input min="0" step="0.01" inputMode="decimal" type="number" value={form.partQuantity} onChange={e => setField("partQuantity", e.target.value)} /></Field>
        <Field label="Valor unitário (R$)"><input min="0" step="0.01" inputMode="decimal" type="number" value={form.partUnitValue} onChange={e => setField("partUnitValue", e.target.value)} /></Field>
        <Field label="Valor total das peças"><div className="calculated">{money(partsTotal)}</div></Field>
        <Field label="Mão de obra (R$)"><input min="0" step="0.01" inputMode="decimal" type="number" value={form.laborValue} onChange={e => setField("laborValue", e.target.value)} /></Field>
        <Field label="Valor total"><div className="calculated total">{money(total)}</div></Field>
      </div></section>
      <section className="form-section"><div className="form-section-head"><span>3</span><div><h2>Próximo cuidado</h2><p>Programe uma próxima manutenção para receber alerta no painel.</p></div></div><div className="form-grid">
        <Field label="Próxima troca / manutenção"><input type="date" value={form.nextMaintenance} onChange={e => setField("nextMaintenance", e.target.value)} /></Field>
        <Field label="Observação" wide><textarea rows={3} value={form.notes} onChange={e => setField("notes", e.target.value)} placeholder="Detalhes importantes, garantia, número da nota..." /></Field>
      </div></section>
      <div className="form-actions"><button type="button" className="ghost-button" onClick={() => { setEditingId(null); setForm(blankForm()); }}>Limpar</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Salvando..." : editingId ? "Salvar alteração" : "Salvar manutenção"}<ChevronRight size={18}/></button></div>
    </form>
  </>;

  const renderHistory = () => <>
    <SectionTitle eyebrow="CONSULTA" title="Histórico de manutenções"><button className="primary-button" onClick={() => selectView("lancar")}><Plus size={18}/> Novo lançamento</button></SectionTitle>
    <section className="panel filters"><div className="filters-grid"><FilterSelect label="Placa" value={filters.vehicleId} onChange={value => setFilters(current => ({ ...current, vehicleId: value }))} items={vehicles.map(item => ({ id: item.id, name: item.plate }))} placeholder="Todas" /><FilterSelect label="Tipo" value={filters.maintenanceTypeId} onChange={value => setFilters(current => ({ ...current, maintenanceTypeId: value }))} items={types} placeholder="Todos" /><FilterSelect label="Sistema" value={filters.vehicleSystemId} onChange={value => setFilters(current => ({ ...current, vehicleSystemId: value }))} items={systems} placeholder="Todos" /><Field label="De"><input type="date" value={filters.from} onChange={e => setFilters(current => ({ ...current, from: e.target.value }))}/></Field><Field label="Até"><input type="date" value={filters.to} onChange={e => setFilters(current => ({ ...current, to: e.target.value }))}/></Field></div><button className="text-button" onClick={() => setFilters({ vehicleId: "", maintenanceTypeId: "", vehicleSystemId: "", from: "", to: "" })}>Limpar filtros</button></section>
    <section className="panel table-panel"><div className="panel-header"><div><span className="eyebrow">REGISTROS</span><h2>{rows.length} lançamento{rows.length === 1 ? "" : "s"}</h2></div></div>{history.isLoading ? <div className="loading-line">Carregando...</div> : rows.length ? <div className="table-scroll"><table><thead><tr><th>Data</th><th>Placa</th><th>Tipo / sistema</th><th>Serviço</th><th>Custo total</th><th>Próxima</th><th></th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{dateBr(row.serviceDate)}</td><td><b>{row.plate}</b><small>{row.km.toLocaleString("pt-BR")} km</small></td><td><span className="tag">{row.typeName}</span><small>{row.systemName}</small></td><td><b>{row.serviceDescription}</b><small>{row.material || "Sem peça/material"}</small></td><td className="money-cell">{money(row.totalValue)}<small>Peças {money(row.partsTotal)}</small></td><td>{dateBr(row.nextMaintenance)}</td><td><div className="row-actions"><button onClick={() => beginEdit(row)}>Editar</button><button className="danger" onClick={() => { if (window.confirm("Remover este lançamento?")) removeMaintenance.mutate({ id: row.id }); }}>Excluir</button></div></td></tr>)}</tbody></table></div> : <EmptyState title="Nenhum lançamento encontrado" text="Use o botão Novo lançamento para registrar a primeira manutenção." />}</section>
  </>;

  const renderCadastros = () => <>
    <SectionTitle eyebrow="LISTAS DO APLICATIVO" title="Cadastros"><span className="hint">Eles aparecem nas listas do lançamento.</span></SectionTitle>
    <div className="reference-grid"><ReferenceCard title="Placas" caption="Caminhões da frota" kind="vehicle" values={vehicles.map(item => item.plate)} value={referenceDrafts.vehicle ?? ""} onChange={value => setReferenceDrafts(current => ({ ...current, vehicle: value }))} onAdd={addReferenceItem} placeholder="Ex.: ABC1D23" loading={addReference.isPending} /><ReferenceCard title="Tipos" caption="Tipos de manutenção" kind="type" values={types.map(item => item.name)} value={referenceDrafts.type ?? ""} onChange={value => setReferenceDrafts(current => ({ ...current, type: value }))} onAdd={addReferenceItem} placeholder="Ex.: Revisão" loading={addReference.isPending} /><ReferenceCard title="Sistemas" caption="Partes do veículo" kind="system" values={systems.map(item => item.name)} value={referenceDrafts.system ?? ""} onChange={value => setReferenceDrafts(current => ({ ...current, system: value }))} onAdd={addReferenceItem} placeholder="Ex.: Direção" loading={addReference.isPending} /><ReferenceCard title="Fornecedores" caption="Oficinas e parceiros" kind="supplier" values={suppliers.map(item => item.name)} value={referenceDrafts.supplier ?? ""} onChange={value => setReferenceDrafts(current => ({ ...current, supplier: value }))} onAdd={addReferenceItem} placeholder="Ex.: Oficina Central" loading={addReference.isPending} /></div>
  </>;

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}><div className="brand"><span className="brand-mark"><Truck size={21}/></span><div><b>Frota</b><small>MANUTENÇÃO</small></div><button className="mobile-close" onClick={() => setMenuOpen(false)}><X size={20}/></button></div><nav>{navigation.map(item => { const Icon = item.icon; return <button className={view === item.id ? "active" : ""} onClick={() => selectView(item.id)} key={item.id}><Icon size={19}/><span>{item.label}</span></button>; })}</nav><div className="sidebar-footer"><span className="online-dot"/> Banco de dados ativo</div></aside>
    {menuOpen && <button className="backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
    <main className="main"><header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)}><Menu size={22}/></button><div><span className="top-date">CONTROLE DE MANUTENÇÃO</span><strong>Olá! Vamos cuidar da frota.</strong></div><button className="header-action" onClick={() => selectView("lancar")}><Plus size={18}/><span>Novo</span></button></header><div className="content">{isLoading && view === "painel" ? <div className="loading-screen">Preparando seu painel...</div> : view === "painel" ? renderDashboard() : view === "lancar" ? renderLaunch() : view === "historico" ? renderHistory() : renderCadastros()}</div></main>
    <nav className="mobile-nav">{navigation.map(item => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => selectView(item.id)}><Icon size={20}/><span>{item.label}</span></button>; })}</nav>
  </div>;
}

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof Wrench; label: string; value: string; tone: string }) { return <div className={`kpi-card ${tone}`}><div className="kpi-icon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={`field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>; }
function FilterSelect({ label, value, onChange, items, placeholder }: { label: string; value: string; onChange: (value: string) => void; items: { id: number; name: string }[]; placeholder: string }) { return <Field label={label}><select value={value} onChange={event => onChange(event.target.value)}><option value="">{placeholder}</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>; }
function ReferenceCard({ title, caption, kind, values, value, onChange, onAdd, placeholder, loading }: { title: string; caption: string; kind: "vehicle" | "type" | "system" | "supplier"; values: string[]; value: string; onChange: (value: string) => void; onAdd: (kind: "vehicle" | "type" | "system" | "supplier") => void; placeholder: string; loading: boolean }) { return <section className="reference-card"><div><span className="eyebrow">{caption}</span><h2>{title}</h2></div><div className="add-reference"><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); onAdd(kind); } }} /><button onClick={() => onAdd(kind)} disabled={loading}><Plus size={18}/></button></div><div className="chips">{values.length ? values.map(item => <span key={item}>{item}</span>) : <small>Nenhum item cadastrado.</small>}</div></section>; }
