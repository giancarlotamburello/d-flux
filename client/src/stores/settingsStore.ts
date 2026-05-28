import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import { getFs, type AndroidFsUri } from "@/services/filesystem";

const saveFolderPath = useStorage("saveFolderPath", "");
const saveFolderUriRaw = useStorage("saveFolderUri", ""); // Store full URI object as JSON
const doneFirstSetup = useStorage("doneFirstSetup", false);

// Device settings stored in localStorage
const deviceSettingsStorage = useStorage(
  "deviceSettings",
  JSON.stringify({
    co2CalibrationOffset: 0.0,
    co2CalibrationMultiplier: 1.0,
    co2SlopeMultiplier: 1.0,
    hardwareCalibrationReference: 400,
  })
);

function parseDeviceSettings() {
  try {
    return JSON.parse(deviceSettingsStorage.value);
  } catch {
    return {
      co2CalibrationOffset: 0.0,
      co2CalibrationMultiplier: 1.0,
      co2SlopeMultiplier: 1.0,
      hardwareCalibrationReference: 400,
    };
  }
}

async function init() {
  const storedUri = saveFolderUriRaw.value
    ? (() => {
        try {
          return JSON.parse(saveFolderUriRaw.value) as AndroidFsUri;
        } catch {
          return null;
        }
      })()
    : null;

  const folder = await getFs().initDefaultFolder({
    path: saveFolderPath.value,
    uri: storedUri,
  });
  saveFolderPath.value = folder.path;
  saveFolderUriRaw.value = folder.uri ? JSON.stringify(folder.uri) : "";
}

init();

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    saveFolderPath: saveFolderPath,
    doneFirstSetup: doneFirstSetup,

    deviceSettings: {
      applied: true,
      settings: parseDeviceSettings(),
    },
  }),
  getters: {
    saveFolderUri: (): AndroidFsUri | null => {
      if (!saveFolderUriRaw.value) return null;
      try {
        return JSON.parse(saveFolderUriRaw.value) as AndroidFsUri;
      } catch {
        return null;
      }
    },
  },
  actions: {
    setSaveFolder(path: string, uri: AndroidFsUri | null = null) {
      this.saveFolderPath = path;
      saveFolderUriRaw.value = uri ? JSON.stringify(uri) : "";
    },
    saveDeviceSettings() {
      deviceSettingsStorage.value = JSON.stringify(
        this.deviceSettings.settings
      );
    },
  },
});
