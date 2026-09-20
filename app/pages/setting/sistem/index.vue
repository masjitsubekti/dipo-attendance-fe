<template>
  <div class="w-full space-y-4 animate-fade-in">
    <LayoutBreadcrumb :items="breadcrumbs" />

    <UiForm ref="formRef" :disabled="loadSave || loading">
      <div class="space-y-6">
        <UiCard>
          <template #header>
            <div class="flex items-center">
              <UiIcon name="mdi-web" color="#B388FF" class="mr-3" />
              <h3 class="my-2">Informasi Umum</h3>
            </div>
          </template>

          <div class="space-y-4">
            <UiRow>
              <UiCol cols="12" md="6">
                <label class="block mb-2">Logo Sistem</label>
                <div
                  @click="uploadLogo('Logo Sistem')"
                  class="w-32 h-32 border-2 border-dashed border-red-500 cursor-pointer flex items-center justify-center hover:border-blue-500 overflow-hidden"
                >
                  <img
                    v-if="editedItem.appLogo"
                    :src="getFileUrl(editedItem.appLogo)"
                    class="w-full h-full object-cover"
                    alt="Logo Sistem"
                  />

                  <div v-else class="text-sm text-gray-400 text-center px-2">
                    Belum ada logo
                  </div>
                </div>
              </UiCol>

              <UiCol cols="12" md="6">
                <label class="block mb-2">Logo Perusahaan</label>
                <div
                  @click="uploadLogo('Logo Perusahaan')"
                  class="w-32 h-32 border-2 border-dashed border-red-500 cursor-pointer flex items-center justify-center hover:border-blue-500 overflow-hidden"
                >
                  <img
                    v-if="editedItem.companyLogo"
                    :src="getFileUrl(editedItem.companyLogo)"
                    class="w-full h-full object-cover"
                    alt="Logo Perusahaan"
                  />

                  <div v-else class="text-sm text-gray-400 text-center px-2">
                    Belum ada logo
                  </div>
                </div>
              </UiCol>

              <UiCol cols="12" md="6">
                <UiInput
                  v-model="editedItem.appName"
                  label="Nama Sistem"
                  placeholder="Masukkan Nama Sistem"
                  required
                  :rules="[(v) => !!v || 'Wajib diisi']"
                />
              </UiCol>

              <UiCol cols="12" md="6">
                <UiInput
                  v-model="editedItem.companyName"
                  label="Nama Perusahaan"
                  placeholder="Masukkan Nama Perusahaan"
                  required
                  :rules="[(v) => !!v || 'Wajib diisi']"
                />
              </UiCol>

              <UiCol cols="12" md="6">
                <UiInput
                  v-model="editedItem.companyEmail"
                  label="Email"
                  placeholder="Masukkan Email"
                  required
                  :rules="[...emailRules, (v) => !!v || 'Wajib diisi']"
                />
              </UiCol>

              <UiCol cols="12" md="6">
                <UiInput
                  v-model="editedItem.address"
                  label="Alamat"
                  placeholder="Masukkan Alamat"
                  type="textarea"
                  required
                  :rules="[(v) => !!v || 'Wajib diisi']"
                  :rows="3"
                />
              </UiCol>
            </UiRow>
          </div>
        </UiCard>

        <UiCard>
          <template #header>
            <div class="flex items-center">
              <UiIcon name="mdi-email-outline" color="info" class="mr-3" />
              <h3 class="my-2">Konfigurasi SMTP</h3>
            </div>
          </template>

          <div class="space-y-4">
            <UiRow>
              <UiCol cols="12" md="6">
                <UiInput
                  v-model="editedItem.smtpHost"
                  label="Host"
                  placeholder="Masukkan Host"
                  required
                  :rules="[(v) => !!v || 'Wajib diisi']"
                />
              </UiCol>

              <UiCol cols="12" md="6">
                <UiInput
                  v-model="editedItem.smtpPort"
                  label="Port"
                  placeholder="Masukkan Port"
                  @keypress="isNumber"
                  required
                  :rules="[(v) => !!v || 'Wajib diisi']"
                />
              </UiCol>

              <UiCol cols="12" md="6">
                <UiInput
                  v-model="editedItem.smtpEmail"
                  label="Email"
                  placeholder="Masukkan Email"
                  :rules="emailRules"
                  required
                />
              </UiCol>

              <UiCol cols="12" md="6">
                <UiInput
                  v-model="editedItem.smtpPassword"
                  label="Password"
                  placeholder="Masukkan Password"
                  :type="showSmtpPassword ? 'text' : 'password'"
                  required
                  :rules="[(v) => !!v || 'Wajib diisi']"
                >
                  <template #suffix>
                    <UiIconButton
                      :icon="showSmtpPassword ? 'mdi-eye-off' : 'mdi-eye'"
                      size="sm"
                      variant="ghost"
                      @click="showSmtpPassword = !showSmtpPassword"
                    />
                  </template>
                </UiInput>
              </UiCol>
            </UiRow>
          </div>
        </UiCard>

        <UiCard>
          <template #header>
            <div class="flex items-center">
              <UiIcon
                name="mdi-tune"
                color="#0ea5e9"
                class="mr-3"
              />
              <h3 class="my-2">Konfigurasi Sistem</h3>
            </div>
          </template>

          <div>
            <UiRow>
              <UiCol cols="12" md="6">
                <UiSelect
                  v-model="editedItem.storageDriver"
                  label="Driver Penyimpanan"
                  placeholder="Pilih Driver Penyimpanan"
                  :options="storageDriverOptions"
                  item-value="value"
                  item-title="label"
                />
              </UiCol>
            </UiRow>
            
            <UiRow class="items-start pt-3">
              <UiCol cols="12" md="4">
                <UiSwitch
                  v-model="editedItem.allowHolidayAttendance"
                  label="Izinkan Presensi Hari Libur"
                  layout="stacked"
                  :valueText="editedItem.allowHolidayAttendance ? 'Aktif' : 'Non Aktif'"
                />
                <small class="text-xs text-slate-500 dark:text-slate-400 block mt-1.5">
                  Pegawai dapat melakukan presensi pada hari libur
                </small>
              </UiCol>

              <UiCol cols="12" md="4">
                <UiSwitch
                  v-model="editedItem.saveAttendancePhoto"
                  label="Simpan Foto Presensi"
                  layout="stacked"
                  :valueText="editedItem.saveAttendancePhoto ? 'Aktif' : 'Non Aktif'"
                />
                <small class="text-xs text-slate-500 dark:text-slate-400 block mt-1.5">
                  Menyimpan file foto selfie saat check-in dan check-out
                </small>
              </UiCol>

              <UiCol cols="12" md="4">
                <UiSwitch
                  v-model="editedItem.requireAttendancePhoto"
                  label="Wajibkan Foto Presensi"
                  layout="stacked"
                  :valueText="editedItem.requireAttendancePhoto ? 'Aktif' : 'Non Aktif'"
                />
                <small class="text-xs text-slate-500 dark:text-slate-400 block mt-1.5">
                  Pegawai wajib mengambil foto selfie untuk presensi
                </small>
              </UiCol>
            </UiRow>
          </div>
        </UiCard>
      </div>

      <div class="flex justify-end space-x-2 mt-4 gap-2">
        <UiButton
          @click="handleCancel"
          variant="outline"
          color="secondary"
          :disabled="loadSave || loading"
        >
          Batal
        </UiButton>

        <UiButton
          @click="handleSave"
          color="primary"
          variant="filled"
          :loading="loadSave"
          :disabled="loadSave || loading"
        >
          Simpan
        </UiButton>
      </div>
    </UiForm>

    <UiModal v-model="dialog" :title="dialogTitle" size="lg" persistent>
      <UiForm>
        <UiInput
          v-model="file"
          type="file"
          :label="dialogTitle"
          :placeholder="dialogTitle"
          accept="image/*"
        />
      </UiForm>

      <template #footer>
        <UiButton color="secondary" @click="handleCloseLogo">
          Batal
        </UiButton>

        <UiButton
          @click="handleSaveLogo"
          color="primary"
          :loading="loadingLogo"
        >
          Simpan
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import appConfigService from "@/services/app_config.service";
import { useSwal } from "~/composables/useSwal";
import { usePermission } from "~/composables/usePermission";
import { useFileUrl } from "~/composables/useFileUrl";

definePageMeta({
  layout: "admin",
  permission: "SYSTEM.VIEW",
});

const pageTitle = "Konfigurasi Sistem";

useHead({
  title: pageTitle,
});

const swal = useSwal();
const { getFileUrl } = useFileUrl();

const formRef = ref<{
  validate: () => Promise<boolean>;
  reset: () => void;
  resetValidation: () => void;
} | null>(null);

const editedItem = ref<Record<string, any>>({
  id: 1,
  appName: "",
  appLogo: null,
  companyName: "",
  companyEmail: "",
  companyLogo: null,
  address: "",
  smtpHost: "",
  smtpPort: null,
  smtpEmail: "",
  smtpPassword: "",
  allowHolidayAttendance: true,
  saveAttendancePhoto: true,
  requireAttendancePhoto: true,
  storageDriver: "local",
});

const loading = ref(false);
const loadSave = ref(false);
const showSmtpPassword = ref(false);

const dialog = ref(false);
const dialogTitle = ref("Ubah Logo");
const loadingLogo = ref(false);
const file = ref<any>(null);

const storageDriverOptions = [
  { label: "Penyimpanan Lokal (Local Disk)", value: "local" },
  { label: "Supabase S3 Storage (Cloud)", value: "supabase" },
];

const emailRules = ref([
  (v: string) => !v || /.+@.+\..+/.test(v) || "Format email tidak valid",
]);

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Pengaturan" },
  { label: pageTitle },
]);

const { checkPermission } = usePermission();

onBeforeMount(() => {
  checkPermission("SYSTEM.VIEW");
});

onMounted(() => {
  getConfig();
});

function isNumber(event: any) {
  const regex = /\d/;
  if (!regex.test(event.key)) {
    event.preventDefault();
  }
}

function getConfig() {
  loading.value = true;

  appConfigService()
    .retrieveById(1)
    .then((res: any) => {
      const data = res.data || {};
      editedItem.value = {
        id: data.id || 1,
        appName: data.appName ?? data.app_name ?? "",
        appLogo: data.appLogo ?? data.app_logo ?? null,
        companyName: data.companyName ?? data.company_name ?? "",
        companyEmail: data.companyEmail ?? data.company_email ?? "",
        companyLogo: data.companyLogo ?? data.company_logo ?? null,
        address: data.address ?? "",
        smtpHost: data.smtpHost ?? data.smtp_host ?? "",
        smtpPort: data.smtpPort ?? data.smtp_port ?? null,
        smtpEmail: data.smtpEmail ?? data.smtp_email ?? "",
        smtpPassword: data.smtpPassword ?? data.smtp_password ?? "",
        allowHolidayAttendance: data.allowHolidayAttendance !== undefined
          ? Boolean(data.allowHolidayAttendance)
          : (data.allow_holiday_attendance !== undefined ? Boolean(data.allow_holiday_attendance) : true),
        saveAttendancePhoto: data.saveAttendancePhoto !== undefined
          ? Boolean(data.saveAttendancePhoto)
          : (data.save_attendance_photo !== undefined ? Boolean(data.save_attendance_photo) : true),
        requireAttendancePhoto: data.requireAttendancePhoto !== undefined
          ? Boolean(data.requireAttendancePhoto)
          : (data.require_attendance_photo !== undefined ? Boolean(data.require_attendance_photo) : true),
        storageDriver: data.storageDriver ?? data.storage_driver ?? "local",
      };
    })
    .catch((err: any) => {
      console.error("Failed to get app config", err);
      swal.toast("Gagal mengambil data konfigurasi", "error");
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleCancel() {
  getConfig();
}

async function handleSave() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  const result = await swal.confirm(
    "Apakah Anda yakin ingin menyimpan data?",
  );

  if (!result.isConfirmed) return;

  loadSave.value = true;

  const dataToSend = {
    id: editedItem.value.id || 1,
    appName: editedItem.value.appName,
    appLogo: editedItem.value.appLogo,
    companyName: editedItem.value.companyName,
    companyEmail: editedItem.value.companyEmail,
    companyLogo: editedItem.value.companyLogo,
    address: editedItem.value.address,
    smtpHost: editedItem.value.smtpHost,
    smtpPort: editedItem.value.smtpPort ? parseInt(editedItem.value.smtpPort.toString(), 10) : null,
    smtpEmail: editedItem.value.smtpEmail,
    smtpPassword: editedItem.value.smtpPassword,
    allowHolidayAttendance: Boolean(editedItem.value.allowHolidayAttendance),
    saveAttendancePhoto: Boolean(editedItem.value.saveAttendancePhoto),
    requireAttendancePhoto: Boolean(editedItem.value.requireAttendancePhoto),
    storageDriver: editedItem.value.storageDriver || "local",
  };

  appConfigService()
    .update(dataToSend)
    .then(() => {
      getConfig();
      swal.toast("Data berhasil disimpan", "success");
    })
    .catch((err: any) => {
      console.error("Failed to save data", err);
      swal.toast("Gagal menyimpan data", "error");
    })
    .finally(() => {
      loadSave.value = false;
    });
}

function uploadLogo(title: string) {
  dialogTitle.value = title;
  file.value = null;
  dialog.value = true;
}

function getSelectedFile() {
  if (!file.value) return null;

  if (Array.isArray(file.value)) {
    return file.value[0];
  }

  if (typeof FileList !== "undefined" && file.value instanceof FileList) {
    return file.value[0];
  }

  return file.value;
}

function handleSaveLogo() {
  const selectedFile = getSelectedFile();

  if (!selectedFile) {
    swal.toast("Pilih file terlebih dahulu", "warning");
    return;
  }

  loadingLogo.value = true;

  const fd = new FormData();
  fd.append("file", selectedFile);

  appConfigService()
    .uploadFile(fd)
    .then((res: any) => {
      if (dialogTitle.value === "Logo Sistem") {
        editedItem.value.appLogo = res.data;
      } else if (dialogTitle.value === "Logo Perusahaan") {
        editedItem.value.companyLogo = res.data;
      }

      swal.toast("Logo berhasil diunggah", "success");
      handleCloseLogo();
    })
    .catch((err: any) => {
      console.error("Failed to upload logo", err);
      swal.toast("Gagal mengunggah logo", "error");
    })
    .finally(() => {
      loadingLogo.value = false;
    });
}

function handleCloseLogo() {
  file.value = null;
  dialog.value = false;
}
</script>