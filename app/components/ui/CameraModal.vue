<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { useTranslation } from '~/composables/useTranslation';
import { useSwal } from '~/composables/useSwal';

interface Props {
  modelValue: boolean;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'capture': [file: File];
  'close': [];
}>();

const { t } = useTranslation();
const swal = useSwal();

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const localStream = ref<MediaStream | null>(null);
const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const facingMode = ref<'user' | 'environment'>(isMobileDevice() ? 'environment' : 'user');
const hasMultipleCameras = ref(false);
const isMirrored = ref(facingMode.value === 'user');

const startCamera = async () => {
  try {
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => track.stop());
    }

      const constraints = {
        video: {
          facingMode: facingMode.value,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStream.value = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    hasMultipleCameras.value = videoDevices.length > 1;

    // Mirror front camera (user), do not mirror back camera (environment)
    isMirrored.value = facingMode.value === 'user';
  } catch (err) {
    console.error("Camera access error", err);
    swal.toast(t("Gagal mengakses kamera. Pastikan izin kamera telah diberikan."), "error");
    closeCamera();
  }
};

const closeCamera = () => {
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop());
    localStream.value = null;
  }
  emit('update:modelValue', false);
  emit('close');
};

const toggleFacingMode = () => {
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user';
  startCamera();
};

const capturePhoto = () => {
  const video = videoRef.value;
  const canvas = canvasRef.value;
  if (!video || !canvas) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isMirrored.value) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  canvas.toBlob((blob) => {
    if (!blob) return;

    const file = new File([blob], `photo_${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });

    emit('capture', file);
    closeCamera();
  }, 'image/jpeg', 0.85);
};

// Watch for modelValue visibility changes
watch(() => props.modelValue, async (val) => {
  if (val) {
    await nextTick();
    startCamera();
  } else {
    closeCamera();
  }
});

// Clean up camera stream on unmount
onUnmounted(() => {
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop());
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
        <!-- Main Camera Box -->
        <div class="relative w-full h-full sm:h-auto sm:max-w-2xl bg-black rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border-none sm:border sm:border-slate-800">
          <!-- Header (Floating/Overlay on top of video) -->
          <div class="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent shrink-0">
            <h3 class="text-base font-bold text-white drop-shadow-md">
              {{ title || $t('Ambil Foto') }}
            </h3>
            <button
              type="button"
              @click="closeCamera"
              class="w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center border-none cursor-pointer backdrop-blur-sm transition-colors"
            >
              <i class="mdi mdi-close text-lg"></i>
            </button>
          </div>

          <!-- Video Aspect Container (No padding, borderless!) -->
          <div class="relative w-full flex-1 sm:flex-initial sm:aspect-[4/3] bg-black overflow-hidden">
            <video
              ref="videoRef"
              autoplay
              playsinline
              class="w-full h-full object-cover"
              :style="isMirrored ? 'transform: scaleX(-1);' : ''"
            ></video>
          </div>

          <!-- Canvas for capturing -->
          <canvas ref="canvasRef" class="hidden"></canvas>

          <!-- Footer (Native Mobile Camera App Style) -->
          <div class="relative flex items-center justify-between px-8 py-6 bg-black border-t border-slate-900/50 gap-4 shrink-0">
            <!-- Left: Cancel Button -->
            <div class="flex-1 flex justify-start">
              <button
                type="button"
                @click="closeCamera"
                class="text-sm font-semibold text-slate-300 hover:text-white bg-transparent border-none cursor-pointer p-2 transition-colors"
              >
                {{ $t('Batal') }}
              </button>
            </div>

            <!-- Center: Shutter Button -->
            <div class="flex-none flex items-center justify-center">
              <button
                type="button"
                @click="capturePhoto"
                class="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center p-1 bg-transparent hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer shadow-lg"
              >
                <div class="w-full h-full rounded-full bg-white transition-colors duration-150 hover:bg-slate-100"></div>
              </button>
            </div>

            <!-- Right: Switch Camera & Mirror Toggle -->
            <div class="flex-1 flex justify-end items-center gap-3">
              <!-- Mirror Toggle Button -->
              <!-- <button
                type="button"
                @click="isMirrored = !isMirrored"
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center border cursor-pointer transition-colors shadow-md border-none',
                  isMirrored 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-slate-900/80 text-white hover:bg-slate-800'
                ]"
                :title="isMirrored ? $t('Mirroring Aktif') : $t('Mirroring Non-aktif')"
              >
                <i class="mdi mdi-flip-horizontal text-lg"></i>
              </button> -->

              <!-- v-if="hasMultipleCameras" -->
              <button
                type="button"
                @click="toggleFacingMode"
                class="w-12 h-12 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-800 cursor-pointer transition-colors shadow-md border-none"
              >
                <i class="mdi mdi-camera-switch text-lg"></i>
              </button>
              <!-- <div v-else-if="!hasMultipleCameras" class="w-0"></div> -->
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
