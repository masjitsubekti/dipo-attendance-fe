/**
 * useGeolocation — Browser Geolocation API wrapper
 * Handles permission request, error states, and continuous position tracking
 */

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionStatus: 'idle' | 'granted' | 'denied' | 'unavailable';
}

export function useGeolocation() {
  const state = reactive<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionStatus: 'idle',
  });

  let watchId: number | null = null;

  const isAvailable = computed(() => typeof navigator !== 'undefined' && 'geolocation' in navigator);
  const hasPosition = computed(() => state.latitude !== null && state.longitude !== null);

  const getHumanReadableError = (err: GeolocationPositionError): string => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'Akses lokasi ditolak. Silakan aktifkan izin Lokasi pada pengaturan browser Anda, lalu muat ulang halaman.';
      case err.POSITION_UNAVAILABLE:
        return 'Informasi lokasi tidak tersedia saat ini. Pastikan GPS aktif pada perangkat Anda.';
      case err.TIMEOUT:
        return 'Permintaan lokasi memakan waktu terlalu lama. Silakan coba lagi.';
      default:
        return 'Gagal mendapatkan lokasi. Silakan coba lagi.';
    }
  };

  const requestPosition = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!isAvailable.value) {
        const msg = 'Browser Anda tidak mendukung Geolocation API.';
        state.error = msg;
        state.permissionStatus = 'unavailable';
        reject(new Error(msg));
        return;
      }

      state.loading = true;
      state.error = null;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          state.latitude = position.coords.latitude;
          state.longitude = position.coords.longitude;
          state.accuracy = position.coords.accuracy;
          state.loading = false;
          state.permissionStatus = 'granted';
          resolve({ latitude: state.latitude!, longitude: state.longitude! });
        },
        (err) => {
          const msg = getHumanReadableError(err);
          state.error = msg;
          state.loading = false;
          state.permissionStatus = err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable';
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    });
  };

  const startWatching = () => {
    if (!isAvailable.value || watchId !== null) return;

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        state.latitude = position.coords.latitude;
        state.longitude = position.coords.longitude;
        state.accuracy = position.coords.accuracy;
        state.loading = false;
        state.permissionStatus = 'granted';
        state.error = null;
      },
      (err) => {
        state.error = getHumanReadableError(err);
        state.permissionStatus = err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable';
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
  };

  const stopWatching = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  };

  onUnmounted(() => stopWatching());

  return {
    ...toRefs(state),
    isAvailable,
    hasPosition,
    requestPosition,
    startWatching,
    stopWatching,
  };
}
