"use client";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Checkbox, Divider, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { ArrowDownward, ArrowUpward, Close, DragIndicator, ExpandMore, Search } from "@mui/icons-material";
import { ColorsEpico } from "@/features/common/domain/enums/ColorsEpico";
import { FontSizesEnum } from "@/features/common/domain/enums/FontSizes";
import { FontWeightEnum } from "@/features/common/domain/enums/FontWeight";
import { useAgenda } from "@/features/agenda/application/AgendaContext";
import { clientId, clientKey, normalize } from "@/features/agenda/domain/agenda.data";
import { AGENDA_COLORS, GapMarker, Hint, SectionTitle } from "./shared";

const outlinedBtn = { borderRadius: "4px", fontWeight: FontWeightEnum.Medium, color: ColorsEpico.ColorDarkCharcoal, borderColor: ColorsEpico.ColorGrayNeutral };

const Portfolio = () => {
  const a = useAgenda();
  const q = normalize(a.search);
  const list = a.visiblePortfolio.filter((c) => (q.length === 0 || q.length >= 3) && normalize(`${clientId(c)} ${c[0]} ${c[1]}`).includes(q));
  return (
    <GapMarker label="Arrastrar cliente al calendario: no existe en Épico (patrón nuevo)">
      <Box sx={{ mt: 1, pt: { xs: 0, md: a.showGaps ? 5 : 0 } }}>
        {list.length === 0 && <Hint>{q.length > 0 && q.length < 3 ? "Escribe al menos 3 caracteres." : "No se encontraron clientes con ese criterio."}</Hint>}
        {list.map((c) => {
          const key = clientKey(c);
          return (
            <Stack key={key + (c[4] ?? "")} direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.75 }}>
              <Checkbox size="small" checked={a.routeSel.includes(key)} disabled={!a.canEdit} onChange={() => a.toggleRouteSel(key)} inputProps={{ "aria-label": "Seleccionar para ruta" }} sx={{ p: 0.5 }} />
              <Box
                draggable={a.canEdit}
                onDragStart={(e) => { e.dataTransfer.setData("application/json", JSON.stringify({ name: c[0], address: c[1] })); e.dataTransfer.effectAllowed = "copy"; }}
                onClick={() => a.canEdit && a.openForm({ client: c[0], address: c[1] })}
                sx={{
                  flex: 1, minWidth: 0, display: "flex", gap: 0.5, alignItems: "flex-start", p: 1, borderRadius: "8px", border: `1px solid ${ColorsEpico.ColorLightBlueishGray}`,
                  cursor: a.canEdit ? "grab" : "default", opacity: a.canEdit ? 1 : 0.5, "&:hover": a.canEdit ? { bgcolor: ColorsEpico.ColorNeutro, borderColor: ColorsEpico.ColorGrayNeutral } : {},
                }}
              >
                <DragIndicator sx={{ fontSize: 16, color: ColorsEpico.ColorNeutral, mt: 0.2 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontSize={FontSizesEnum.Delta} fontWeight={FontWeightEnum.Bold}>{c[0]}</Typography>
                  <Typography fontSize={FontSizesEnum.Omega} color={ColorsEpico.ColorBlack60}>{clientId(c)} · {c[1]}{c[4] ? ` · Responsable original: ${c[4]}` : ""}</Typography>
                </Box>
              </Box>
            </Stack>
          );
        })}
      </Box>
    </GapMarker>
  );
};

const RouteBox = () => {
  const a = useAgenda();
  const inOrdering = !!a.routePlan;

  if (!inOrdering) {
    return (
      <Box sx={{ position: "sticky", bottom: 12, zIndex: 4, mt: 1 }}>
        {a.routeSel.length >= 2 && (
          <Button
            fullWidth
            variant="contained"
            onClick={a.suggestRoute}
            sx={{ borderRadius: "4px", fontWeight: FontWeightEnum.Medium, boxShadow: 3 }}
          >
            Sugerir ruta
          </Button>
        )}
        {a.routeMsg && <Hint sx={{ mt: 0.75 }}>{a.routeMsg}</Hint>}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1.5, p: 1.5, border: `1px solid ${ColorsEpico.ColorGrayNeutral}`, borderRadius: "8px", bgcolor: ColorsEpico.ColorNeutro }}>
      <SectionTitle sx={{ fontSize: FontSizesEnum.Delta }}>Orden de visita</SectionTitle>
      <Hint>La primera posición define el inicio. Puedes reordenar o quitar destinos antes de agregar la ruta. Los horarios se recalculan según la disponibilidad futura del día visible en Agenda.</Hint>

      <Box sx={{ mt: 1 }}>
        {a.routePlan!.map((x, i) => (
          <Stack key={clientKey(x.c)} direction="row" alignItems="center" gap={1} sx={{ py: 1, borderBottom: `1px solid ${ColorsEpico.ColorLightBlueishGray}`, "&:last-of-type": { borderBottom: 0 } }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontSize={FontSizesEnum.Epsilon} fontWeight={FontWeightEnum.Bold}>
                {i + 1}. {x.c[0]} {i === 0 ? "· Inicio" : ""}
              </Typography>
              <Typography fontSize={FontSizesEnum.Omega}>{x.hh} sugerido · {x.c[1]}</Typography>
              {i > 0 && <Typography fontSize={FontSizesEnum.Omega} color={ColorsEpico.ColorBlack60}>Traslado ilustrativo: {x.travel} min</Typography>}
            </Box>
            <Stack>
              <IconButton size="small" aria-label="Subir" disabled={i === 0} onClick={() => a.moveStop(i, -1)}><ArrowUpward fontSize="inherit" /></IconButton>
              <IconButton size="small" aria-label="Bajar" disabled={i === a.routePlan!.length - 1} onClick={() => a.moveStop(i, 1)}><ArrowDownward fontSize="inherit" /></IconButton>
              <IconButton size="small" aria-label={`Quitar ${x.c[0]} de la ruta`} title="Quitar de la ruta" onClick={() => a.removeStop(i)}><Close fontSize="inherit" /></IconButton>
            </Stack>
          </Stack>
        ))}
      </Box>

      <Stack direction="row" spacing={1} sx={{ position: "sticky", bottom: 12, pt: 1.5, bgcolor: ColorsEpico.ColorNeutro, zIndex: 4 }}>
        <Button fullWidth variant="outlined" onClick={a.cancelRouteSuggestion} sx={outlinedBtn}>Cancelar sugerencia</Button>
        <Button fullWidth variant="contained" onClick={a.applyRoute} sx={{ borderRadius: "4px", fontWeight: FontWeightEnum.Medium }}>Agregar ruta</Button>
      </Stack>
    </Box>
  );
};

const accSx = { boxShadow: "none", border: `1px solid ${ColorsEpico.ColorLightBlueishGray}`, borderRadius: "8px !important", mt: 2, "&:before": { display: "none" } };

export const SidePanel = () => {
  const a = useAgenda();
  const selCount = a.routeSel.length;
  return (
    <Box sx={{ p: 2 }}>
      <SectionTitle>Clientes para agenda</SectionTitle>
      <Hint>Busca un cliente y arrástralo al calendario o haz clic para agendar.</Hint>
      <TextField
        fullWidth
        size="small"
        label="Buscar cliente"
        placeholder="Cliente ID, nombre fiscal o dirección"
        value={a.search}
        onChange={(e) => a.setSearch(e.target.value)}
        helperText={a.search.trim().length > 0 && a.search.trim().length < 3 ? "Escribe al menos 3 caracteres." : " "}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
        sx={{ mt: 1.5 }}
      />
      <TextField select fullWidth size="small" label="Alcance" value={a.role === "advisor" ? "own" : a.portfolioScope} disabled={a.role === "advisor"} onChange={(e) => { a.setPortfolioScope(e.target.value as "own" | "team"); }} sx={{ mt: 0.5 }}>
        <MenuItem value="own">Mi cartera</MenuItem>
        <MenuItem value="team">Clientes del equipo / jerarquía</MenuItem>
      </TextField>
      {!a.routePlan ? (
        <>
          <Typography fontSize={FontSizesEnum.Omega} color={selCount ? ColorsEpico.ColorSecondary : ColorsEpico.ColorBlack60} fontWeight={selCount ? FontWeightEnum.Bold : 500} sx={{ mt: 1 }}>
            {selCount ? `Seleccionados para ruta: ${selCount}` : "Sin clientes seleccionados"}
          </Typography>
          <Portfolio />
          <RouteBox />
        </>
      ) : (
        <RouteBox />
      )}

      <Hint sx={{ mt: 2 }}>Los horarios se muestran como hora local del asesor en esta simulación. El manejo definitivo de zona horaria sigue pendiente de validación técnica.</Hint>

      <Accordion disableGutters sx={accSx}>
        <AccordionSummary expandIcon={<ExpandMore />}><Typography fontWeight={FontWeightEnum.Bold} fontSize={FontSizesEnum.Delta}>Desviaciones del día ({a.deviations.length})</Typography></AccordionSummary>
        <AccordionDetails>
          <Hint>Compara horario planeado contra ejecución real.</Hint>
          {a.deviations.length === 0 ? <Typography fontSize={FontSizesEnum.Epsilon} sx={{ mt: 1 }}>Sin ejecuciones reales para comparar.</Typography> : a.deviations.map(({ e, text }) => (
            <Box key={String(e.id)} sx={{ borderLeft: `4px solid ${AGENDA_COLORS.pending.main}`, bgcolor: AGENDA_COLORS.pending.bg, p: 1, mt: 1, borderRadius: "4px" }}>
              <Typography fontSize={FontSizesEnum.Epsilon} fontWeight={FontWeightEnum.Bold}>{e.title}</Typography>
              <Typography fontSize={FontSizesEnum.Epsilon}>{e.planned} planeado → {e.time} real</Typography>
              <Typography fontSize={FontSizesEnum.Omega} color={ColorsEpico.ColorBlack60}>{text} · {e.status}</Typography>
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 2, p: 1.5, border: `1px solid ${ColorsEpico.ColorLightBlueishGray}`, borderRadius: "8px" }}>
        <SectionTitle sx={{ fontSize: FontSizesEnum.Delta }}>Reglas de ejecución</SectionTitle>
        {[
          "Toda visita debe tener un evento de Agenda antes del Check-in. Si surge durante la ruta, primero se crea el evento y después se inicia la visita.",
          "No se permite un nuevo Check-in mientras exista una visita abierta.",
          "Si existe un Check-in abierto al intentar iniciar la siguiente visita, el asesor debe recibir la advertencia y cerrar primero la visita anterior.",
          "Si la última visita del día queda abierta, el proceso diario de las 22:00 hora Ciudad de México la cierra automáticamente, registra 10 minutos de duración y la identifica como cierre automático.",
        ].map((r) => <Typography key={r} fontSize={FontSizesEnum.Epsilon} color={ColorsEpico.ColorBlack60} sx={{ mt: 0.75 }}>• {r}</Typography>)}
        <Button fullWidth variant="outlined" color="error" onClick={a.simulateDayClose} sx={{ mt: 1.5, borderRadius: "4px", fontWeight: FontWeightEnum.Medium }}>Simular cierre automático · 22:00 CDMX</Button>
        {a.closeResult && (a.closeResult.type === "ok"
          ? <Alert severity="success" variant="outlined" sx={{ mt: 1, fontSize: FontSizesEnum.Epsilon }}><b>Visita regularizada.</b> {a.closeResult.text}</Alert>
          : <Hint sx={{ mt: 1 }}>{a.closeResult.text}</Hint>)}
      </Box>

      <Accordion disableGutters sx={accSx}>
        <AccordionSummary expandIcon={<ExpandMore />}><Typography fontWeight={FontWeightEnum.Bold} fontSize={FontSizesEnum.Delta}>Tareas / pendientes ({a.tasks.length})</Typography></AccordionSummary>
        <AccordionDetails>
          <Hint>Vista preliminar dentro de Agenda; no ocupan un bloque horario. Su detalle se validará en el Discovery específico de Tareas.</Hint>
          {a.tasks.slice(0, 3).map((t) => (
            <Box key={t.id} sx={{ border: `1px solid ${ColorsEpico.ColorLightBlueishGray}`, borderLeft: `4px solid ${AGENDA_COLORS.task.main}`, borderRadius: "4px", p: 1, mt: 1 }}>
              <Typography fontSize={FontSizesEnum.Epsilon} fontWeight={FontWeightEnum.Bold}>{t.subject}</Typography>
              <Typography fontSize={FontSizesEnum.Omega} color={ColorsEpico.ColorBlack60}>{t.client} · vence {t.due}</Typography>
              <Typography fontSize={FontSizesEnum.Omega} color={ColorsEpico.ColorBlack60}>{t.owner} · {t.status}{t.requiresEvidence ? " · Evidencia requerida" : ""}</Typography>
            </Box>
          ))}
          <Button fullWidth variant="outlined" disabled={!a.canEdit} onClick={() => a.setTaskFormOpen(true)} sx={{ ...outlinedBtn, mt: 1.5 }}>+ Nueva tarea</Button>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
