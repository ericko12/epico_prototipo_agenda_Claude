"use client";
import { Autocomplete, InputAdornment, Paper, Stack, TextField } from "@mui/material";
import { ColorsEpico } from "@/features/common/domain/enums/ColorsEpico";
import SearchIcon from "@mui/icons-material/Search";
import { useAgenda } from "@/features/agenda/application/AgendaContext";
import { OwnerId } from "@/features/agenda/domain/agenda.types";

export const AgendaVisibleFilter = () => {
  const a = useAgenda();
  const options = (Object.entries(a.profiles) as [OwnerId, { label: string }][])
    .map(([id, p]) => ({ id, label: p.label }));

  const selected = options.find((x) => x.id === a.owner) ?? null;

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1.5,
        p: 1,
        border: `1px solid ${ColorsEpico.ColorLightBlueishGray}`,
        borderRadius: "8px",
        bgcolor: ColorsEpico.ColorWhite,
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} gap={1.25}>
        <Autocomplete
          size="small"
          options={options}
          value={selected}
          disabled={a.role === "advisor"}
          onChange={(_, option) => option && a.setOwner(option.id)}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          sx={{ minWidth: { xs: "100%", md: 320 }, maxWidth: { md: 460 } }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Agenda visible"
              placeholder="Buscar asesor"
            />
          )}
          noOptionsText="Sin coincidencias"
        />
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar visita, cliente, actividad..."
          value={a.search}
          onChange={(e) => a.setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
      </Stack>
    </Paper>
  );
};
