import { watchPosition } from "@tauri-apps/plugin-geolocation";
import config from "@/config/config";

export type GpsLocation = {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
};

interface GpsProvider {
  getLocation(): GpsLocation;
}

class MobileGpsProvider implements GpsProvider {
  private location: GpsLocation | null = null;

  constructor() {
    this.startWatching();
  }
  private async startWatching() {
    await watchPosition(
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 3000,
      },
      (pos) => {
        this.location = {
          latitude: pos?.coords.latitude ?? 0,
          longitude: pos?.coords.longitude ?? 0,
          altitude: pos?.coords.altitude ?? 0,
          accuracy: pos?.coords.accuracy ?? 0,
        };
      },
    );
  }

  getLocation(): GpsLocation {
    return {
      latitude: this.location?.latitude ?? 0,
      longitude: this.location?.longitude ?? 0,
      altitude: this.location?.altitude ?? 0,
      accuracy: this.location?.accuracy ?? 0,
    };
  }
}

class DesktopGpsProvider implements GpsProvider {
  getLocation(): GpsLocation {
    return {
      latitude: 44.56026094342018,
      longitude: 11.340944431958052,
      altitude: 90,
      accuracy: 0,
    };
  }
}

export function getGpsProvider(): GpsProvider {
  if (config.isOnMobile) {
    return new MobileGpsProvider();
  }
  return new DesktopGpsProvider();
}
