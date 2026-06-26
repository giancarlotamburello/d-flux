<script setup lang="ts">
import { ref, onMounted } from "vue";
import { loadFluxData, type FluxRow } from "@/services/fluxCsvService";
import { useSettingsStore } from "@/stores/settingsStore";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icon } from "@iconify/vue";

const settingsStore = useSettingsStore();
const rows = ref<FluxRow[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function loadData() {
  if (!settingsStore.saveFolderPath) {
    error.value = "Save folder not configured - set it in Settings.";
    return;
  }

  const folder = {
    path: settingsStore.saveFolderPath,
    uri: settingsStore.saveFolderUri,
  };

  loading.value = true;
  error.value = null;

  try {
    rows.value = await loadFluxData(folder);
    if (rows.value.length === 0) {
      error.value = "No flux data found.";
    }
  } catch (err: any) {
    error.value = err?.message ?? "Failed to load flux data";
    console.error("FluxDataTable: loadData error", err);
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="w-full h-full flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Flux Data</h2>
      <Button @click="loadData" variant="outline" size="sm">
        <Icon icon="lucide:refresh-cw" /> Reload
      </Button>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-96">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner class="w-4 h-4" />
        <span>Loading data…</span>
      </div>
    </div>

    <div
      v-else-if="error"
      class="flex items-center justify-center h-96 bg-muted rounded-lg p-4"
    >
      <p class="text-sm text-muted-foreground">{{ error }}</p>
    </div>

    <div v-else class="overflow-x-auto flex-1 border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Device</TableHead>
            <TableHead class="text-right">CO₂ (ppm)</TableHead>
            <TableHead class="text-right">Temp (°C)</TableHead>
            <TableHead class="text-right">Humidity (%)</TableHead>
            <TableHead class="text-right">Slope</TableHead>
            <TableHead class="text-right">Slope Multiplier</TableHead>
            <TableHead class="text-right">R²</TableHead>
            <TableHead class="text-right">Latitude</TableHead>
            <TableHead class="text-right">Longitude</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(row, idx) in rows" :key="idx">
            <TableCell>{{ new Date(row.date).toLocaleString() }}</TableCell>
            <TableCell>{{ row.sensorName }}</TableCell>
            <TableCell class="text-right"
              >{{ row.co2Min }} – {{ row.co2Max }}</TableCell
            >
            <TableCell class="text-right"
              >{{ row.tempMin }} – {{ row.tempMax }}</TableCell
            >
            <TableCell class="text-right"
              >{{ row.humMin }} – {{ row.humMax }}</TableCell
            >
            <TableCell class="text-right">{{
              row.co2Slope.toFixed(4)
            }}</TableCell>
            <TableCell class="text-right">{{
              row.co2SlopeMultiplier.toFixed(2)
            }}</TableCell>
            <TableCell class="text-right">{{ row.co2R2.toFixed(4) }}</TableCell>
            <TableCell class="text-right">{{
              row.latitude.toFixed(6)
            }}</TableCell>
            <TableCell class="text-right">{{
              row.longitude.toFixed(6)
            }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div
      v-if="!loading && rows.length > 0"
      class="text-xs text-muted-foreground"
    >
      Showing {{ rows.length }} record{{ rows.length !== 1 ? "s" : "" }}
    </div>
  </div>
</template>
