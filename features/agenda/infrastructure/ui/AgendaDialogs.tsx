"use client";
// Diálogos con la misma estructura que features/common/infrastructure/ui/dialog/ModalGeneric.tsx:
// título en mayúsculas, ícono de cierre, botón "Cerrar/Cancelar" outlined y acción principal contained.
import { useEffect, useState } from "react";
import { Alert, Autocomplete, Box, Button, Checkbox, FormControlLabel, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, MenuItem, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { ColorsEpico } from "@/features/common/domain/enums/ColorsEpico";
import { FontSizesEnum } from "@/features/common/domain/enums/FontSizes";
import { FontWeightEnum } from "@/features/common/domain/enums/FontWeight";
import { useAgenda } from "@/features/agenda/application/AgendaContext";
import { clientId, normalize } from "@/features/agenda/domain/agenda.data";
import { ActivityType } from "@/features/agenda/domain/agenda.types";
import { TIPOS_SELECCIONABLES, TIPOS_EVENTO, RESULTADOS_VISITA, OBJETIVOS_VISITA, resultadosSeleccionables, resultadoDerivado, validarCierreManual } from "@/src/lib/catalogosAgendaVisitas";
import { EpicoLabel, Hint, statusVariant } from "./shared";

const closeBtnSx = { borderRadius: "4px", minHeight: "32px", fontWeight: FontWeightEnum.Medium, color: ColorsEpico.ColorDarkCharcoal, borderColor: ColorsEpico.ColorGrayNeutral, fontSize: FontSizesEnum.Gamma };
const saveBtnSx = { borderRadius: "4px", minHeight: "32px", fontWeight: FontWeightEnum.Medium, background: ColorsEpico.ColorPrimary, fontSize: FontSizesEnum.Gamma };

const ButtonEdit = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="outlined"
    size="small"
    startIcon={<EditOutlinedIcon />}
    onClick={onClick}
    sx={{
      borderRadius: "4px",
      minHeight: "32px",
      fontWeight: FontWeightEnum.Medium,
      fontSize: FontSizesEnum.Gamma,
      textTransform: "none",
    }}
  >
    Editar
  </Button>
);

const destructiveBtnSx = {
  borderRadius: "4px",
  minHeight: "32px",
  fontWeight: FontWeightEnum.Medium,
  fontSize: FontSizesEnum.Gamma,
  textTransform: "none",
};

const activityTypeLabel = (type?: ActivityType) =>
  type === "promo" ? "Entrega de material promocional" :
  type === "internal" ? "Otra actividad" :
  "Visita a cliente";

type CreationSelectorValue = "event" | "unplanned";
const CreationTypeSelector = ({ value, onChange }: { value: CreationSelectorValue; onChange: (value: CreationSelectorValue) => void }) => (
  <TextField
    select
    fullWidth
    required
    size="small"
    label="Tipo de actividad"
    value={value}
    onChange={(e) => onChange(e.target.value as CreationSelectorValue)}
  >
    <MenuItem value="event">Evento</MenuItem>
    <MenuItem value="unplanned">Visita no planeada</MenuItem>
  </TextField>
);

const EpicoDialog = ({ open, title, onClose, children, actions, maxWidth = "sm" }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; actions: React.ReactNode; maxWidth?: "xs" | "sm" | "md" }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog fullWidth fullScreen={fullScreen} open={open} onClose={onClose} maxWidth={maxWidth} transitionDuration={{ exit: 0 }}>
      <DialogTitle sx={{ mr: 4 }}>
        <Typography sx={{ fontSize: { xs: "1rem", sm: FontSizesEnum.Beta }, fontWeight: FontWeightEnum.Medium }}>{title.toUpperCase()}</Typography>
      </DialogTitle>
      <IconButton size="small" aria-label="close" onClick={onClose} sx={{ top: 12, right: 10, position: "absolute", color: ColorsEpico.ColorDarkCharcoal }}><CloseIcon /></IconButton>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={fullScreen ? { position: "sticky", bottom: 0, bgcolor: ColorsEpico.ColorWhite, gap: 1, "& > button": { flex: 1, minHeight: "44px !important", m: "0 !important" } } : undefined}>{actions}</DialogActions>
    </Dialog>
  );
};

const Fact = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box sx={{ my: 1 }}>
    <Typography fontSize={FontSizesEnum.Epsilon} fontWeight={FontWeightEnum.Bold} color={ColorsEpico.ColorDarkCharcoal}>{label}</Typography>
    <Typography fontSize={FontSizesEnum.Delta} color={ColorsEpico.ColorBlack60}>{value}</Typography>
  </Box>
);

export const EventDetailDialog = () => {
  const a = useAgenda();
  const e = a.detail.event;
  const [objective, setObjective] = useState("");
  const [result, setResult] = useState("");
  const [findings, setFindings] = useState("");
  const [productosNegados, setProductosNegados] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [folioPapeleta, setFolioPapeleta] = useState("");
  const [evidence, setEvidence] = useState<{name:string;size:number}[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [evidenceError, setEvidenceError] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  useEffect(() => {
    setObjective(e?.objective ?? "");
    setResult(e?.result ?? "");
    setFindings(e?.findings ?? "");
    setNumeroFactura(e?.numeroFactura ?? "");
    setFolioPapeleta(e?.folioPapeleta ?? "");
    setCheckoutError(null);
    setProductosNegados(e?.productosNegados ?? "");
    setEvidence(e?.evidence ?? []);
    setReviewing(false);
    setEvidenceError("");
  }, [e?.id, e?.status]);
  if (!e) return null;
  const close = () => a.setDetail({ event: null });
  if (a.hideDetail) {
    return (
      <EpicoDialog open title="Ocupado" onClose={close} actions={<Button variant="outlined" onClick={close} sx={closeBtnSx}>Cerrar</Button>}>
        <EpicoLabel variant="eta">Disponibilidad</EpicoLabel>
        <Fact label="Horario" value={`${e.time} · ${e.duration} min`} />
        <Fact label="Detalle" value="No visible con el alcance/perfil simulado." />
      </EpicoDialog>
    );
  }
  const editable = a.canEditEvent(e);
  const canCheckIn = a.canExecuteVisit(e);
  const canCheckOut = a.role === "advisor" && e.status === "Check-in activo";
  const doCheckOut = () => {
    const error = validarCierreManual(objective, {resultado: result,numeroFactura,folioPapeleta,clienteNoAtendio:result==="CLIENTE_NO_ATENDIO"});
    if (error) { setCheckoutError(error); setReviewing(false); return; }
    setCheckoutError(a.completeCheckOut(e, { objective, productosNegados, evidence, result: resultadoDerivado(objective,{numeroFactura,folioPapeleta,clienteNoAtendio:result==="CLIENTE_NO_ATENDIO"}) ?? result, findings, numeroFactura, folioPapeleta }));
  };
  const attachFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = ["image/jpeg","image/png","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    const valid = Array.from(files).filter(file => accepted.includes(file.type) && file.size <= (file.type.startsWith("image/") ? 10 : 20)*1024*1024);
    if (evidence.length+valid.length>10) {setEvidenceError('Puedes adjuntar hasta 10 archivos por visita.');return;}
    setEvidence(prev => [...prev,...valid.map(file=>({name:file.name,size:file.size}))]);
    setEvidenceError(valid.length===files.length?"":"Algunos archivos no se agregaron. Formatos propuestos: JPG, PNG, PDF, Word y Excel (imágenes hasta 10 MB, documentos hasta 20 MB).");
  };
  return (
    <EpicoDialog
      open
      title={e.title}
      onClose={close}
      maxWidth="sm"
      actions={
        <Stack direction={{xs:"column",sm:"row"}} gap={1} alignItems="stretch" justifyContent="space-between" sx={{ width: "100%", "& button": {minHeight:44}, "& > div > button": {width:{xs:"100%",sm:"auto"}} }}>
          <Button variant="outlined" onClick={close} sx={closeBtnSx}>Cancelar</Button>
          <Box>
            {canCheckIn && <Button variant="contained" onClick={() => { if (!objective) { setCheckoutError("Selecciona el objetivo de la visita antes de iniciar."); return; } setCheckoutError(null); a.startCheckIn(e,objective); }} sx={saveBtnSx}>Iniciar Check-in</Button>}
            {canCheckOut && <Button variant="contained" onClick={() => { if (reviewing) doCheckOut(); else {setCheckoutError(null);setReviewing(true);} }} sx={saveBtnSx}>{reviewing ? "Confirmar Check-out" : "Revisar y finalizar"}</Button>}
          </Box>
        </Stack>
      }
    >
      {a.detail.visitNowCreated && (
        <Alert severity="info" variant="outlined" sx={{ mb: 1.5, fontSize: FontSizesEnum.Epsilon }}>
          <b>Visita no planeada:</b> selecciona el objetivo e inicia la visita. Se conserva su origen para seguimiento.
        </Alert>
      )}
      <Stack direction="row" gap={1} flexWrap="wrap">
        <EpicoLabel variant={e.kind === "planned" ? "info" : "success"}>{e.kind === "planned" ? "Planeado" : "Ejecutado"}</EpicoLabel>
        <EpicoLabel variant={statusVariant(e.status)}>{e.status}</EpicoLabel>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1.5} sx={{ mt: 2 }}>
        <Box>
          <Typography fontSize={FontSizesEnum.Epsilon} fontWeight={FontWeightEnum.Bold} color={ColorsEpico.ColorDarkCharcoal}>Tipo de visita</Typography>
          <Typography fontSize={FontSizesEnum.Delta} color={ColorsEpico.ColorBlack60}>{TIPOS_EVENTO.find(t=>t.codigo===e.tipoEventoCodigo)?.nombre ?? activityTypeLabel(e.activityType)}</Typography>
        </Box>
        {editable && (
          <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
            <ButtonEdit onClick={() => a.openEdit(e)} />
            <Button variant="outlined" color="error" onClick={() => a.setCancelTarget(e)} sx={destructiveBtnSx}>Cancelar evento</Button>
          </Stack>
        )}
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2, mt: 1 }}>
        <Fact label="Dirección" value={e.address} />
        <Fact label={`Hora ${e.kind === "planned" ? "programada" : "real"}`} value={`${e.time} · ${e.duration} min`} />
        {e.planned && <Fact label="Hora originalmente programada" value={e.planned} />}
        <Fact label="Origen" value={e.origin ?? "planeada"} />
        <Fact label="Creado por" value={e.createdBy || a.profile.label} />
        <Fact label="Fecha / hora de creación" value={e.createdAt || "22/09/2026 · 07:45 · DUMMY"} />
        {e.modifiedBy && <Fact label="Última modificación" value={`${e.modifiedBy} · ${e.modifiedAt}`} />}
        {e.quote && <Fact label="Cotización relacionada" value={e.quote} />}
      </Box>
      {e.description && <Fact label="Detalle" value={e.description} />}

      {(canCheckIn || e.status === "Check-in activo") && (
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${ColorsEpico.ColorLightBlueishGray}` }}>
          <Typography fontSize={FontSizesEnum.Delta} fontWeight={FontWeightEnum.Bold} sx={{ mb: 0.5 }}>{canCheckIn ? "Iniciar visita" : "Visita en curso"}</Typography>
          <Hint>{canCheckIn ? "Selecciona el objetivo antes de iniciar Check-in." : "Al finalizar, registra el resultado. Los hallazgos y productos negados son opcionales."}</Hint>
          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Objetivo de la visita"
              select
              value={objective}
              onChange={(x) => {setObjective(x.target.value);setResult("");setNumeroFactura("");setFolioPapeleta("");}}
              disabled={!canCheckIn}
            >
              {OBJETIVOS_VISITA.map(item=><MenuItem key={item.codigo} value={item.codigo}>{item.nombre}</MenuItem>)}
            </TextField>
            {!canCheckIn && <>
              {(objective==='COBRANZA'||objective==='GARANTIA_Y_DEVOLUCIONES') ? <FormControlLabel control={<Checkbox checked={result==='CLIENTE_NO_ATENDIO'} onChange={ev=>{setResult(ev.target.checked?'CLIENTE_NO_ATENDIO':'');setNumeroFactura('');setFolioPapeleta('');}} />} label="Cliente no atendió" /> : <TextField fullWidth select required size="small" label="Resultado de la visita"
                value={result} onChange={ev=>{setResult(ev.target.value);if(ev.target.value==="CLIENTE_NO_ATENDIO"){setNumeroFactura("");setFolioPapeleta("");}}}>
                {resultadosSeleccionables(objective).map(item=><MenuItem key={item.codigo} value={item.codigo}>{item.nombre}</MenuItem>)}

              </TextField>}
              {result!=="CLIENTE_NO_ATENDIO" && objective==="COBRANZA" && <TextField fullWidth required size="small" label="Número de factura pagada" value={numeroFactura} onChange={ev=>setNumeroFactura(ev.target.value)} />}
              {result!=="CLIENTE_NO_ATENDIO" && objective==="GARANTIA_Y_DEVOLUCIONES" && <TextField fullWidth required size="small" label="Folio de papeleta" value={folioPapeleta} onChange={ev=>setFolioPapeleta(ev.target.value)} />}
              {(objective==="COBRANZA"||objective==="GARANTIA_Y_DEVOLUCIONES") && (numeroFactura.trim()||folioPapeleta.trim()) && <Alert severity="info">Resultado automático: Cliente atendió</Alert>}
            </>}
            {!canCheckIn && <TextField
              fullWidth
              multiline
              minRows={2}
              size="small"
              label="Hallazgos / notas"
              placeholder="Opcional"
              value={findings}
              onChange={(x) => setFindings(x.target.value)}
            />}
            {!canCheckIn && ['PRESENTACION_PROPUESTA_COMERCIAL','VISITA_SERVICIO_SEGUIMIENTO'].includes(objective) && <TextField fullWidth multiline minRows={2} size="small" label="Productos negados" helperText="Opcional · registra los productos que el cliente solicitó y no se pudieron surtir." value={productosNegados} onChange={ev=>setProductosNegados(ev.target.value)} />}
            {!canCheckIn && <Box sx={{p:1.5,border:"1px solid",borderColor:"divider",borderRadius:1}}>
              <Typography fontWeight={FontWeightEnum.Bold} fontSize={FontSizesEnum.Delta}>Evidencias de la visita (opcional · máximo 10)</Typography>
              <Typography fontSize={FontSizesEnum.Epsilon} color="text.secondary" sx={{my:1}}>Puedes agregarlas durante la visita. En este simulador se muestran los nombres, pero no se almacenan ni se envían.</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <Button component="label" variant="outlined" size="small">Tomar foto<input hidden type="file" accept="image/*" capture="environment" onChange={ev=>{attachFiles(ev.target.files);ev.target.value="";}} /></Button>
                <Button component="label" variant="outlined" size="small">Galería<input hidden type="file" accept="image/jpeg,image/png" multiple onChange={ev=>{attachFiles(ev.target.files);ev.target.value="";}} /></Button>
                <Button component="label" variant="outlined" size="small">Adjuntar archivo<input hidden type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx" multiple onChange={ev=>{attachFiles(ev.target.files);ev.target.value="";}} /></Button>
              </Stack>
              {evidenceError && <Alert severity="warning" sx={{mt:1}}>{evidenceError}</Alert>}
              {evidence.map((file,index)=><Stack key={index} direction="row" alignItems="center" justifyContent="space-between" sx={{mt:1,p:.7,bgcolor:"action.hover",borderRadius:1}}>
                <Typography fontSize={FontSizesEnum.Epsilon} sx={{overflowWrap:"anywhere"}}>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</Typography>
                <Button size="small" color="error" onClick={()=>setEvidence(old=>old.filter((_,i)=>i!==index))}>Quitar</Button>
              </Stack>)}
            </Box>}
            {reviewing && <Alert severity="info" variant="outlined">
              <b>Revisar y finalizar:</b> confirma los datos antes del Check-out.
              <Box>Objetivo: {OBJETIVOS_VISITA.find(o=>o.codigo===objective)?.nombre || "Sin capturar"}</Box>
              <Box>Resultado: {RESULTADOS_VISITA.find(r=>r.codigo===(resultadoDerivado(objective,{numeroFactura,folioPapeleta,clienteNoAtendio:result==="CLIENTE_NO_ATENDIO"}) || result))?.nombre || "Sin capturar"}</Box>
              {numeroFactura && <Box>Factura: {numeroFactura}</Box>}
              {folioPapeleta && <Box>Papeleta: {folioPapeleta}</Box>}
              <Box>Hallazgos: {findings || "Sin notas"}</Box>
              <Box>Evidencias: {evidence.length} archivo(s) seleccionados.</Box>
              <Button size="small" onClick={()=>setReviewing(false)}>Volver a editar</Button>
            </Alert>}
            {checkoutError && <Alert severity="error" variant="outlined">{checkoutError}</Alert>}
          </Stack>
        </Box>
      )}

      {['Check-out realizado','Cierre automático'].includes(e.status) && <Box sx={{mt:2}}>
        <Fact label="Objetivo" value={OBJETIVOS_VISITA.find(o=>o.codigo===e.objective)?.nombre ?? 'Sin capturar'} />
        <Fact label="Resultado" value={RESULTADOS_VISITA.find(r=>r.codigo===e.result)?.nombre ?? 'Sin capturar'} />
        {e.numeroFactura && <Fact label="Factura pagada" value={e.numeroFactura} />}
        {e.folioPapeleta && <Fact label="Folio de papeleta" value={e.folioPapeleta} />}
        <Fact label="Hallazgos" value={e.findings || 'Sin notas'} />
        {e.productosNegados && <Fact label="Productos negados" value={e.productosNegados} />}
        {e.evidence?.map((file,i)=><Fact key={i} label="Evidencia (nombre de archivo simulado)" value={file.name} />)}
      </Box>}
      {e.cancelReason && <Fact label="Motivo de cancelación" value={e.cancelReason} />}
      {(e.checkInAt || e.checkOutAt) && (
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${ColorsEpico.ColorLightBlueishGray}` }}>
          <Typography fontSize={FontSizesEnum.Delta} fontWeight={FontWeightEnum.Bold}>Ejecución</Typography>
          {e.checkInAt && <Fact label="Check-in" value={e.checkInAt} />}
          {e.checkOutAt && <Fact label="Check-out" value={e.checkOutAt} />}
          {["Check-out realizado","Cierre automático"].includes(e.status) && <Fact label="Duración real" value={`${e.duration} min`} />}
          {e.automaticClose && <EpicoLabel variant="eta">Cierre automático</EpicoLabel>}
        </Box>
      )}
    </EpicoDialog>
  );
};

export const EventFormDialog = () => {
  const a = useAgenda();
  const f = a.form;
  const [v, setV] = useState({ tipoEventoCodigo: "AGENDA", type: "visit" as ActivityType, client: "", address: "", date: "2026-09-22", time: "10:30", duration: "30", quote: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [clientQuery, setClientQuery] = useState("");
  useEffect(() => {
    if (!f.open) return;
    const editing = f.editingId != null ? a.events.find((x) => x.id === f.editingId) : undefined;
    const firstPortfolio = a.visiblePortfolio[0];
    const initialClient = f.client ?? editing?.title ?? firstPortfolio?.[0] ?? "";
    const initialAddress = f.address ?? editing?.address ?? a.visiblePortfolio.find((x) => x[0] === initialClient)?.[1] ?? firstPortfolio?.[1] ?? "";
    setV({
      tipoEventoCodigo: editing?.tipoEventoCodigo ?? (editing?.activityType==="internal" ? "TRASLADO" : "AGENDA"), type: editing?.activityType ?? "visit", client: initialClient, address: initialAddress, date: f.date ?? editing?.date ?? new Date().toLocaleDateString("sv-SE"),
      time: f.time ?? "10:30", duration: String(editing?.duration ?? 30), quote: editing?.quote ?? "", description: editing?.description ?? "",
    });
    setClientQuery(initialClient);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.seed]);
  const clientOptions = Array.from(new Set(a.visiblePortfolio.map((x) => x[0])));
  const matchingClients = clientQuery.trim().length < 3
    ? []
    : clientOptions.filter((name) => {
        const q = normalize(clientQuery.trim());
        const related = a.visiblePortfolio.filter((x) => x[0] === name);
        return normalize(name).includes(q)
          || (related[0] ? normalize(clientId(related[0])).includes(q) : false)
          || related.some((x) => normalize(x[1]).includes(q));
      });
  const addresses = Array.from(new Set(a.visiblePortfolio.filter((x) => x[0] === v.client).map((x) => x[1])));
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const config = TIPOS_SELECCIONABLES.find(t=>t.codigo===v.tipoEventoCodigo);
  const save = () => setError(a.saveEvent({ ...v, duration: Number(v.duration) }));
  const creationMode: CreationSelectorValue = f.creationMode ?? (f.startAfterCreate ? "unplanned" : "event");
  const changeCreationMode = (next: CreationSelectorValue) => {
    setError(null);
    a.setFormCreationMode(next);
    if (next === "unplanned") setV((current) => ({ ...current, type: "visit", tipoEventoCodigo:"AGENDA" }));
  };

  return (
    <EpicoDialog open={f.open} title={f.editingId != null ? f.title : "Crear actividad"} onClose={a.closeForm}
      actions={<><Button variant="outlined" onClick={a.closeForm} sx={closeBtnSx}>Cancelar</Button><Button variant="contained" onClick={save} sx={saveBtnSx}>Guardar actividad</Button></>}>
      <Stack spacing={2}>
        {f.editingId == null && <CreationTypeSelector value={creationMode} onChange={changeCreationMode} />}
        {creationMode !== "unplanned" && (
          <Box>
            <TextField select fullWidth size="small" label="Tipo de evento" value={v.tipoEventoCodigo} onChange={e=>{const c=TIPOS_SELECCIONABLES.find(t=>t.codigo===e.target.value)!;setV(p=>({...p,tipoEventoCodigo:c.codigo,type:c.esVisita?"visit":"internal"}));}}>
              {TIPOS_SELECCIONABLES.map(t=><MenuItem key={t.codigo} value={t.codigo}>{t.nombre}</MenuItem>)}
            </TextField>

          </Box>
        )}
        {config?.requiereCliente && (
          <Box>
            <Autocomplete
              fullWidth
              size="small"
              options={matchingClients}
              value={clientOptions.includes(v.client) ? v.client : null}
              inputValue={clientQuery}
              onInputChange={(_, value, reason) => {
                if (reason !== "reset") setClientQuery(value);
              }}
              onChange={(_, value) => {
                const nextClient = value ?? "";
                const nextAddress = a.visiblePortfolio.find((x) => x[0] === nextClient)?.[1] ?? "";
                setV((p) => ({ ...p, client: nextClient, address: nextAddress }));
                setClientQuery(value ?? "");
              }}
              filterOptions={(options) => options}
              noOptionsText={clientQuery.trim().length < 3 ? "Escribe al menos 3 caracteres para buscar." : "No encontramos clientes o direcciones dentro de tu alcance con ese criterio."}
              getOptionLabel={(option) => option}
              renderOption={(props, option) => {
                const sample = a.visiblePortfolio.find((x) => x[0] === option);
                return (
                  <li {...props} key={option}>
                    <Box>
                      <Typography fontSize={FontSizesEnum.Delta} fontWeight={FontWeightEnum.Medium}>{option}</Typography>
                      <Typography fontSize={FontSizesEnum.Omega} color={ColorsEpico.ColorBlack60}>
                        {sample ? clientId(sample) : "CLI-DUMMY"}{sample ? ` · ${sample[1]}` : ""}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar cliente"
                  placeholder="ClienteID, razón social o dirección"
                  required
                  helperText="Selecciona un cliente de tu cartera. Busca desde 3 caracteres por ClienteID, razón social o dirección."
                />
              )}
            />
          </Box>
        )}
        {config?.requiereDireccion && (
          <TextField
            select
            fullWidth
            size="small"
            label="Dirección"
            value={v.address}
            onChange={set("address")}
            disabled={!v.client}
            helperText={v.client && addresses.length > 1 ? "Selecciona la dirección que corresponde a la visita." : undefined}
          >
            {addresses.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        )}
        <Stack direction={{xs:"column",sm:"row"}} spacing={2}>
          <TextField fullWidth size="small" type="date" label="Fecha" value={v.date} onChange={set("date")} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField fullWidth size="small" type="time" label="Hora" value={v.time} onChange={set("time")} slotProps={{ inputLabel: { shrink: true } }} />
        </Stack>
        <Stack direction={{xs:"column",sm:"row"}} spacing={2}>
          <TextField fullWidth size="small" type="number" label="Duración estimada (min)" value={v.duration} onChange={set("duration")} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
          <TextField fullWidth size="small" label="Cotización relacionada" placeholder="Opcional · COT-000123" value={v.quote} onChange={set("quote")} />
        </Stack>
        <TextField fullWidth size="small" multiline minRows={2} label="Descripción / detalle" placeholder="Información relevante" value={v.description} onChange={set("description")} />
        {error && <Alert severity="error" variant="outlined">{error}</Alert>}
      </Stack>
    </EpicoDialog>
  );
};

/** Reemplaza el prompt() del simulador por un diálogo con motivo obligatorio. */
export const CancelEventDialog = () => {
  const a = useAgenda();
  const [reason, setReason] = useState("");
  useEffect(() => { setReason(""); }, [a.cancelTarget]);
  const e = a.cancelTarget;
  if (!e) return null;
  return (
    <EpicoDialog open maxWidth="xs" title="Cancelar evento" onClose={() => a.setCancelTarget(null)}
      actions={<><Button variant="outlined" onClick={() => a.setCancelTarget(null)} sx={closeBtnSx}>Volver</Button><Button variant="contained" color="error" disabled={!reason.trim()} onClick={() => a.cancelEvent(e, reason.trim())} sx={{ borderRadius: "4px", fontWeight: FontWeightEnum.Medium }}>Cancelar evento</Button></>}>
      <Typography fontSize={FontSizesEnum.Delta} sx={{ mb: 2 }}>{e.title} · {e.time}</Typography>
      <TextField autoFocus fullWidth size="small" multiline minRows={2} required label="Motivo obligatorio de cancelación" value={reason} onChange={(x) => setReason(x.target.value)} />
    </EpicoDialog>
  );
};
