<script setup lang="ts">
import { currentView } from "@/lib/navigation";
import AppSidebar from "@/components/Navbar/AppSidebar.vue";
import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Icon } from "@iconify/vue";
import { ProtocolCommandType } from "@/services/ProtocolParser";
import { useConnectionStore } from "@/stores/connectionStore";
import { useMeasurementStore } from "@/stores/measurementStore";
import { ref, watch } from "vue";
import { useAnalyzeStore } from "@/stores/analyzeStore";
import AnalyzeView from "@/components/views/AnalyzeView/AnalyzeView.vue";
import { toast } from "vue-sonner";

const connectionStore = useConnectionStore();
const measurementStore = useMeasurementStore();
const analyzeStore = useAnalyzeStore();
const scanActive = ref<boolean>(measurementStore.isAcquiring);

watch(
  () => measurementStore.isAcquiring,
  (next) => {
    scanActive.value = next;
  },
  { immediate: true },
);

async function toggleScan(): Promise<void> {
  if (!connectionStore.isConnected) return;
  const nextValue = !scanActive.value;
  scanActive.value = nextValue;

  if (nextValue) measurementStore.clearData();

  try {
    await connectionStore.sendCommand(
      nextValue
        ? ProtocolCommandType.START_ACQUISITION
        : ProtocolCommandType.STOP_ACQUISITION,
    );
  } catch (err) {
    scanActive.value = !nextValue;
    console.error("Scan toggle error:", err);
  }
}

async function handleSaveFlux() {
  try {
    await analyzeStore.saveFluxData();
    // Play success sound
    const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
    audio.play().catch(() => {});
    toast.success("Flux data saved");
  } catch (err: any) {
    toast.error(err?.message ?? "Failed to save flux data");
    console.error("Save flux data error:", err);
  }
}
</script>

<template>
  <div class="size-full">
    <SidebarProvider class="h-dvh">
      <AppSidebar class="top-8 h-[calc(100dvh-2rem)]!" />
      <SidebarInset>
        <header
          class="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 left-0 z-20 bg-background"
        >
          <SidebarTrigger class="-ml-1" />
          <div class="ml-auto flex items-center gap-2">
            <Button
              variant="secondary"
              class="flex items-center justify-center"
              v-if="
                analyzeStore.activeTool === 'linear_regression' &&
                currentView === AnalyzeView
              "
              @click="handleSaveFlux"
            >
              <Icon icon="lucide:save" class="w-4 h-4" />
            </Button>
            <Button
              :variant="scanActive ? 'default' : 'outline'"
              :disabled="!connectionStore.isConnected"
              @click="toggleScan"
            >
              <Icon
                :icon="scanActive ? 'lucide:pause' : 'lucide:play'"
                class="w-4 h-4 mr-1.5"
              />
              {{ scanActive ? "Stop" : "Start" }}
            </Button>
          </div>
        </header>
        <div
          class="flex flex-1 flex-col gap-4 p-4 min-w-0 mb-8 pb-[calc(env(safe-area-inset-bottom)+16px)]"
          ref="parentContainer"
        >
          <component :is="currentView" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  </div>
</template>

<style scoped></style>
