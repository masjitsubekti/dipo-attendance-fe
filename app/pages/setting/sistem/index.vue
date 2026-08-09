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
                />
              </UiCol>

              <UiCol cols="12" md="6">
                <UiInput
                  v-model="editedItem.smtpPassword"
                  label="Password"
                  placeholder="Masukkan Password"
                  type="password"
                  required
                  :rules="[(v) => !!v || 'Wajib diisi']"
                />
              </UiCol>
            </UiRow>
          </div>
        </UiCard>

        <UiCard>
          <template #header>
            <div class="flex items-center">
              <UiIcon
                name="mdi-store-clock-outline"
                color="#d97706"
                class="mr-3"
              />
              <h3 class="my-2">Konfigurasi Sistem</h3>
            </div>
          </template>

          <div class="space-y-4">
            <UiRow>
              <UiCol cols="12" md="6">
                <UiInput
                  v-model="editedItem.startCsdNo"
                  label="Start CSD No"
                  placeholder="Masukkan Start CSD No"
                  required
                  :rules="[(v) => !!v || 'Wajib diisi']"
                >
                  <template #prefix>
                    <span class="-ml-1 inline-flex h-10 text-[15px] items-center text-slate-700 dark:text-slate-200">
                      01-
                    </span>
                  </template>
                </UiInput>
              </UiCol>

              <UiCol cols="12" md="6">
                <UiInput
                  v-model="editedItem.startBtbNo"
                  label="Start BTB No"
                  placeholder="Masukkan Start BTB No"
                  required
                  :rules="[(v) => !!v || 'Wajib diisi']"
                >
                  <template #prefix>
                    <span class="-ml-1 inline-flex text-[15px] h-10 items-center text-slate-700 dark:text-slate-200">
                      02-
                    </span>
                  </template>
                </UiInput>
              </UiCol>
            </UiRow>
            
            <UiRow>
              <UiCol>
                <UiInput
                  v-model="editedItem.startRejectNo"
                  label="Start Reject No"
                  placeholder="Masukkan Start Reject No"
                  required
                  :rules="[(v) => !!v || 'Wajib diisi']"
                >
                </UiInput>
              </UiCol>
            </UiRow>
          </div>
        </UiCard>
      </div>

      <div class="flex justify-end space-x-2 mt-4 gap-4">
        <UiButton
          @click="handleCancel"
          variant="outline"
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

definePageMeta({
  layout: "admin",
  permission: "SYSTEM.VIEW",
});

const pageTitle = "Konfigurasi Sistem";

useHead({
  title: pageTitle,
});

const swal = useSwal();

const formRef = ref<{
  validate: () => Promise<boolean>;
  reset: () => void;
  resetValidation: () => void;
} | null>(null);

const editedItem: any = ref({});
const loading = ref(false);
const loadSave = ref(false);

const dialog = ref(false);
const dialogTitle = ref("Ubah Logo");
const loadingLogo = ref(false);
const file: any = ref(null);

const emailRules = ref([
  (v: string) => !!v || "Wajib diisi",
  (v: string) => /.+@.+\..+/.test(v) || "Format email salah",
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

function getFileUrl(fileName?: string | null) {
  if (!fileName) return "";

  return `/api/files?path=${encodeURIComponent(fileName)}`;
}

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
      editedItem.value = res.data;
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

  const dataToSend = { ...editedItem.value };

  if (
    dataToSend.timeOverdue !== undefined &&
    dataToSend.timeOverdue !== null &&
    dataToSend.timeOverdue !== ""
  ) {
    dataToSend.timeOverdue = parseFloat(
      dataToSend.timeOverdue.toString().replace(",", "."),
    );
  }

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