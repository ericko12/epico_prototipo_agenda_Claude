"use client";
// Diálogos con la misma estructura que features/common/infrastructure/ui/dialog/ModalGeneric.tsx:
// título en mayúsculas, ícono de cierre, botón "Cerrar/Cancelar" outlined y acción principal contained.
import { useEffect, useState } from "react";
import { Alert, Autocomplete, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ColorsEpico } from "@/features/common/domain/enums/ColorsEpico";
import { FontSizesEnum } from "@/features/common/domain/enums/FontSizes";
import { FontWeightEnum } from "@/features/common/domain/enums/FontWeight";
import { useAgenda } from "@/features/agenda/application/AgendaContext";
import { clientId, normalize } from "@/features/agenda/domain/agenda.data";
import { ActivityType } from "@/features/agenda/domain/agenda.types";
import { EpicoLabel, Hint, statusVariant } from "./shared";

const closeBtnSx = { borderRadius: "4px", minHeight: "32px", fontWeight: FontWeightEnum.Medium, color: ColorsEpico.ColorDarkCharcoal, borderColor: ColorsEpico.ColorGrayNeutral, fontSize: FontSizesEnum.Gamma };
const saveBtnSx = { borderRadius: "4px", minHeight: "32px", fontWeight: FontWeightEnum.Medium, background: ColorsEpico.ColorPrimary, fontSize: FontSizesEnum.Gamma };

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
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  useEffect(() => {
    setObjective(e?.objective ?? "");
    setResult(e?.result ?? "");
    setFindings(e?.findings ?? "");
    setCheckoutError(null);
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
  const doCheckOut = () => setCheckoutError(a.completeCheckOut(e, { objective, result, findings }));
  return (
    <EpicoDialog
      open
      title={e.title}
      onClose={close}
      maxWidth="sm"
      actions={
        <>
          {editable && <Button variant="outlined" color="error" onClick={() => a.setCancelTarget(e)} sx={{ ...closeBtnSx, color: undefined, borderColor: undefined, mr: "auto" }}>Cancelar evento</Button>}
          <Button variant="outlined" onClick={close} sx={closeBtnSx}>Cerrar</Button>
          {editable && <Button variant="contained" onClick={() => a.openEdit(e)} sx={saveBtnSx}>Editar / reprogramar</Button>}
          {canCheckIn && <Button variant="contained" onClick={() => a.startCheckIn(e)} sx={saveBtnSx}>Iniciar Check-in</Button>}
          {canCheckOut && <Button variant="contained" onClick={doCheckOut} sx={saveBtnSx}>Realizar Check-out</Button>}
        </>
      }
    >
      {a.detail.visitNowCreated && (
        <Alert severity="info" variant="outlined" sx={{ mb: 1.5, fontSize: FontSizesEnum.Epsilon }}>
          <b>Flujo validado:</b> la visita no planeada ya tiene un evento de Agenda. El siguiente paso es iniciar Check-in sobre este evento; no se crea una visita huérfana.
        </Alert>
      )}
      <Stack direction="row" gap={1} flexWrap="wrap">
        <EpicoLabel variant={e.kind === "planned" ? "info" : "success"}>{e.kind === "planned" ? "Planeado" : "Ejecutado"}</EpicoLabel>
        <EpicoLabel variant={statusVariant(e.status)}>{e.status}</EpicoLabel>
        {e.routeSuggested && <EpicoLabel variant="eta">Ruta sugerida</EpicoLabel>}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2, mt: 1 }}>
        <Fact label="Dirección" value={e.address} />
        <Fact label={`Hora ${e.kind === "planned" ? "programada" : "real"}`} value={`${e.time} · ${e.duration} min`} />
        {e.planned && <Fact label="Hora originalmente programada" value={e.planned} />}
        {e.requiresEvidence && <Fact label="Evidencia" value="Requerida al completar" />}
        <Fact label="Creado por" value={e.createdBy || a.profile.label} />
        <Fact label="Fecha / hora de creación" value={e.createdAt || "22/09/2026 · 07:45 · DUMMY"} />
        {e.modifiedBy && <Fact label="Última modificación" value={`${e.modifiedBy} · ${e.modifiedAt}`} />}
        {e.quote && <Fact label="Cotización relacionada" value={e.quote} />}
      </Box>
      {e.description && <Fact label="Detalle" value={e.description} />}

      {e.status === "Check-in activo" && (
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${ColorsEpico.ColorLightBlueishGray}` }}>
          <Typography fontSize={FontSizesEnum.Delta} fontWeight={FontWeightEnum.Bold} sx={{ mb: 0.5 }}>Visita en curso</Typography>
          <Hint>El Check-in ya fue registrado. Para cerrar la visita, captura objetivo y resultado. El prototipo no carga opciones dummy mientras negocio confirma el catálogo definitivo para estos campos.</Hint>
          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Objetivo de la visita"
              placeholder="Captura el objetivo de la visita"
              value={objective}
              onChange={(x) => setObjective(x.target.value)}
            />
            <TextField
              fullWidth
              required
              size="small"
              label="Resultado de la visita"
              placeholder="Captura el resultado de la visita"
              value={result}
              onChange={(x) => setResult(x.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              size="small"
              label="Hallazgos / notas"
              placeholder="Opcional"
              value={findings}
              onChange={(x) => setFindings(x.target.value)}
            />
            {checkoutError && <Alert severity="error" variant="outlined">{checkoutError}</Alert>}
          </Stack>
        </Box>
      )}

      {(e.checkInAt || e.checkOutAt) && (
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${ColorsEpico.ColorLightBlueishGray}` }}>
          <Typography fontSize={FontSizesEnum.Delta} fontWeight={FontWeightEnum.Bold}>Ejecución</Typography>
          {e.checkInAt && <Fact label="Check-in" value={e.checkInAt} />}
          {e.checkOutAt && <Fact label="Check-out" value={e.checkOutAt} />}
          {e.status === "Check-out realizado" && <Fact label="Duración real" value={`${e.duration} min`} />}
          {e.automaticClose && <EpicoLabel variant="eta">Cierre automático</EpicoLabel>}
        </Box>
      )}
    </EpicoDialog>
  );
};

export const EventFormDialog = () => {
  const a = useAgenda();
  const f = a.form;
  const [v, setV] = useState({ type: "visit" as ActivityType, client: "", address: "", date: "2026-09-22", time: "10:30", duration: "30", quote: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [clientQuery, setClientQuery] = useState("");
  useEffect(() => {
    if (!f.open) return;
    const editing = f.editingId != null ? a.events.find((x) => x.id === f.editingId) : undefined;
    const firstPortfolio = a.visiblePortfolio[0];
    const initialClient = f.client ?? editing?.title ?? firstPortfolio?.[0] ?? "";
    const initialAddress = f.address ?? editing?.address ?? a.visiblePortfolio.find((x) => x[0] === initialClient)?.[1] ?? firstPortfolio?.[1] ?? "";
    setV({
      type: editing?.activityType ?? "visit", client: initialClient, address: initialAddress, date: editing?.date ?? "2026-09-22",
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
  const save = () => setError(a.saveEvent({ ...v, duration: Number(v.duration) }));

  return (
    <EpicoDialog open={f.open} title={f.title} onClose={a.closeForm}
      actions={<><Button variant="outlined" onClick={a.closeForm} sx={closeBtnSx}>Cancelar</Button><Button variant="contained" onClick={save} sx={saveBtnSx}>Guardar actividad</Button></>}>
      <Typography fontSize={FontSizesEnum.Delta} color={ColorsEpico.ColorBlack60} sx={{ mb: 2 }}>Selecciona un cliente de tu cartera o captura la actividad.</Typography>
      <Stack spacing={2}>
        <Box>
          <TextField select fullWidth size="small" label="Tipo" value={v.type} onChange={set("type")}>
            <MenuItem value="visit">Visita a cliente</MenuItem>
            <MenuItem value="promo">Entrega de material promocional</MenuItem>
            <MenuItem value="internal">Otra actividad</MenuItem>
          </TextField>
          {v.type === "promo" && <Hint sx={{ mt: 0.5 }}>Este tipo requiere evidencia al completarse. La evidencia se adjunta en la ejecución/resultado, no en la planeación.</Hint>}
          <Hint sx={{ mt: 0.5 }}>Tipos ilustrativos del catálogo inicial compartido. La configuración avanzada queda fuera del MVP.</Hint>
        </Box>
        {v.type === "visit" && (
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
              noOptionsText={clientQuery.trim().length < 3 ? "Escribe al menos 3 caracteres" : "No hay clientes visibles con ese criterio"}
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
                  helperText="Busca desde 3 caracteres dentro de la cartera visible."
                />
              )}
            />
          </Box>
        )}
        {v.type === "visit" && (
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
        <Stack direction="row" spacing={2}>
          <TextField fullWidth size="small" type="date" label="Fecha" value={v.date} onChange={set("date")} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField fullWidth size="small" type="time" label="Hora" value={v.time} onChange={set("time")} slotProps={{ inputLabel: { shrink: true } }} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField fullWidth size="small" type="number" label="Duración estimada (min)" value={v.duration} onChange={set("duration")} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
          <TextField fullWidth size="small" label="Cotización relacionada" placeholder="Opcional · COT-000123" value={v.quote} onChange={set("quote")} />
        </Stack>
        <TextField fullWidth size="small" multiline minRows={2} label="Descripción / detalle" placeholder="Información relevante" value={v.description} onChange={set("description")} />
        {error && <Alert severity="error" variant="outlined">{error}</Alert>}
      </Stack>
    </EpicoDialog>
  );
};

export const TaskFormDialog = () => {
  const a = useAgenda();
  const init = { subject: "", detail: "", client: "Sin cliente", due: "2026-09-23", owner: "Luis Galvan", origin: "Manual", requiresEvidence: false };
  const [v, setV] = useState(init);
  useEffect(() => { if (a.taskFormOpen) setV(init); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.taskFormOpen]);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const close = () => a.setTaskFormOpen(false);
  return (
    <EpicoDialog open={a.taskFormOpen} title="Nueva tarea" onClose={close}
      actions={<><Button variant="outlined" onClick={close} sx={closeBtnSx}>Cancelar</Button><Button variant="contained" disabled={!v.subject.trim()} onClick={() => a.addTask(v)} sx={saveBtnSx}>Crear tarea</Button></>}>
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TextField fullWidth size="small" required label="Asunto" placeholder="Ej. Enviar cotización solicitada" value={v.subject} onChange={set("subject")} />
        <TextField fullWidth size="small" multiline minRows={3} label="Detalle / descripción" placeholder="Describe qué debe realizarse" value={v.detail} onChange={set("detail")} />
        <Stack direction="row" spacing={2}>
          <TextField select fullWidth size="small" label="Cliente relacionado" value={v.client} onChange={set("client")}>{["Sin cliente", "Refaccionaria El Volante", "Autopartes del Bajío", "Frenos Lara"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField>
          <TextField fullWidth size="small" type="date" label="Fecha límite" value={v.due} onChange={set("due")} slotProps={{ inputLabel: { shrink: true } }} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField select fullWidth size="small" label="Responsable" value={v.owner} onChange={set("owner")}>{["Luis Galvan", "Equipo Operaciones", "Gerente"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField>
          <TextField select fullWidth size="small" label="Origen" value={v.origin} onChange={set("origin")}>{["Manual", "Visita", "Proceso"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField>
        </Stack>
        <Box>
          <FormControlLabel control={<Checkbox size="small" checked={v.requiresEvidence} onChange={(e) => setV((p) => ({ ...p, requiresEvidence: e.target.checked }))} />} label={<Typography fontSize={FontSizesEnum.Delta}>Requerir evidencia al completar</Typography>} />
          <Hint>Si se marca, la tarea deberá tener foto o archivo antes de completarse. La regla definitiva se validará en la SPEC de Tareas.</Hint>
        </Box>
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
