"use client";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { ColorsEpico } from "@/features/common/domain/enums/ColorsEpico";
import { FontSizesEnum } from "@/features/common/domain/enums/FontSizes";
import { FontWeightEnum } from "@/features/common/domain/enums/FontWeight";
import { useAgenda } from "@/features/agenda/application/AgendaContext";
import { SummaryFilter } from "@/features/agenda/domain/agenda.types";
import { AGENDA_COLORS, Hint } from "./shared";

const METRICS: { key: Exclude<SummaryFilter, null>; label: string; color: string }[] = [
  { key: "planned", label: "Planeadas", color: AGENDA_COLORS.planned.main },
  { key: "done", label: "Realizadas", color: AGENDA_COLORS.realized.main },
  { key: "pending", label: "Pendientes", color: AGENDA_COLORS.pending.main },
  { key: "late", label: "Con retraso", color: AGENDA_COLORS.late.main },
];

export const SummaryMetrics = () => {
  const { summary, summaryFilter, setSummaryFilter, profile } = useAgenda();
  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "baseline" }} gap={{ xs: 0, sm: 1 }}>
        <Typography fontWeight={FontWeightEnum.Bold} fontSize={FontSizesEnum.Delta}>Resumen de {profile.label}</Typography>
        <Hint>Selecciona un indicador para resaltar en el calendario los eventos relacionados.</Hint>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 1.5, mt: 1 }}>
        {METRICS.map((m) => {
          const active = summaryFilter === m.key;
          return (
            <ButtonBase
              key={m.key}
              onClick={() => setSummaryFilter(m.key)}
              aria-pressed={active}
              sx={{
                display: "block", textAlign: "left", p: 1.5, borderRadius: "8px", border: `1px solid ${active ? m.color : ColorsEpico.ColorLightBlueishGray}`,
                borderLeft: `5px solid ${m.color}`, bgcolor: active ? ColorsEpico.ColorLightBlueSelected : ColorsEpico.ColorWhite,
                boxShadow: active ? `0 0 0 1px ${m.color}` : "none", transition: "all .15s",
                "&:hover": { bgcolor: ColorsEpico.ColorNeutro },
              }}
            >
              <Typography sx={{ fontSize: FontSizesEnum.Lambda, fontWeight: FontWeightEnum.Bold, lineHeight: 1.1, color: ColorsEpico.ColorDarkCharcoal }}>{summary[m.key]}</Typography>
              <Typography sx={{ fontSize: FontSizesEnum.Delta, color: ColorsEpico.ColorBlack60 }}>{m.label}</Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
};
