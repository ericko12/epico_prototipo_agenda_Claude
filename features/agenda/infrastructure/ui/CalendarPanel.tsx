"use client";
import { useEffect, useRef, useState } from "react";
import { Box, Chip, IconButton, Stack, Tab, Tabs, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { ColorsEpico } from "@/features/common/domain/enums/ColorsEpico";
import { FontSizesEnum } from "@/features/common/domain/enums/FontSizes";
import { FontWeightEnum } from "@/features/common/domain/enums/FontWeight";
import { useAgenda } from "@/features/agenda/application/AgendaContext";
import { DAY_HOURS, DAY_START, hhmm, mins } from "@/features/agenda/domain/agenda.data";
import { AgendaEvent, View } from "@/features/agenda/domain/agenda.types";
import { AGENDA_COLORS, GapMarker } from "./shared";

const INITIAL_DATE = new Date();
const BASE_EVENT_DATE = "2026-09-22";
const HOUR_PX = 60;
const LABEL_W = 56;
const CALENDAR_HEIGHT = DAY_HOURS * HOUR_PX;

const formatLongDate = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);

const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(date);

const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(date);

const isoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const eventDate = (e: AgendaEvent) => e.date ?? BASE_EVENT_DATE;

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

const useCurrentTime = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
};

const CurrentTimeLine = ({ date, left = LABEL_W }: { date: Date; left?: number }) => {
  const now = useCurrentTime();
  if (isoDate(now) !== isoDate(date)) return null;

  const minuteOfDay = now.getHours() * 60 + now.getMinutes();
  const offset = minuteOfDay - DAY_START;
  if (offset < 0 || offset > DAY_HOURS * 60) return null;

  return (
    <Box sx={{ position: "absolute", left, right: 0, top: offset, zIndex: 6, pointerEvents: "none", display: "flex", alignItems: "center" }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: ColorsEpico.ColorSecondary, transform: "translateX(-4px)" }} />
      <Box sx={{ flex: 1, borderTop: `2px solid ${ColorsEpico.ColorSecondary}` }} />
      <Typography
        sx={{
          position: "absolute",
          left: 6,
          top: -18,
          px: 0.5,
          bgcolor: ColorsEpico.ColorWhite,
          color: ColorsEpico.ColorSecondary,
          fontSize: FontSizesEnum.Omega,
          fontWeight: FontWeightEnum.Bold,
          borderRadius: "3px",
        }}
      >
        Ahora · {hhmm(minuteOfDay)}
      </Typography>
    </Box>
  );
};

const TimeLines = ({ left = LABEL_W }: { left?: number }) => (
  <>
    {Array.from({ length: DAY_HOURS * 2 + 1 }, (_, i) => {
      const isHour = i % 2 === 0;
      return (
        <Box
          key={i}
          sx={{
            position: "absolute",
            left,
            right: 0,
            top: i * 30,
            borderTop: isHour
              ? `1px solid ${ColorsEpico.ColorSkyBlue}`
              : "1px dashed rgba(27,56,146,.13)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      );
    })}
  </>
);

const EventCard = ({ e, compact = false }: { e: AgendaEvent; compact?: boolean }) => {
  const a = useAgenda();
  const c = e.absence ? AGENDA_COLORS.absence : e.kind === "realized" ? AGENDA_COLORS.realized : AGENDA_COLORS.planned;
  const draggable = a.canEditEvent(e);
  return (
    <Box
      draggable={draggable}
      onDragStart={(x) => {
        if (!draggable) return;
        x.dataTransfer.effectAllowed = "move";
        x.dataTransfer.setData("application/x-agenda-event", String(e.id));
      }}
      onClick={() => a.setDetail({ event: e })}
      title={a.hideDetail ? "Disponibilidad reservada" : `${e.time} · ${e.title} · ${e.address} · ${e.status}`}
      sx={{
        height: "100%",
        overflow: "hidden",
        cursor: draggable ? "grab" : "pointer",
        borderLeft: `4px solid ${c.main}`,
        bgcolor: c.bg,
        borderRadius: "4px",
        px: 1,
        py: compact ? 0.25 : 0.5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxSizing: "border-box",
        ...(e.status === "Check-in activo" && { borderLeftColor: AGENDA_COLORS.pending.main, bgcolor: AGENDA_COLORS.pending.bg }),
        "&:hover": { boxShadow: "0 2px 6px rgba(0,0,0,.12)" },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
        <Typography
          noWrap
          sx={{
            minWidth: 0,
            flex: 1,
            fontSize: compact ? FontSizesEnum.Omega : FontSizesEnum.Epsilon,
            fontWeight: FontWeightEnum.Bold,
            color: ColorsEpico.ColorDarkCharcoal,
            lineHeight: compact ? 1.1 : 1.25,
          }}
        >
          {e.time} · {a.eventLabel(e)}
        </Typography>
        {e.routeSuggested && !a.hideDetail && (
          <Chip
            label="RS"
            size="small"
            title="Ruta sugerida"
            sx={{
              height: 18,
              flexShrink: 0,
              fontSize: FontSizesEnum.Omega,
              fontWeight: FontWeightEnum.Bold,
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
        )}
      </Stack>
      {!compact && (
        <Typography noWrap sx={{ fontSize: FontSizesEnum.Omega, color: ColorsEpico.ColorBlack60, lineHeight: 1.15 }}>
          {a.hideDetail ? "Disponibilidad reservada" : `${e.address} · ${e.status}`}
        </Typography>
      )}
    </Box>
  );
};

const DayView = ({ selectedDate }: { selectedDate: Date }) => {
  const a = useAgenda();
  const ref = useRef<HTMLDivElement>(null);
  const [dropHint, setDropHint] = useState<number | null>(null);
  const selectedIso = isoDate(selectedDate);
  const evs = a.events.filter((e) => e.status !== "Cancelada" && eventDate(e) === selectedIso);

  const minuteFromY = (clientY: number) => {
    const rect = ref.current!.getBoundingClientRect();
    return Math.max(0, Math.min(DAY_HOURS * 60 - 30, Math.round((clientY - rect.top) / 30) * 30));
  };
  const dim = (e: AgendaEvent) => !!a.summaryFilter && !a.matches(e, a.summaryFilter);
  const hi = (e: AgendaEvent) => !!a.summaryFilter && a.matches(e, a.summaryFilter);

  return (
    <Box
      ref={ref}
      onDragOver={(e) => {
        if (!a.canEdit) return;
        e.preventDefault();
        const moving = e.dataTransfer.types.includes("application/x-agenda-event");
        e.dataTransfer.dropEffect = moving ? "move" : "copy";
        setDropHint(minuteFromY(e.clientY));
      }}
      onDragLeave={() => setDropHint(null)}
      onDrop={(e) => {
        setDropHint(null);
        if (!a.canEdit) return;
        e.preventDefault();
        const minute = minuteFromY(e.clientY);
        const time = hhmm(DAY_START + minute);
        const movingId = e.dataTransfer.getData("application/x-agenda-event");
        if (movingId) {
          const moving = a.events.find((x) => String(x.id) === movingId);
          if (moving) a.rescheduleEvent(moving, selectedIso, time);
          return;
        }
        try {
          const d = JSON.parse(e.dataTransfer.getData("application/json"));
          a.openForm({ client: d.name, address: d.address, time });
        } catch {
          /* sin datos */
        }
      }}
      sx={{ position: "relative", height: CALENDAR_HEIGHT, ml: 0, bgcolor: ColorsEpico.ColorWhite }}
    >
      <TimeLines />
      <CurrentTimeLine date={selectedDate} />
      {Array.from({ length: DAY_HOURS + 1 }, (_, i) => (
        <Typography key={i} sx={{ position: "absolute", left: 8, top: i * HOUR_PX + 2, fontSize: FontSizesEnum.Omega, color: ColorsEpico.ColorNeutralGray, zIndex: 1 }}>
          {hhmm(DAY_START + i * 60)}
        </Typography>
      ))}
      {dropHint != null && (
        <Box sx={{ position: "absolute", left: LABEL_W, right: 8, top: dropHint, height: 30, border: `2px dashed ${ColorsEpico.ColorSecondary}`, borderRadius: "4px", bgcolor: ColorsEpico.ColorSecondary100, pointerEvents: "none", display: "flex", alignItems: "center", px: 1, zIndex: 5 }}>
          <Typography fontSize={FontSizesEnum.Omega} color={ColorsEpico.ColorSecondary} fontWeight={FontWeightEnum.Bold}>
            Soltar para mover a las {hhmm(DAY_START + dropHint)}
          </Typography>
        </Box>
      )}
      {evs.map((e) => {
        const top = mins(e.time) - DAY_START;
        const compact = e.duration <= 30;
        const pos = e.absence
          ? { left: LABEL_W, right: 8, zIndex: 1, opacity: dim(e) ? 0.15 : 0.55 }
          : e.kind === "realized"
            ? { left: "calc(50% + 4px)", right: 8, zIndex: 2 }
            : { left: LABEL_W, right: "calc(50% + 4px)", zIndex: 2 };

        return (
          <Box
            key={String(e.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(k) => { if (k.key === "Enter") a.setDetail({ event: e }); }}
            sx={{
              position: "absolute",
              top,
              height: Math.max(compact ? 34 : 38, e.duration),
              ...pos,
              opacity: (pos as { opacity?: number }).opacity ?? (dim(e) ? 0.2 : 1),
              outline: hi(e) ? `2px solid ${ColorsEpico.ColorSecondary}` : "none",
              zIndex: hi(e) ? 4 : pos.zIndex,
              transition: "opacity .15s",
            }}
          >
            <EventCard e={e} compact={compact} />
          </Box>
        );
      })}
    </Box>
  );
};

const WeekView = ({ selectedDate }: { selectedDate: Date }) => {
  const a = useAgenda();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [dropHint, setDropHint] = useState<{ day: number; minute: number } | null>(null);
  const start = startOfWeek(selectedDate);
  const days = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });

  const minuteFromY = (clientY: number) => {
    const rect = bodyRef.current!.getBoundingClientRect();
    return Math.max(0, Math.min(DAY_HOURS * 60 - 30, Math.round((clientY - rect.top) / 30) * 30));
  };

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ minWidth: 760 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: `${LABEL_W}px repeat(5, minmax(135px, 1fr))`, borderBottom: `1px solid ${ColorsEpico.ColorSkyBlue}` }}>
          <Box />
          {days.map((d) => (
            <Box key={isoDate(d)} sx={{ p: 1, textAlign: "center", borderLeft: `1px solid ${ColorsEpico.ColorSkyBlue}` }}>
              <Typography fontWeight={FontWeightEnum.Bold} fontSize={FontSizesEnum.Delta} sx={{ textTransform: "capitalize" }}>
                {new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric" }).format(d)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box ref={bodyRef} sx={{ display: "grid", gridTemplateColumns: `${LABEL_W}px repeat(5, minmax(135px, 1fr))`, height: CALENDAR_HEIGHT, position: "relative" }}>
          <Box sx={{ position: "relative", height: CALENDAR_HEIGHT, bgcolor: ColorsEpico.ColorWhite }}>
            {Array.from({ length: DAY_HOURS + 1 }, (_, i) => (
              <Typography key={i} sx={{ position: "absolute", left: 8, top: i * HOUR_PX + 2, fontSize: FontSizesEnum.Omega, color: ColorsEpico.ColorNeutralGray }}>
                {hhmm(DAY_START + i * 60)}
              </Typography>
            ))}
          </Box>

          {days.map((d, dayIndex) => {
            const dateIso = isoDate(d);
            const dayEvents = a.events.filter((e) => e.status !== "Cancelada" && eventDate(e) === dateIso);
            return (
              <Box
                key={dateIso}
                onDragOver={(e) => {
                  if (!a.canEdit || !e.dataTransfer.types.includes("application/x-agenda-event")) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDropHint({ day: dayIndex, minute: minuteFromY(e.clientY) });
                }}
                onDragLeave={() => setDropHint((x) => x?.day === dayIndex ? null : x)}
                onDrop={(e) => {
                  if (!a.canEdit) return;
                  const movingId = e.dataTransfer.getData("application/x-agenda-event");
                  if (!movingId) return;
                  e.preventDefault();
                  const moving = a.events.find((x) => String(x.id) === movingId);
                  if (moving) a.rescheduleEvent(moving, dateIso, hhmm(DAY_START + minuteFromY(e.clientY)));
                  setDropHint(null);
                }}
                sx={{
                  position: "relative",
                  height: CALENDAR_HEIGHT,
                  borderLeft: `1px solid ${ColorsEpico.ColorSkyBlue}`,
                  bgcolor: dateIso === BASE_EVENT_DATE ? ColorsEpico.ColorBrightBlue5 : ColorsEpico.ColorWhite,
                }}
              >
                <TimeLines left={0} />
                <CurrentTimeLine date={d} left={0} />
                {dropHint?.day === dayIndex && (
                  <Box sx={{ position: "absolute", left: 4, right: 4, top: dropHint.minute, height: 30, border: `2px dashed ${ColorsEpico.ColorSecondary}`, borderRadius: "4px", bgcolor: ColorsEpico.ColorSecondary100, zIndex: 5, pointerEvents: "none" }} />
                )}
                {dayEvents.map((e) => {
                  const top = mins(e.time) - DAY_START;
                  const compact = e.duration <= 30;
                  return (
                    <Box
                      key={String(e.id)}
                      sx={{
                        position: "absolute",
                        top,
                        left: 4,
                        right: 4,
                        height: Math.max(compact ? 34 : 38, e.duration),
                        zIndex: 2,
                      }}
                    >
                      <EventCard e={e} compact />
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

const itemSx = { borderLeft: `3px solid ${AGENDA_COLORS.planned.main}`, bgcolor: AGENDA_COLORS.planned.bg, borderRadius: "4px", p: 0.75, mb: 0.75, fontSize: FontSizesEnum.Omega };

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
  const a = useAgenda();
  const { view, setView } = a;
  const [selectedDate, setSelectedDate] = useState(INITIAL_DATE);
  const title = periodTitle(view, selectedDate);

  useEffect(() => {
    a.setSelectedDate(isoDate(selectedDate));
  }, [a.setSelectedDate, selectedDate]);

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
          <Typography fontWeight={FontWeightEnum.Bold} fontSize={FontSizesEnum.Delta} textAlign="center" sx={{ px: 0.5, minWidth: 0, flex: { xs: 1, sm: "0 1 auto" }, textTransform: "capitalize" }}>
            {title}
          </Typography>
          <IconButton size="small" aria-label="Periodo siguiente" onClick={() => setSelectedDate((d) => movePeriod(view, d, 1))}>
            <ChevronRight />
          </IconButton>
        </Stack>
        <Box sx={{ pb: { xs: 1, sm: 0 } }}><Legend /></Box>
      </Stack>

      <GapMarker placement="bottom" label="No existe en Épico ni en MUI core: vista de calendario Día/Semana/Mes. Requiere decisión de Arquitectura (librería o desarrollo propio).">
        {view === "day" ? <DayView selectedDate={selectedDate} /> : view === "week" ? <WeekView selectedDate={selectedDate} /> : <MonthView />}
      </GapMarker>
    </Box>
  );
};
