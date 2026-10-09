"use client";
import { Autocomplete, Box, Paper, Stack, TextField, Typography } from "@mui/material";
import { ColorsEpico } from "@/features/common/domain/enums/ColorsEpico";
import { FontSizesEnum } from "@/features/common/domain/enums/FontSizes";
import { FontWeightEnum } from "@/features/common/domain/enums/FontWeight";
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
        mt: 2,
        p: 1.5,
        border: `1px solid ${ColorsEpico.ColorLightBlueishGray}`,
        borderRadius: "8px",
        bgcolor: ColorsEpico.ColorWhite,
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} gap={1.5}>
        <Box sx={{ minWidth: { sm: 120 } }}>
          <Typography fontSize={FontSizesEnum.Epsilon} fontWeight={FontWeightEnum.Bold} color={ColorsEpico.ColorDarkCharcoal}>
            Filtros
          </Typography>
        </Box>
        <Autocomplete
          size="small"
          options={options}
          value={selected}
          disabled={a.role === "advisor"}
          onChange={(_, option) => option && a.setOwner(option.id)}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          sx={{ minWidth: { xs: "100%", sm: 320 }, maxWidth: 460 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Agenda visible"
              placeholder="Buscar asesor"
            />
          )}
          noOptionsText="Sin coincidencias"
        />
      </Stack>
    </Paper>
  );
};
