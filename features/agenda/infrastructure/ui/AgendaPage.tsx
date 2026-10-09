"use client";
import { Alert, Box, FormControlLabel, Paper, Snackbar, Stack, Switch, Typography } from "@mui/material";
import { ColorsEpico } from "@/features/common/domain/enums/ColorsEpico";
import { FontSizesEnum } from "@/features/common/domain/enums/FontSizes";
import { FontWeightEnum } from "@/features/common/domain/enums/FontWeight";
import { AgendaProvider, useAgenda } from "@/features/agenda/application/AgendaContext";
import { useSetBreadcrumb } from "@/features/layoutMain/infrastructure/ui/BreadcrumbContext";
import { AgendaHeader } from "./AgendaHeader";
import { SimulationControls } from "./SimulationControls";
import { SummaryMetrics } from "./SummaryMetrics";
import { CalendarPanel } from "./CalendarPanel";
import { SidePanel } from "./SidePanel";
import { CancelEventDialog, EventDetailDialog, EventFormDialog, TaskFormDialog } from "./AgendaDialogs";

/** Interruptor flotante para mostrar/ocultar los "huecos" (componentes que no existen en Épico). */
const GapToggle = () => {
  const { showGaps, setShowGaps } = useAgenda();
  return (
    <Paper elevation={3} sx={{ position: "fixed", right: { xs: 12, md: 16 }, bottom: { xs: 76, md: 16 }, zIndex: 1100, px: 1.5, py: 0.75, borderRadius: "8px", maxWidth: "calc(100vw - 32px)" }}>
      <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
        <FormControlLabel sx={{ m: 0, gap: 1 }} control={<Switch checked={showGaps} onChange={(e) => setShowGaps(e.target.checked)} />} label={<Typography fontSize={FontSizesEnum.Epsilon} fontWeight={FontWeightEnum.Medium}>Marcar huecos</Typography>} />
        {showGaps && (
          <Stack direction="row" gap={1.5} sx={{ display: { xs: "none", sm: "flex" } }}>
            <Stack direction="row" alignItems="center" gap={0.5}><Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: ColorsEpico.ColorBrightOrange }} /><Typography fontSize={FontSizesEnum.Omega}>No existe en Épico</Typography></Stack>
            <Stack direction="row" alignItems="center" gap={0.5}><Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: ColorsEpico.ColorPurple }} /><Typography fontSize={FontSizesEnum.Omega}>Solo simulación</Typography></Stack>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

const AgendaSnackbar = () => {
  const { snack, setSnack } = useAgenda();
  return (
    <Snackbar open={!!snack} autoHideDuration={5000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
      {snack ? <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(null)}>{snack.msg}</Alert> : undefined}
    </Snackbar>
  );
};

const AgendaContent = () => {
  useSetBreadcrumb(["Rutas + Agenda", "Agenda"]);
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: { xs: 10, md: 10 } }}>
      <AgendaHeader />
      <SimulationControls />
      <SummaryMetrics />
      <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 340px" }, border: `1px solid ${ColorsEpico.ColorLightBlueishGray}`, borderRadius: "8px", overflow: "hidden", bgcolor: ColorsEpico.ColorWhite }}>
        <Box sx={{ minWidth: 0 }}><CalendarPanel /></Box>
        <Box sx={{ borderLeft: { lg: `1px solid ${ColorsEpico.ColorLightBlueishGray}` }, borderTop: { xs: `1px solid ${ColorsEpico.ColorLightBlueishGray}`, lg: 0 }, maxHeight: { lg: 1000 }, overflowY: { lg: "auto" } }}>
          <SidePanel />
        </Box>
      </Box>
      <EventDetailDialog />
      <EventFormDialog />
      <TaskFormDialog />
      <CancelEventDialog />
      <AgendaSnackbar />
      <GapToggle />
    </Box>
  );
};

export const AgendaPage = () => (
  <AgendaProvider>
    <AgendaContent />
  </AgendaProvider>
);
