"use client";
import { useState } from "react";
import { Alert, Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { Add, ArrowDropDown, BoltOutlined, EventOutlined, TaskAltOutlined } from "@mui/icons-material";
import { ColorsEpico } from "@/features/common/domain/enums/ColorsEpico";
import { FontSizesEnum } from "@/features/common/domain/enums/FontSizes";
import { FontWeightEnum } from "@/features/common/domain/enums/FontWeight";
import { useAgenda } from "@/features/agenda/application/AgendaContext";

export const AgendaHeader = () => {
  const { canEdit, openForm, setTaskFormOpen, selectedGridSlot } = useAgenda();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography sx={{ fontSize: { xs: FontSizesEnum.Alpha, md: FontSizesEnum.Lambda }, fontWeight: FontWeightEnum.Bold, color: ColorsEpico.ColorDarkCharcoal }}>Agenda</Typography>
          <Typography sx={{ color: ColorsEpico.ColorBlack60, fontSize: FontSizesEnum.Delta }}>Planeación y seguimiento de visitas</Typography>
        </Box>
        {canEdit && (
          <>
            <Button variant="contained" startIcon={<Add />} endIcon={<ArrowDropDown />} onClick={(e) => setAnchor(e.currentTarget)} sx={{ fontWeight: FontWeightEnum.Medium, borderRadius: "4px", minHeight: 38 }}>
              Crear
            </Button>
            <Menu anchorEl={anchor} open={!!anchor} onClose={close} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} slotProps={{ paper: { sx: { minWidth: 220 } } }}>
              <MenuItem onClick={() => { close(); openForm(selectedGridSlot ? { date: selectedGridSlot.date, time: selectedGridSlot.time } : {}); }}><ListItemIcon><EventOutlined fontSize="small" /></ListItemIcon><ListItemText>Evento</ListItemText></MenuItem>
              <MenuItem onClick={() => { close(); openForm({ ...(selectedGridSlot ? { date: selectedGridSlot.date, time: selectedGridSlot.time } : {}), startAfterCreate: true, title: "Crear evento para visita ahora" }); }}><ListItemIcon><BoltOutlined fontSize="small" /></ListItemIcon><ListItemText>Visita no planeada</ListItemText></MenuItem>
              <MenuItem onClick={() => { close(); setTaskFormOpen(true); }}><ListItemIcon><TaskAltOutlined fontSize="small" /></ListItemIcon><ListItemText>Tarea</ListItemText></MenuItem>
            </Menu>
          </>
        )}
      </Stack>
      <Alert severity="warning" variant="outlined" sx={{ mt: 1.5, fontSize: FontSizesEnum.Epsilon, bgcolor: ColorsEpico.ColorSoftBeige }}>
        <b>Simulador funcional de Discovery · V8.2 integrado en Épico (versión sintética).</b> Incluye propuesta de ruta, comparación planeado/real, detalle flotante de actividades y reglas de visitas abiertas.
        Mapa real, tráfico real y navegación quedan fuera de esta simulación; su viabilidad/costo debe revisarse con Arquitectura y negocio.
      </Alert>
    </>
  );
};
