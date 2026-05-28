<script setup lang="ts">
import { ref, onMounted } from "vue";
import { loadFluxData, type FluxRow } from "@/services/fluxCsvService";
import { useSettingsStore } from "@/stores/settingsStore";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

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
        ↻ Reload
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
      <table class="w-full text-sm">
        <thead class="bg-muted sticky top-0">
          <tr>
            <th class="px-4 py-2 text-left font-semibold">Date</th>
            <th class="px-4 py-2 text-left font-semibold">Device</th>
            <th class="px-4 py-2 text-right font-semibold">CO₂ (ppm)</th>
            <th class="px-4 py-2 text-right font-semibold">Temp (°C)</th>
            <th class="px-4 py-2 text-right font-semibold">Humidity (%)</th>
            <th class="px-4 py-2 text-right font-semibold">Slope</th>
            <th class="px-4 py-2 text-right font-semibold">Slope Multiplier</th>
            <th class="px-4 py-2 text-right font-semibold">R²</th>
            <th class="px-4 py-2 text-right font-semibold">Latitude</th>
            <th class="px-4 py-2 text-right font-semibold">Longitude</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in rows"
            :key="idx"
            class="border-t hover:bg-muted/50 transition-colors"
          >
            <td class="px-4 py-2">{{ new Date(row.date).toLocaleString() }}</td>
            <td class="px-4 py-2">{{ row.sensorName }}</td>
            <td class="px-4 py-2 text-right">
              {{ row.co2Min }} – {{ row.co2Max }}
            </td>
            <td class="px-4 py-2 text-right">
              {{ row.tempMin }} – {{ row.tempMax }}
            </td>
            <td class="px-4 py-2 text-right">
              {{ row.humMin }} – {{ row.humMax }}
            </td>
            <td class="px-4 py-2 text-right">{{ row.co2Slope.toFixed(4) }}</td>
            <td class="px-4 py-2 text-right">{{ row.co2SlopeMultiplier.toFixed(2) }}</td>
            <td class="px-4 py-2 text-right">{{ row.co2R2.toFixed(4) }}</td>
            <td class="px-4 py-2 text-right">{{ row.latitude.toFixed(6) }}</td>
            <td class="px-4 py-2 text-right">{{ row.longitude.toFixed(6) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && rows.length > 0" class="text-xs text-muted-foreground">
      Showing {{ rows.length }} record{{ rows.length !== 1 ? "s" : "" }}
    </div>
  </div>
</template>

<style scoped>
table {
  background-color: var(--background);
}
</style>
