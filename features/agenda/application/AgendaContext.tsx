"use client";
// Estado y reglas del módulo Agenda. Lógica portada del Simulador V8.2 para calendario,
// roles/alcance, traslapes, visitas abiertas y cierre automático de visita olvidada.
// En Épico esto viviría en Redux Toolkit (features/agenda/application/redux); aquí es un Context
// para que la versión sintética no dependa del store real.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AgendaEvent, Client, DetailVisibility, OwnerId, OwnerProfile, Role, Scope, SummaryFilter, View,
} from "@/features/agenda/domain/agenda.types";
import { endMin, hhmm, initialProfiles, mins, nowMx, ROLE_EXPLANATION } from "@/features/agenda/domain/agenda.data";
import { validarCierreManual, resultadoDerivado, TIPOS_SELECCIONABLES, OBJETIVOS_VISITA } from "@/src/lib/catalogosAgendaVisitas";

export type CreateActivityKind = "event" | "unplanned";
export interface FormState { open: boolean; editingId: AgendaEvent["id"] | null; title: string; client?: string; address?: string; date?: string; time?: string; startAfterCreate: boolean; creationMode: CreateActivityKind; seed: number }
export interface DetailState { event: AgendaEvent | null; visitNowCreated?: boolean }
type Snack = { msg: string; severity: "success" | "warning" | "error" | "info" } | null;

const timeDiff = (planned: string, actual: string) => mins(actual) - mins(planned);
const overlaps = (a: { time: string; duration: number }, b: { time: string; duration: number }) => mins(a.time) < endMin(b) && mins(b.time) < endMin(a);

function useAgendaState() {
  const [profiles, setProfiles] = useState<Record<OwnerId, OwnerProfile>>(initialProfiles);
  const [owner, setOwnerRaw] = useState<OwnerId>("alicia");
  const [role, setRoleRaw] = useState<Role>("manager");
  const [scope, setScopeRaw] = useState<Scope>("team");
  const [managerCanEdit, setManagerCanEdit] = useState(true);
  const [detailVisibility, setDetailVisibility] = useState<DetailVisibility>("full");
  const [view, setView] = useState<View>("day");
  const [selectedGridSlot, setSelectedGridSlot] = useState<{ date: string; time?: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [summaryFilter, setSummaryFilterRaw] = useState<SummaryFilter>(null);
  const [portfolioScope, setPortfolioScope] = useState<"own" | "team">("team");
  const [search, setSearch] = useState("");
  const [scenarioMsg, setScenarioMsg] = useState("");
  const [closeResult, setCloseResult] = useState<{ type: "info" | "ok"; text: string } | null>(null);
  const [form, setForm] = useState<FormState>({ open: false, editingId: null, title: "Nuevo evento", startAfterCreate: false, creationMode: "event", seed: 0 });
  const [detail, setDetail] = useState<DetailState>({ event: null });
  const [cancelTarget, setCancelTarget] = useState<AgendaEvent | null>(null);
  const [snack, setSnack] = useState<Snack>(null);
  const [showGaps, setShowGaps] = useState(false);

  const profile = profiles[owner];
  const events = profile.events.map(e => {
    if (e.status !== 'Programada' || e.absence) return e;
    const date = e.date ?? '2026-09-22';
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    return date < today || (date === today && endMin(e) < now.getHours()*60+now.getMinutes())
      ? {...e,status:e.activityType==='visit'?'Vencida/no ejecutada':'Pasado'} : e;
  });
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem('epico-agenda-qa-v2'); if (saved) setProfiles(JSON.parse(saved)); } catch { /* Mantener datos demo si el almacenamiento no está disponible. */ }
    setHydrated(true);
  }, []);
  useEffect(() => { if(hydrated) { try { localStorage.setItem('epico-agenda-qa-v2',JSON.stringify(profiles)); } catch { /* La sesión sigue operativa sin persistencia local. */ } } },[profiles,hydrated]);
  const clients = profile.clients;

  // ---------- permisos ----------
  const canEdit = role === "advisor" || (role === "manager" && managerCanEdit);
  const hideDetail = false;
  const eventLabel = useCallback((e: AgendaEvent) => (hideDetail ? "Ocupado" : e.title), [hideDetail]);
  const actorName = () => role === "advisor" ? profile.label : role === "manager" ? "Gestor de equipo DUMMY" : role === "support" ? "Administrador de Agenda DUMMY" : "Consulta ampliada DUMMY";
  const roleExplanation = role === "advisor" ? ROLE_EXPLANATION.advisor : role === "manager" ? (managerCanEdit ? ROLE_EXPLANATION.managerEdit : ROLE_EXPLANATION.managerRead) : role === "consult" ? ROLE_EXPLANATION.consult : ROLE_EXPLANATION.support;

  const updateEvents = (fn: (evs: AgendaEvent[]) => AgendaEvent[], who: OwnerId = owner) =>
    setProfiles((p) => ({ ...p, [who]: { ...p[who], events: fn(p[who].events) } }));

  // ---------- rol / alcance / agenda visible ----------
  const setOwner = (id: OwnerId) => { if (role === "advisor" && id !== "luis") return; setOwnerRaw(id); setSummaryFilterRaw(null); };
  const applyRoleRules = (r: Role, s: Scope) => {
    let ns = s;
    if (r === "advisor") ns = "own";
    else if (r === "manager" && s === "own") ns = "team";
    else if ((r === "support" || r === "consult") && s === "own") ns = "global";
    setScopeRaw(ns);
    if (r === "advisor") { setPortfolioScope("own"); setOwnerRaw("luis"); }
    else if (((r === "manager" || r === "support") && ns !== "own") || r === "consult") setPortfolioScope("team");
  };
  const setRole = (r: Role) => { setRoleRaw(r); applyRoleRules(r, scope); };
  const setScope = (s: Scope) => { setScopeRaw(s); applyRoleRules(role, s); };

  // ---------- cartera ----------
  const teamClients = useMemo<Client[]>(() => (Object.entries(profiles) as [OwnerId, OwnerProfile][])
    .filter(([id]) => id !== owner).flatMap(([, p]) => p.clients.map((c) => [c[0], c[1], c[2], c[3], p.label] as Client)), [profiles, owner]);
  const visiblePortfolio = useMemo<Client[]>(() => {
    if (role === "advisor") return clients;
    if (portfolioScope === "team" || scope === "global") return portfolioScope === "team" ? teamClients : [...clients, ...teamClients];
    return clients;
  }, [role, portfolioScope, scope, clients, teamClients]);

  const todayIso = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const currentMinute = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  // ---------- resumen ----------
  const matches = useCallback((e: AgendaEvent, f: SummaryFilter) => {
    if (f === "planned") return e.kind === "planned" && !e.absence;
    if (f === "done") return e.kind === "realized" && e.status === "Check-out realizado";
    if (f === "pending") return e.kind === "planned" && !e.absence && !events.some((r) => r.kind === "realized" && r.title === e.title && r.planned === e.time && r.status === "Check-out realizado");
    if (f === "late") return e.kind === "realized" && !!e.planned && timeDiff(e.planned, e.time) > 0;
    return true;
  }, [events]);
  const activeEvents = events.filter((e) => e.status !== "Cancelada");
  const summary = {
    planned: activeEvents.filter((e) => matches(e, "planned")).length,
    done: activeEvents.filter((e) => matches(e, "done")).length,
    pending: activeEvents.filter((e) => matches(e, "pending")).length,
    late: activeEvents.filter((e) => matches(e, "late")).length,
  };
  const setSummaryFilter = (f: SummaryFilter) => setSummaryFilterRaw((cur) => (cur === f ? null : f));
  const resolveNewVisitDrop = (date: string, time: string): { time: string; adjusted: boolean } | null => {
    const today = todayIso();
    if (date < today) {
      setSnack({ severity: "error", msg: "No puedes programar una visita en un horario pasado." });
      return null;
    }
    if (date > today) return { time, adjusted: false };

    const now = currentMinute();
    const requested = mins(time);
    if (requested >= now) return { time, adjusted: false };

    const requestedHour = Math.floor(requested / 60);
    const currentHour = Math.floor(now / 60);
    if (requestedHour !== currentHour) {
      setSnack({ severity: "error", msg: "No puedes programar una visita en un horario pasado." });
      return null;
    }

    const nextFive = Math.floor(now / 5) * 5 + 5;
    setSnack({ severity: "info", msg: `La hora se ajustó a ${hhmm(nextFive)} porque el horario seleccionado ya inició.` });
    return { time: hhmm(nextFive), adjusted: true };
  };

  // ---------- eventos: alta / edición / cancelación ----------
  const openForm = (opts: Partial<Pick<FormState, "client" | "address" | "date" | "time" | "startAfterCreate" | "title" | "creationMode">> = {}) => {
    if (!canEdit) return;
    const creationMode = opts.creationMode ?? (opts.startAfterCreate ? "unplanned" : "event");
    setForm({
      open: true,
      editingId: null,
      title: opts.title ?? (creationMode === "unplanned" ? "Crear visita no planeada" : "Nuevo evento"),
      client: opts.client,
      address: opts.address,
      date: opts.date,
      time: opts.time,
      startAfterCreate: creationMode === "unplanned" || !!opts.startAfterCreate,
      creationMode,
      seed: Date.now(),
    });
  };
  const setFormCreationMode = (creationMode: CreateActivityKind) =>
    setForm((current) => ({
      ...current,
      creationMode,
      startAfterCreate: creationMode === "unplanned",
      title: creationMode === "unplanned" ? "Crear visita no planeada" : "Nuevo evento",
    }));
  const openEdit = (e: AgendaEvent) => { setDetail({ event: null }); setForm({ open: true, editingId: e.id, title: "Editar / reprogramar visita", client: e.title, address: e.address, date: e.date, time: e.time, startAfterCreate: false, creationMode: "event", seed: Date.now() }); };
  const closeForm = () => setForm((f) => ({ ...f, open: false, editingId: null }));
  /** Devuelve un mensaje de error o null si se guardó. */
  const saveEvent = (v: { tipoEventoCodigo: string; type: AgendaEvent["activityType"]; client: string; address: string; date: string; time: string; duration: number; quote: string; description: string }): string | null => {
    if (!canEdit || (form.editingId != null && !canEditEvent(events.find(e=>e.id===form.editingId)!))) return "No puedes modificar este evento.";
    if (!navigator.onLine) return "Necesitas conexión para guardar la actividad.";
    const config = TIPOS_SELECCIONABLES.find(t=>t.codigo===v.tipoEventoCodigo);
    if (!config) return "Selecciona un tipo de evento disponible en el MVP.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time)) return "Captura una fecha y hora válidas.";
    if (config.requiereCliente && !visiblePortfolio.some(c=>c[0]===v.client && c[1]===v.address)) return "Selecciona un cliente y una dirección de tu cartera.";
    if (v.type === "visit" && (!v.client.trim() || !v.address.trim())) return "Selecciona un cliente y una dirección para continuar.";
    if (!Number.isFinite(v.duration) || v.duration <= 0) return "Captura una duración mayor que cero.";
    const today = todayIso();
    if (v.date < today || (v.date === today && mins(v.time) < currentMinute())) return "No puedes programar una visita en un horario pasado.";
    const prev = form.editingId != null ? events.find((x) => x.id === form.editingId) : undefined;
    const n: AgendaEvent = {
      id: form.editingId ?? Date.now(), title: config.requiereCliente ? v.client : config.nombre, address: config.requiereDireccion ? v.address : "Sin dirección", tipoEventoCodigo: config.codigo, origin: prev?.origin ?? (form.startAfterCreate ? "no planeada" : "planeada"), time: v.time, duration: v.duration, kind: "planned", status: "Programada",
      date: v.date, quote: v.quote, description: v.description, activityType: v.type, requiresEvidence: false,
      createdBy: prev?.createdBy || actorName(), createdAt: prev?.createdAt || nowMx(), modifiedBy: prev ? actorName() : null, modifiedAt: prev ? nowMx() : null,
    };
    const conflict = n.activityType !== "visit" || n.origin === "no planeada" ? null : events.find((x) => x.id !== n.id && x.kind === "planned" && !x.absence && x.activityType === "visit" && x.origin !== "no planeada" && !["Cancelada","Ejecutada"].includes(x.status) && (x.date ?? "2026-09-22") === n.date && overlaps(n, x));
    if (conflict) return `No se puede guardar. La visita se empalma con ${conflict.title} (${conflict.time}). Ajusta el horario para continuar.`;
    updateEvents((evs) => (form.editingId != null ? evs.map((x) => (x.id === form.editingId ? n : x)) : [...evs, n]));
    const visitNow = form.startAfterCreate;
    setForm((f) => ({ ...f, open: false, editingId: null }));
    setDetail({ event: n, visitNowCreated: visitNow });
    return null;
  };
  const cancelEvent = (e: AgendaEvent, reason: string) => {
    if (!canEditEvent(e) || !navigator.onLine || !reason.trim()) return;
    updateEvents((evs) => evs.map((x) => (x.id === e.id ? { ...x, status: "Cancelada", cancelReason: reason, modifiedBy: actorName(), modifiedAt: nowMx() } : x)));
    setCancelTarget(null); setDetail({ event: null });
    setSnack({ severity: "info", msg: `Evento cancelado: ${e.title} (${e.time}).` });
  };
  const canEditEvent = (e: AgendaEvent) => !!e && canEdit && e.kind === "planned" && !e.absence && !["Cancelada", "Check-in activo", "Check-out realizado", "Cierre automático", "Ejecutada"].includes(e.status);

  const rescheduleEvent = (e: AgendaEvent, date: string, time: string): boolean => {
    if (!canEditEvent(e)) {
      setSnack({ severity: "warning", msg: "Este evento ya inició ejecución o no puede reprogramarse." });
      return false;
    }

    if (!navigator.onLine || date < todayIso() || (date === todayIso() && mins(time) < currentMinute())) { setSnack({severity:'error',msg:'No puedes reprogramar en el pasado o sin conexión.'}); return false; }
    const candidate = { ...e, date, time };
    const conflict = candidate.activityType === "visit" && candidate.origin !== "no planeada"
      ? events.find((x) =>
          x.id !== candidate.id &&
          x.kind === "planned" &&
          !x.absence &&
          !["Cancelada", "Ejecutada"].includes(x.status) &&
          x.origin !== "no planeada" &&
          x.activityType === "visit" &&
          (x.date ?? "2026-09-22") === date &&
          overlaps(candidate, x)
        )
      : null;

    if (conflict) {
      setSnack({ severity: "error", msg: `No se puede mover la visita. Se empalma con ${conflict.title} (${conflict.time}).` });
      return false;
    }

    const updated: AgendaEvent = {
      ...candidate,
      modifiedBy: actorName(),
      modifiedAt: nowMx(),
    };
    updateEvents((evs) => evs.map((x) => (x.id === e.id ? updated : x)));
    setSnack({ severity: "success", msg: `Evento reprogramado a ${date} · ${time}.` });
    return true;
  };

  // ---------- ejecución de visita: Check-in / Check-out ----------
  const canExecuteVisit = (e: AgendaEvent) =>
    role === "advisor" &&
    e.activityType === "visit" &&
    !e.absence &&
    ["Programada","Vencida/no ejecutada"].includes(e.status) &&
    (e.date ?? "2026-09-22") === todayIso();

  const currentLocalTime = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

  const startCheckIn = (e: AgendaEvent, objective: string): boolean => {
    if (!navigator.onLine) { setSnack({severity:"error",msg:"Necesitas conexión para iniciar la visita."}); return false; }
    if (!OBJETIVOS_VISITA.some(o=>o.codigo===objective)) { setSnack({severity:"error",msg:"Selecciona el objetivo antes de iniciar Check-in."}); return false; }
    if (!canExecuteVisit(e)) return false;

    const open = events.find((x) => x.id !== e.id && x.status === "Check-in activo");
    if (open) {
      setSnack({ severity: "error", msg: `No puedes iniciar otra visita. Primero cierra la visita abierta con ${open.title}.` });
      setDetail({ event: open });
      return false;
    }

    const now = Date.now();
    const updated: AgendaEvent = {
      ...e,
      id: `execution-${now}`,
      plannedEventId: events.some(x=>x.id===e.id) ? e.id : undefined,
      executionCode: 'VISITA_INICIADA',
      origin: e.origin ?? 'planeada',
      time: currentLocalTime(),
      date: todayIso(),
      kind: "realized",
      status: "Check-in activo",
      objective,
      planned: e.origin === "no planeada" ? undefined : (e.planned ?? e.time),
      checkInAt: currentLocalTime(),
      checkInEpochMs: now,
      locationStatus: "En rango",
      modifiedBy: actorName(),
      modifiedAt: nowMx(),
    };
    updateEvents((evs) => [...evs.map((x) => x.id === e.id ? {...x,status:"Ejecutada"} : x), updated]);
    setDetail({ event: updated });
    setSnack({ severity: "success", msg: `Check-in registrado para ${e.title}.` });
    return true;
  };

  const completeCheckOut = (e: AgendaEvent, data: { objective: string; result: string; findings: string; productosNegados?:string; evidence?:{name:string;size:number}[]; numeroFactura?:string; folioPapeleta?:string }): string | null => {
    if (!navigator.onLine) return "Necesitas conexión para finalizar la visita.";
    if (role !== "advisor" || !events.some(x=>x.id===e.id && x.status==="Check-in activo")) return "La visita no está disponible para Check-out.";
    const check = validarCierreManual(data.objective,{resultado:data.result,numeroFactura:data.numeroFactura,folioPapeleta:data.folioPapeleta,clienteNoAtendio:data.result==="CLIENTE_NO_ATENDIO"});
    if (check) return check;

    const end = Date.now();
    const start = e.checkInEpochMs ?? end;
    const duration = Math.max(0.1, Math.round(((end - start) / 60000) * 10) / 10);
    const updated: AgendaEvent = {
      ...e,
      kind: "realized",
      status: "Check-out realizado",
      executionCode: "VISITA_REALIZADA",
      checkOutAt: currentLocalTime(),
      checkOutEpochMs: end,
      duration,
      objective: data.objective.trim(),
      result: resultadoDerivado(data.objective,{numeroFactura:data.numeroFactura,folioPapeleta:data.folioPapeleta,clienteNoAtendio:data.result==="CLIENTE_NO_ATENDIO"}) ?? data.result.trim(),
      numeroFactura:data.numeroFactura?.trim(),
      folioPapeleta:data.folioPapeleta?.trim(),
      findings: data.findings.trim(),
      productosNegados: data.productosNegados?.trim(),
      evidence: data.evidence,
      modifiedBy: actorName(),
      modifiedAt: nowMx(),
    };
    updateEvents((evs) => evs.map((x) => (x.id === e.id ? updated : x)));
    setDetail({ event: updated });
    setSnack({ severity: "success", msg: `Check-out registrado para ${e.title}. La visita quedó concluida.` });
    return null;
  };

  // ---------- visitas abiertas / soporte ----------
  const loadOpenVisitScenario = () => {
    const planned = events.find((e) => e.kind === "planned" && !e.absence) || events[0];
    const open: AgendaEvent = { id: `scenario-open-${Date.now()}`, title: planned?.title || "Cliente DUMMY", address: planned?.address || "Dirección DUMMY", time: "16:20", duration: 30, kind: "realized", status: "Check-in activo", planned: planned?.time || "16:00", scenario: true };
    updateEvents((evs) => [...evs.filter((e) => !(e.scenario && e.status === "Check-in activo")), open]);
    setScenarioMsg(`Escenario cargado: ${profile.label} tiene una visita con Check-in activo y sin Check-out. Mientras permanezca abierta, bloquea un nuevo Check-in.`);
  };
  const simulateDayClose = () => {
    const open = events.find((e) => e.kind === "realized" && e.status === "Check-in activo");
    if (!open) { setCloseResult({ type: "info", text: "No hay una visita abierta para simular el cierre automático." }); return; }
    if (detail.event?.id===open.id) setDetail({event:null});
    updateEvents((evs) => evs.map((e) => (e.id === open.id ? { ...e, status: "Cierre automático", executionCode: "VISITA_REALIZADA", duration: 10, automaticClose: true, checkOutAt: "22:00" } : e)));
    setCloseResult({ type: "ok", text: "Simulación: la visita permaneció abierta y fue cerrada automáticamente a las 22:00, hora de Ciudad de México, con duración excepcional de 10 minutos." });
  };

  const startFromClient = (client: Client) => {
    if (role !== 'advisor') return;
    const planned = events.find(e=>e.title===client[0] && e.address===client[1] && e.origin!=='no planeada' && canExecuteVisit(e));
    setDetail({event:planned ?? {id:`draft-${Date.now()}`,title:client[0],address:client[1],date:todayIso(),time:currentLocalTime(),duration:30,kind:'planned',status:'Programada',activityType:'visit',tipoEventoCodigo:'AGENDA',origin:'no planeada'}});
  };
  return {
    startFromClient, profiles, owner, setOwner, profile, events, clients, role, setRole, scope, setScope, managerCanEdit, setManagerCanEdit, detailVisibility, setDetailVisibility,
    view, setView, selectedDate, setSelectedDate, selectedGridSlot, setSelectedGridSlot, summaryFilter, setSummaryFilter, matches, summary, portfolioScope, setPortfolioScope, search, setSearch,
    canEdit, hideDetail, eventLabel, roleExplanation, visiblePortfolio, resolveNewVisitDrop,
    form, openForm, setFormCreationMode, openEdit, closeForm, saveEvent, detail, setDetail,
    cancelTarget, setCancelTarget, cancelEvent, canEditEvent, rescheduleEvent, canExecuteVisit, startCheckIn, completeCheckOut,
    scenarioMsg, loadOpenVisitScenario, closeResult, simulateDayClose, snack, setSnack, showGaps, setShowGaps,
  };
}

export type AgendaStore = ReturnType<typeof useAgendaState>;
const Ctx = createContext<AgendaStore | null>(null);
export const AgendaProvider = ({ children }: { children: React.ReactNode }) => <Ctx.Provider value={useAgendaState()}>{children}</Ctx.Provider>;
export const useAgenda = () => { const v = useContext(Ctx); if (!v) throw new Error("useAgenda fuera de AgendaProvider"); return v; };
