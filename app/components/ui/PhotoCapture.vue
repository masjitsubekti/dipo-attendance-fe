<script setup lang="ts">
import { useTranslation } from '~/composables/useTranslation';

interface Props {
  modelValue?: File | string | null;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  placeholder?: string;
  existingPhotoUrl?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  accept: ".png,.jpg,.jpeg,.webp",
  maxSize: 10,
  disabled: false,
  placeholder: "",
  existingPhotoUrl: null,
});

const emit = defineEmits<{
  "update:modelValue": [value: File | null];
  error: [message: string];
  "clear-existing": [];
}>();

const { t } = useTranslation();

const fileInput = ref<HTMLInputElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDragging = ref(false);
const isCameraActive = ref(false);
const isCameraLoading = ref(false);
const cameraError = ref<string | null>(null);
const facingMode = ref<"user" | "environment">("environment");
let mediaStream: MediaStream | null = null;
const showRetakeOptions = ref(false);

const hasPhoto = computed(() => {
  return props.modelValue instanceof File || !!props.existingPhotoUrl;
});

const previewUrl = computed(() => {
  if (props.modelValue instanceof File) {
    return URL.createObjectURL(props.modelValue);
  }
  return props.existingPhotoUrl || null;
});

const placeholderText = computed(() => {
  return props.placeholder || t("Drag & drop photo or click to upload");
});

const validateFile = (file: File): string | null => {
  const maxBytes = props.maxSize * 1024 * 1024;
  if (file.size > maxBytes) {
    return t("File too large. Max {max}", { max: props.maxSize + "MB" });
  }

  if (props.accept) {
    const acceptedTypes = props.accept
      .split(",")
      .map((t) => t.trim().toLowerCase());
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    const fileMime = file.type.toLowerCase();

    const isAccepted = acceptedTypes.some((type) => {
      if (type.startsWith(".")) return fileExt === type;
      if (type.endsWith("/*"))
        return fileMime.startsWith(type.replace("/*", "/"));
      return fileMime === type;
    });

    if (!isAccepted) {
      return t("Format file not supported");
    }
  }

  return null;
};

const handleFiles = (files: FileList | null) => {
  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file) return;

  const error = validateFile(file);
  if (error) {
    emit("error", error);
    return;
  }

  emit("update:modelValue", file);
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  handleFiles(input.files);
  stopCamera();
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;
  if (props.disabled || isCameraActive.value) return;
  handleFiles(event.dataTransfer?.files || null);
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (!props.disabled && !isCameraActive.value) {
    isDragging.value = true;
  }
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const clearPhoto = () => {
  const hasExisting = !!props.existingPhotoUrl;
  emit("update:modelValue", null);
  if (hasExisting) {
    emit("clear-existing");
  }
  showRetakeOptions.value = false;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const openFilePicker = () => {
  if (!props.disabled) {
    fileInput.value?.click();
  }
};

const startCamera = async () => {
  if (props.disabled) return;

  cameraError.value = null;
  isCameraLoading.value = true;
  isCameraActive.value = true;

  await nextTick();

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(t("Camera not supported in this browser"));
    }

    stopCameraStreamOnly();

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      await videoRef.value.play();
    } else {
      throw new Error("Video element failed to load");
    }
  } catch (err: any) {
    console.error("Camera error:", err);
    isCameraActive.value = false;
    if (err.name === "NotAllowedError") {
      cameraError.value = t("Camera access denied. Please allow permissions.");
    } else if (err.name === "NotFoundError") {
      cameraError.value = t("No camera found.");
    } else {
      cameraError.value = err.message || t("Failed to access camera");
    }
  } finally {
    isCameraLoading.value = false;
  }
};

const stopCameraStreamOnly = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
};

const stopCamera = () => {
  stopCameraStreamOnly();
  isCameraActive.value = false;
  isCameraLoading.value = false;
};

const capturePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return;

  const video = videoRef.value;
  const canvas = canvasRef.value;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(
    (blob) => {
      if (blob) {
        const timestamp = Date.now();
        const file = new File([blob], `photo_${timestamp}.jpg`, {
          type: "image/jpeg",
        });
        emit("update:modelValue", file);
        stopCamera();
      }
    },
    "image/jpeg",
    0.9,
  );
};

const toggleCamera = async () => {
  facingMode.value = facingMode.value === "user" ? "environment" : "user";
  if (isCameraActive.value) {
    await startCamera();
  }
};

onUnmounted(() => {
  stopCamera();
  if (props.modelValue instanceof File) {
    const url = URL.createObjectURL(props.modelValue);
    URL.revokeObjectURL(url);
  }
});

defineExpose({
  openFilePicker,
  clearPhoto,
  startCamera,
  stopCamera,
  capturePhoto,
});
</script>

<template>
  <div class="photo-capture-wrapper">
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :disabled="disabled"
      class="hidden"
      @change="handleFileChange"
    />
    <canvas ref="canvasRef" class="hidden" />

    <div
      v-if="!isCameraActive"
      :class="[
        'main-container',
        isDragging ? 'dragging' : '',
        disabled ? 'disabled' : '',
      ]"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div v-if="hasPhoto && previewUrl" class="preview-container">
        <div class="image-wrapper">
          <img :src="previewUrl" alt="Preview" class="preview-image" />
        </div>
        <div class="action-buttons">
          <UiIconButton
            icon="mdi-upload"
            size="md"
            color="primary"
            :tooltip="$t('Change')"
            @click="openFilePicker"
          />
          <UiIconButton
            icon="mdi-camera"
            size="md"
            color="primary"
            :tooltip="$t('Retake')"
            @click="startCamera"
          />
          <UiIconButton
            icon="mdi-delete"
            size="md"
            color="danger"
            :tooltip="$t('Remove')"
            @click="clearPhoto"
          />
        </div>
      </div>

      <div
        v-else
        class="empty-state"
        @click="!disabled ? openFilePicker() : null"
      >
        <p class="font-medium text-slate-700 dark:text-slate-200 mt-3 text-center">
          {{ placeholderText }}
        </p>
        <p class="text-xs text-slate-500 mt-1 mb-4">
          Supports: JPG, PNG, WEBP (Max {{ maxSize }}MB)
        </p>

        <div class="flex gap-3">
          <UiButton size="sm" variant="outline" @click.stop="openFilePicker">
            <i class="mdi mdi-upload mr-1"></i> Upload
          </UiButton>
          <UiButton size="sm" color="primary" @click.stop="startCamera">
            <i class="mdi mdi-camera mr-1"></i> Camera
          </UiButton>
        </div>
      </div>

      <div
        v-if="cameraError"
        class="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center justify-between"
      >
        <span><i class="mdi mdi-alert-circle mr-1"></i> {{ cameraError }}</span>
        <button
          @click="cameraError = null"
          class="text-slate-500 hover:text-slate-700"
        >
          <i class="mdi mdi-close"></i>
        </button>
      </div>
    </div>

    <div v-else class="camera-mode-container">
      <div class="camera-viewport">
        <video
          ref="videoRef"
          autoplay
          playsinline
          muted
          class="camera-video"
        ></video>

        <div v-if="isCameraLoading" class="camera-loader">
          <UiSpinner color="white" size="lg" />
        </div>
      </div>

      <div class="camera-controls">
        <button class="control-btn secondary" @click="openFilePicker">
          <i class="mdi mdi-image-multiple-outline text-xl"></i>
        </button>

        <button class="shutter-btn" @click="capturePhoto">
          <div class="shutter-inner"></div>
        </button>

        <button class="control-btn secondary" @click="toggleCamera">
          <i class="mdi mdi-camera-flip-outline text-xl"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-capture-wrapper {
  width: 100%;
}

.main-container {
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  background-color: #f8fafc;
  transition: all 0.2s ease;
  overflow: hidden;
  position: relative;
}

.dark .main-container {
  border-color: #475569;
  background-color: #1e293b;
}

.main-container:hover:not(.disabled) {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.dark .main-container:hover:not(.disabled) {
  background-color: rgba(59, 130, 246, 0.1);
}

.main-container.dragging {
  border-color: #3b82f6;
  background-color: #dbeafe;
}

.empty-state {
  padding: 2.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.5rem;
}
.dark .icon-circle {
  background-color: #334155;
}

.preview-container {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.image-wrapper {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  max-width: 100%;
  display: inline-block;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.preview-image {
  max-height: 300px;
  width: auto;
  object-fit: cover;
  display: block;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.camera-mode-container {
  background-color: #000;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.camera-header {
  background-color: rgba(0, 0, 0, 0.5);
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.camera-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background-color: #1a1a1a;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0f172a;
  z-index: 5;
}

.camera-controls {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #000;
}

.shutter-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 4px solid white;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  transition: transform 0.1s;
}

.shutter-btn:active {
  transform: scale(0.95);
}

.shutter-inner {
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 50%;
}

.control-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: background-color 0.2s;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.control-btn.disabled-placeholder {
  visibility: hidden;
}

@media (max-width: 640px) {
  .camera-viewport {
    aspect-ratio: 3/4;
  }
}
</style>
