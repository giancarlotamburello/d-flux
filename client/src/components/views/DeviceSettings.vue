<script setup lang="ts">
import { Label } from "@/components/ui/label";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/stores/settingsStore";
import { ref, computed } from "vue";
import { Spinner } from "../ui/spinner";
import { useConnectionStore } from "@/stores/connectionStore";
import { ProtocolCommandType } from "@/services/ProtocolParser";
import { useMeasurementStore } from "@/stores/measurementStore";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/vue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const settingsStore = useSettingsStore();
const connectionStore = useConnectionStore();
const measurementStore = useMeasurementStore();
const saving = ref(false);

const forcedCalibrationUnlocked = ref(false);
const calibrationDialogOpen = ref(false);

// Current form values
const currentOffset = ref(
  settingsStore.deviceSettings.settings.co2CalibrationOffset,
);
const currentMultiplier = ref(
  settingsStore.deviceSettings.settings.co2CalibrationMultiplier,
);
const currentSlopeMultiplier = ref(
  settingsStore.deviceSettings.settings.co2SlopeMultiplier,
);
const currentHwCalibrationReference = ref(
  settingsStore.deviceSettings.settings.hardwareCalibrationReference,
);

// Check if values are synchronized with store
const isSynchronized = computed(() => {
  return (
    currentOffset.value ===
      settingsStore.deviceSettings.settings.co2CalibrationOffset &&
    currentMultiplier.value ===
      settingsStore.deviceSettings.settings.co2CalibrationMultiplier &&
    currentSlopeMultiplier.value ===
      settingsStore.deviceSettings.settings.co2SlopeMultiplier
  );
});

// Handle save action
const handleSave = async () => {
  saving.value = true;
  await connectionStore.sendCommand(
    ProtocolCommandType.SET_SETTINGS,
    `offset=${currentOffset.value};multiplier=${currentMultiplier.value}`,
  );

  settingsStore.deviceSettings.settings.co2CalibrationOffset =
    currentOffset.value;
  settingsStore.deviceSettings.settings.co2CalibrationMultiplier =
    currentMultiplier.value;
  settingsStore.deviceSettings.settings.co2SlopeMultiplier =
    currentSlopeMultiplier.value;

  // Persist to localStorage
  settingsStore.saveDeviceSettings();
  settingsStore.deviceSettings.applied = true;
  saving.value = false;
};

const applyHwCalibration = async () => {
  saving.value = true;
  await connectionStore.sendCommand(
    ProtocolCommandType.SET_HW_CALIBRATION_REF,
    String(currentHwCalibrationReference.value),
  );

  settingsStore.deviceSettings.applied = true;
  saving.value = false;
  forcedCalibrationUnlocked.value = false;
};
</script>

<template>
  <div class="space-y-4">
    <fieldset :disabled="measurementStore.isAcquiring" class="space-y-4">
      <div class="flex justify-between items-center mb-2">
        <p>Device settings</p>
        <Button
          :disabled="isSynchronized || saving || measurementStore.isAcquiring"
          @click="handleSave"
          ><Spinner v-if="saving" /> Save</Button
        >
      </div>
      <div class="rounded-lg border p-4 space-y-3">
        <div class="space-y-0.5">
          <div class="flex items-center justify-between">
            <Label class="text-base font-medium">CO₂ calibration</Label>

            <Badge variant="secondary"> Software </Badge>
          </div>
          <p class="text-sm text-muted-foreground">
            Adjust the offset and multiplier applied to the CO₂ values. The
            multiplier is applied first, followed by the offset.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <div class="grid md:grid-cols-2 grid-cols-1 gap-2 w-full">
            <div class="w-full">
              <NumberField
                id="multiplier"
                v-model="currentMultiplier"
                :default-value="1"
                :step="0.01"
                class="w-full"
              >
                <Label for="multiplier">Multiplier</Label>
                <NumberFieldContent>
                  <NumberFieldDecrement />
                  <NumberFieldInput />
                  <NumberFieldIncrement />
                </NumberFieldContent>
              </NumberField>
              <p v-if="currentMultiplier === 0" class="text-red-500">
                ⚠️ Multiplier is <strong>0</strong>
              </p>
            </div>

            <div class="w-full">
              <NumberField
                id="offset"
                v-model="currentOffset"
                :default-value="0"
                :step="0.01"
                class="w-full"
              >
                <Label for="offset">Offset</Label>
                <NumberFieldContent>
                  <NumberFieldDecrement />
                  <NumberFieldInput />
                  <NumberFieldIncrement />
                </NumberFieldContent>
              </NumberField>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border p-4 space-y-3">
        <div class="space-y-0.5">
          <div class="flex items-center justify-between">
            <Label class="text-base font-medium">CO₂ slope multiplier</Label>

            <Badge variant="secondary"> Software </Badge>
          </div>
          <p class="text-sm text-muted-foreground">
            A multiplier for the calculated CO₂ slope to facilitate a
            conversion to other measurement units (e.g. g/m²/day).
          </p>
        </div>

        <div class="flex items-center gap-2">
          <div class="w-full">
            <NumberField
              id="slope-multiplier"
              v-model="currentSlopeMultiplier"
              :default-value="1"
              :step="0.01"
              class="w-full"
            >
              <Label for="slope-multiplier">Multiplier</Label>
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <p v-if="currentSlopeMultiplier === 0" class="text-red-500 mt-2">
              ⚠️ Multiplier is <strong>0</strong>
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg border p-4 space-y-3">
        <div class="space-y-0.5">
          <div class="flex items-center justify-between">
            <Label class="text-base font-medium">Forced calibration</Label>
            <Badge variant="secondary"> Hardware </Badge>
          </div>
          <p class="text-sm text-muted-foreground">
            Adjust the forced calibration reference via hardware.
          </p>
        </div>

        <div class="flex items-end gap-2">
          <div class="w-full">
            <NumberField
              id="forced-calibration-reference"
              :disabled="
                measurementStore.isAcquiring || !forcedCalibrationUnlocked
              "
              v-model="currentHwCalibrationReference"
              :step="1"
              :min="400"
              :max="2000"
              class="w-full"
            >
              <Label for="forced-calibration-reference"
                >Calibration reference</Label
              >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
          </div>

          <Button
            @click="calibrationDialogOpen = true"
            v-if="!forcedCalibrationUnlocked"
            ><Icon icon="lucide:lock-keyhole" /> Unlock</Button
          >
          <Button v-else @click="applyHwCalibration"
            ><Icon icon="lucide:check" :disabled="saving" /> Apply</Button
          >
        </div>
      </div>
    </fieldset>

    <AlertDialog v-model:open="calibrationDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Warning</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to adjust the
            <strong>hardware calibration</strong>. Incorrect values can
            permanently skew CO₂ readings. Proceed only if you know the
            reference CO₂ level.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-yellow-600 dark:bg-yellow-400"
            @click="forcedCalibrationUnlocked = true"
            >Continue</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
