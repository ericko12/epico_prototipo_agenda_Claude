"use client";
import { useRef, useState } from "react";
import { Box, IconButton, Stack, Tab, Tabs, Typography } from "@mui/material";
import { ColorsEpico } from "@/features/common/domain/enums/ColorsEpico";
import { FontSizesEnum } from "@/features/common/domain/enums/FontSizes";
import { FontWeightEnum } from "@/features/common/domain/enums/FontWeight";
import { useAgenda } from "@/features/agenda/application/AgendaContext";
import { DAY_HOURS, DAY_START, hhmm, mins } from "@/features/agenda/domain/agenda.data";
import { AgendaEvent, View } from "@/features/agenda/domain/agenda.types";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { AGENDA_COLORS, GapMarker } from "./shared";

const INITIAL_DATE = new Date(2026, 8, 22);

const formatLongDate = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);

const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(date);

const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(date);

const startOfWeek = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
};

const periodTitle = (view: View, date: Date) => {
  if (view === "day") return formatLongDate(date);
  if (view === "month") {
    const value = formatMonth(date);
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  return `Semana del ${formatShortDate(start)} al ${formatShortDate(end)}`;
};

const movePeriod = (view: View, date: Date, direction: -1 | 1) => {
  const next = new Date(date);
  if (view === "day") next.setDate(next.getDate() + direction);
  else if (view === "week") next.setDate(next.getDate() + direction * 7);
  else next.setMonth(next.getMonth() + direction);
  return next;
};
const HOUR_PX = 60;
const LABEL_W = 56;

const Legend = () => (
  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ fontSize: FontSizesEnum.Omega, color: ColorsEpico.ColorBlack60 }}>
    {[["Planeado", AGENDA_COLORS.planned.main], ["Ejecutado", AGENDA_COLORS.realized.main]].map(([l, c]) => (
      <Stack key={l} direction="row" alignItems="center" spacing={0.5}>
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />
        <Typography fontSize={FontSizesEnum.Omega}>{l}</Typography>
      </Stack>
    ))}
  </Stack>
);

const DayView = () => {
  const a = useAgenda();
  const ref = useRef<HTMLDivElement>(null);
  const [dropHint, setDropHint] = useState<number | null>(null);
  const evs = a.events.filter((e) => e.status !== "Cancelada");

  const minuteFromY = (clientY: number) => {
    const rect = ref.current!.getBoundingClientRect();
    return Math.max(0, Math.min(DAY_HOURS * 60 - 30, Math.round((clientY - rect.top) / 30) * 30));
  };
  const dim = (e: AgendaEvent) => !!a.summaryFilter && !a.matches(e, a.summaryFilter);
  const hi = (e: AgendaEvent) => !!a.summaryFilter && a.matches(e, a.summaryFilter);

  return (
    <Box
      ref={ref}
      onDragOver={(e) => { if (!a.canEdit) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDropHint(minuteFromY(e.clientY)); }}
      onDragLeave={() => setDropHint(null)}
      onDrop={(e) => {
        setDropHint(null);
        if (!a.canEdit) return; e.preventDefault();
        try { const d = JSON.parse(e.dataTransfer.getData("application/json")); a.openForm({ client: d.name, address: d.address, time: hhmm(DAY_START + minuteFromY(e.clientY)) }); } catch { /* sin datos */ }
      }}
      sx={{
        position: "relative", height: DAY_HOURS * HOUR_PX, ml: 0,
        backgroundImage: `repeating-linear-gradient(to bottom, ${ColorsEpico.ColorWhite} 0, ${ColorsEpico.ColorWhite} ${HOUR_PX - 1}px, ${ColorsEpico.ColorSkyBlue} ${HOUR_PX - 1}px, ${ColorsEpico.ColorSkyBlue} ${HOUR_PX}px)`,
      }}
    >
      {Array.from({ length: DAY_HOURS }, (_, i) => (
        <Typography key={i} sx={{ position: "absolute", left: 8, top: i * HOUR_PX + 2, fontSize: FontSizesEnum.Omega, color: ColorsEpico.ColorNeutralGray }}>{hhmm(DAY_START + i * 60)}</Typography>
      ))}
      {dropHint != null && (
        <Box sx={{ position: "absolute", left: LABEL_W, right: 8, top: dropHint, height: 30, border: `2px dashed ${ColorsEpico.ColorSecondary}`, borderRadius: "4px", bgcolor: ColorsEpico.ColorSecondary100, pointerEvents: "none", display: "flex", alignItems: "center", px: 1 }}>
          <Typography fontSize={FontSizesEnum.Omega} color={ColorsEpico.ColorSecondary} fontWeight={FontWeightEnum.Bold}>Soltar para agendar a las {hhmm(DAY_START + dropHint)}</Typography>
        </Box>
      )}
      {evs.map((e) => {
        const top = mins(e.time) - DAY_START;
        const c = e.absence ? AGENDA_COLORS.absence : e.kind === "realized" ? AGENDA_COLORS.realized : AGENDA_COLORS.planned;
        const pos = e.absence ? { left: LABEL_W, right: 8, zIndex: 0, opacity: dim(e) ? 0.15 : 0.55 } : e.kind === "realized" ? { left: "calc(50% + 4px)", right: 8, zIndex: 2 } : { left: LABEL_W, right: "calc(50% + 4px)", zIndex: 2 };
        return (
          <Box
            key={String(e.id)}
            role="button"
            tabIndex={0}
            onClick={() => a.setDetail({ event: e })}
            onKeyDown={(k) => { if (k.key === "Enter") a.setDetail({ event: e }); }}
            sx={{
              position: "absolute", top, height: Math.max(32, e.duration), ...pos, overflow: "hidden", cursor: "pointer",
              borderLeft: `4px solid ${c.main}`, bgcolor: c.bg, borderRadius: "4px", px: 1, py: 0.5,
              opacity: (pos as { opacity?: number }).opacity ?? (dim(e) ? 0.2 : 1),
              outline: hi(e) ? `2px solid ${ColorsEpico.ColorSecondary}` : "none", zIndex: hi(e) ? 3 : pos.zIndex,
              transition: "opacity .15s", "&:hover": { boxShadow: "0 2px 6px rgba(0,0,0,.12)" },
              ...(e.status === "Check-in activo" && { borderLeftColor: AGENDA_COLORS.pending.main, bgcolor: AGENDA_COLORS.pending.bg }),
            }}
          >
            <Typography noWrap sx={{ fontSize: FontSizesEnum.Epsilon, fontWeight: FontWeightEnum.Bold, color: ColorsEpico.ColorDarkCharcoal }}>{e.time} · {a.eventLabel(e)}</Typography>
            <Typography noWrap sx={{ fontSize: FontSizesEnum.Omega, color: ColorsEpico.ColorBlack60 }}>{a.hideDetail ? "Disponibilidad reservada" : `${e.address} · ${e.status}`}</Typography>
          </Box>
        );
      })}
    </Box>
  );
};

const itemSx = { borderLeft: `3px solid ${AGENDA_COLORS.planned.main}`, bgcolor: AGENDA_COLORS.planned.bg, borderRadius: "4px", p: 0.75, mb: 0.75, fontSize: FontSizesEnum.Omega };

const WeekView = () => {
  const a = useAgenda();
  const evs = a.events.filter((e) => e.status !== "Cancelada");
  const days = ["Lun 21", "Mar 22", "Mié 23", "Jue 24", "Vie 25"];
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(130px, 1fr))", minHeight: 520 }}>
        {days.map((d, i) => (
          <Box key={d} sx={{ borderRight: `1px solid ${ColorsEpico.ColorSkyBlue}`, p: 1.25, bgcolor: i === 1 ? ColorsEpico.ColorBrightBlue5 : undefined }}>
            <Typography fontWeight={FontWeightEnum.Bold} fontSize={FontSizesEnum.Delta} sx={{ mb: 1 }}>{d}</Typography>
            {i === 1 && evs.map((e) => (
              <Box key={String(e.id)} onClick={() => a.setDetail({ event: e })} sx={{ ...itemSx, cursor: "pointer", ...(e.kind === "realized" && { borderLeftColor: AGENDA_COLORS.realized.main, bgcolor: AGENDA_COLORS.realized.bg }) }}>
                {e.time}<br /><b>{a.eventLabel(e)}</b>
              </Box>
            ))}
            {i === 2 && <Box sx={itemSx}>10:00<br /><b>Rines MX</b></Box>}
            {i === 3 && <Box sx={itemSx}>12:00<br /><b>Revisión comercial</b></Box>}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const MonthView = () => {
  const a = useAgenda();
  const evs = a.events.filter((e) => e.status !== "Cancelada");
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(90px, 1fr))" }}>
        {["L", "M", "M", "J", "V", "S", "D"].map((x, i) => (
          <Typography key={i} sx={{ p: 1, textAlign: "center", fontWeight: FontWeightEnum.Bold, fontSize: FontSizesEnum.Delta, borderBottom: `1px solid ${ColorsEpico.ColorSkyBlue}` }}>{x}</Typography>
        ))}
        {Array.from({ length: 35 }, (_, i) => {
          const d = i - 1;
          return (
            <Box key={i} sx={{ minHeight: 104, borderRight: `1px solid ${ColorsEpico.ColorSkyBlue}`, borderBottom: `1px solid ${ColorsEpico.ColorSkyBlue}`, p: 0.75, fontSize: FontSizesEnum.Omega, bgcolor: d === 22 ? ColorsEpico.ColorBrightBlue5 : undefined }}>
              {d > 0 && d <= 30 && <Typography fontWeight={FontWeightEnum.Bold} fontSize={FontSizesEnum.Epsilon} sx={{ mb: 0.5 }}>{d}</Typography>}
              {d === 22 && evs.slice(0, 3).map((e) => (
                <Box key={String(e.id)} onClick={() => a.setDetail({ event: e })} sx={{ ...itemSx, p: 0.5, mb: 0.5, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.time} {a.eventLabel(e)}</Box>
              ))}
              {d === 22 && evs.length > 3 && <Typography fontSize={FontSizesEnum.Omega} color={ColorsEpico.ColorSecondary}>+{evs.length - 3} más</Typography>}
              {d === 23 && <Box sx={{ ...itemSx, p: 0.5 }}>10:00 Rines MX</Box>}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export const CalendarPanel = () => {
  const { view, setView } = useAgenda();
  const [selectedDate, setSelectedDate] = useState(INITIAL_DATE);
  const title = periodTitle(view, selectedDate);

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} gap={{ xs: 0.5, sm: 2 }} sx={{ px: 1.5, borderBottom: `1px solid ${ColorsEpico.ColorSkyBlue}` }}>
        <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ minHeight: 48 }}>
          <Tab value="day" label="Día" />
          <Tab value="week" label="Semana" />
          <Tab value="month" label="Mes" />
        </Tabs>
        <Stack direction="row" alignItems="center" justifyContent={{ xs: "space-between", sm: "flex-start" }} sx={{ flex: 1, minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
          <IconButton size="small" aria-label="Periodo anterior" onClick={() => setSelectedDate((d) => movePeriod(view, d, -1))}>
            <ChevronLeft />
          </IconButton>
          <Typography
            fontWeight={FontWeightEnum.Bold}
            fontSize={FontSizesEnum.Delta}
            textAlign="center"
            sx={{ px: 0.5, minWidth: 0, flex: { xs: 1, sm: "0 1 auto" }, textTransform: "capitalize" }}
          >
            {title}
          </Typography>
          <IconButton size="small" aria-label="Periodo siguiente" onClick={() => setSelectedDate((d) => movePeriod(view, d, 1))}>
            <ChevronRight />
          </IconButton>
        </Stack>
        <Box sx={{ pb: { xs: 1, sm: 0 } }}><Legend /></Box>
      </Stack>
      <GapMarker placement="bottom" label="No existe en Épico ni en MUI core: vista de calendario Día/Semana/Mes. Requiere decisión de Arquitectura (librería o desarrollo propio).">
        {view === "day" ? <DayView /> : view === "week" ? <WeekView /> : <MonthView />}
      </GapMarker>
    </Box>
  );
};
