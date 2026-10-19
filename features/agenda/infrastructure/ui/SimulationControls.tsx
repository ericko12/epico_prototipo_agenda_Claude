"use client";
import { Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { ColorsEpico } from "@/features/common/domain/enums/ColorsEpico";
import { FontSizesEnum } from "@/features/common/domain/enums/FontSizes";
import { FontWeightEnum } from "@/features/common/domain/enums/FontWeight";
import { useAgenda } from "@/features/agenda/application/AgendaContext";
import { DetailVisibility, Role, Scope } from "@/features/agenda/domain/agenda.types";
import { GapMarker, Hint } from "./shared";

const field = { minWidth: { xs: "100%", sm: 190 }, flex: { xs: "1 1 100%", sm: "0 1 auto" } };

/** Bloque exclusivo del simulador: NO es parte del producto (permite probar roles, alcance y escenarios). */
export const SimulationControls = () => {
  const a = useAgenda();
  return (
    <GapMarker kind="sim" label="Solo simulación · no es parte del producto" sx={{ mt: 2, p: { xs: 1, md: 0 } }}>
      <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px dashed ${ColorsEpico.ColorBlueView}`, bgcolor: "#FAF8FF" }}>
        <Typography sx={{ fontSize: FontSizesEnum.Omega, fontWeight: FontWeightEnum.Bold, color: ColorsEpico.ColorPurple, letterSpacing: ".04em", mb: 1.5, pr: { xs: 0, md: 30 } }}>
          CONTROL DE SIMULACIÓN · <Box component="span" sx={{ fontWeight: 500, fontStyle: "italic", letterSpacing: 0 }}>prueba rol, alcance, permisos y escenarios. El cambio de agenda se realiza en “Agenda visible”.</Box>
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
          <TextField select size="small" label="Rol simulado" value={a.role} onChange={(e) => a.setRole(e.target.value as Role)} sx={field}>
            <MenuItem value="manager">Gestor de equipo</MenuItem>
            <MenuItem value="advisor">Asesor</MenuItem>
            <MenuItem value="consult">Consulta ampliada</MenuItem>
            <MenuItem value="support">Administrador de Agenda</MenuItem>
          </TextField>
          {a.role !== "advisor" && (
            <TextField select size="small" label="Alcance simulado" value={a.scope} onChange={(e) => a.setScope(e.target.value as Scope)} sx={field}>
              <MenuItem value="own">Propio</MenuItem>
              <MenuItem value="team">Equipo / jerarquía</MenuItem>
              <MenuItem value="global">Global</MenuItem>
            </TextField>
          )}
          {a.role === "manager" && (
            <FormControlLabel control={<Checkbox size="small" checked={a.managerCanEdit} onChange={(e) => a.setManagerCanEdit(e.target.checked)} />} label={<Typography fontSize={FontSizesEnum.Delta}>Administrar eventos del equipo</Typography>} sx={{ m: 0, px: 1, border: `1px solid ${ColorsEpico.ColorGrayNeutral}`, borderRadius: "4px", height: 40 }} />
          )}
          {a.role !== "advisor" && (
            <TextField select size="small" label="Detalle de otras agendas" value={a.detailVisibility} onChange={(e) => a.setDetailVisibility(e.target.value as DetailVisibility)} sx={field}>
              <MenuItem value="full">Detalle completo</MenuItem>
              <MenuItem value="busy">Solo disponibilidad · “Ocupado”</MenuItem>
            </TextField>
          )}
          <Button variant="outlined" color="secondary" onClick={a.loadOpenVisitScenario} sx={{ borderRadius: "4px", fontWeight: FontWeightEnum.Medium, height: 40 }}>Cargar visita abierta</Button>
        </Stack>
        <Hint sx={{ mt: 1.2 }}>{a.roleExplanation}</Hint>
        {a.scenarioMsg && <Hint sx={{ mt: 0.5, color: ColorsEpico.ColorPurple }}>{a.scenarioMsg}</Hint>}
      </Box>
      <Alert severity="info" variant="outlined" sx={{ mt: 1.5, "& .MuiAlert-message": { width: "100%" } }}>
        <Typography fontWeight={FontWeightEnum.Bold} fontSize={FontSizesEnum.Delta}>Prueba de cierre de visita olvidada</Typography>
        <Hint>Control exclusivo del prototipo. Simula el proceso de las 10:00 a. m. del día siguiente en la zona local del asesor; no representa una acción disponible para Soporte en producción.</Hint>
        <Button size="small" variant="outlined" onClick={a.simulateDayClose} sx={{ mt: 1, borderRadius: "4px" }}>Simular cierre automático · 10:00 día siguiente</Button>
        {a.closeResult && <Hint sx={{ mt: 1 }}>{a.closeResult.text}</Hint>}
      </Alert>
    </GapMarker>
  );
};
