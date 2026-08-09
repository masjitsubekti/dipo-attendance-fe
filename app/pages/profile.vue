<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import userService from "@/services/user.service";
import { useSwal } from "~/composables/useSwal";

definePageMeta({
  layout: "admin",
});

const authStore = useAuthStore();
const userSvc = userService();
const swal = useSwal();

const isLoading = ref(false);
const isLoadingSave = ref(false);
const isUploadingPhoto = ref(false);
const fileInputRef = ref<HTMLInputElement>();
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const passwordError = ref("");
const passwordSuccess = ref(false);
const activeTab = ref("account");

const accountFormRef = ref<{
  validate: () => Promise<boolean>;
  reset: () => void;
  resetValidation: () => void;
} | null>(null);

const securityFormRef = ref<{
  validate: () => Promise<boolean>;
  reset: () => void;
  resetValidation: () => void;
} | null>(null);

const tabs = ref([
  { id: "account", label: "Akun", icon: "user" },
  { id: "security", label: "Keamanan", icon: "lock" },
]);

const profileForm = ref({
  id: "" as string,
  name: "",
  username: "",
  email: "",
});

const displayProfile = ref({
  name: authStore.user?.name || "",
  email: authStore.user?.email || "",
  username: authStore.user?.username || "",
  foto: "",
  personNumber: "",
  personnelType: "",
  departmentName: "",
  companyName: "",
  workAreaName: "",
  sectionName: "",
});

const passwordForm = ref({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const nameRules = ref([
  (v: string) => !!v || "Wajib diisi",
  (v: string) => (v && v.length >= 3) || "Minimal 3 karakter",
]);

const usernameRules = ref([
  (v: string) => !!v || "Wajib diisi",
  (v: string) => (v && v.length >= 3) || "Minimal 3 karakter",
]);

const emailRules = ref([
  (v: string) => !!v || "Wajib diisi",
  (v: string) => /.+@.+\..+/.test(v) || "Format email tidak valid",
]);

const oldPasswordRules = ref([
  (v: string) => !!v || "Wajib diisi",
]);

const newPasswordRules = ref([
  (v: string) => !!v || "Wajib diisi",
  (v: string) => (v && v.length >= 8) || "Minimal 8 karakter",
]);

const confirmPasswordRules = computed(() => [
  (v: string) => !!v || "Wajib diisi",
  (v: string) => (v && v.length >= 8) || "Minimal 8 karakter",
  (v: string) => v === passwordForm.value.newPassword || "Konfirmasi password tidak cocok",
]);

async function loadProfile() {
  isLoading.value = true;
  try {
    const res: any = await userSvc.getProfile(authStore.user?.id);
    profileForm.value = res.data;
    displayProfile.value = res.data;
  } catch (error: any) {
    console.error("Failed to load profile", error);
  } finally {
    isLoading.value = false;
  }
}

async function saveProfile() {
  const isValid = await accountFormRef.value?.validate();
  if (!isValid) return;

  isLoadingSave.value = true;
  try {
    await userSvc.updateProfile(profileForm.value.id, {
      id: profileForm.value.id,
      name: profileForm.value.name,
      username: profileForm.value.username,
      email: profileForm.value.email,
    });

    displayProfile.value = {
      name: profileForm.value.name,
      email: profileForm.value.email,
      username: profileForm.value.username,
      foto: displayProfile.value.foto,
      personNumber: displayProfile.value.personNumber,
      personnelType: displayProfile.value.personnelType,
      departmentName: displayProfile.value.departmentName,
      companyName: displayProfile.value.companyName,
      workAreaName: displayProfile.value.workAreaName,
      sectionName: displayProfile.value.sectionName,
    };

    swal.toast("Data berhasil diperbarui", "success");
  } catch (error: any) {
    console.error("Failed to save profile", error);
    swal.toast("Gagal menyimpan data", "error");
  } finally {
    isLoadingSave.value = false;
  }
}

async function changePassword() {
  const isValid = await securityFormRef.value?.validate();
  if (!isValid) return;

  passwordError.value = "";
  passwordSuccess.value = false;

  isLoadingSave.value = true;
  try {
    await userSvc.updatePassword(
      profileForm.value.id,
      {
        oldPassword: passwordForm.value.oldPassword,
        newPassword: passwordForm.value.newPassword,
      },
      { ignoreError: true },
    );

    passwordSuccess.value = true;
    passwordForm.value = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    securityFormRef.value?.reset();

    setTimeout(() => {
      passwordSuccess.value = false;
    }, 3000);
  } catch (error: any) {
    passwordError.value = "Gagal menyimpan data";
  } finally {
    isLoadingSave.value = false;
  }
}

async function handlePhotoSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    passwordError.value = "File foto tidak valid";
    setTimeout(() => {
      passwordError.value = "";
    }, 3000);
    return;
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    passwordError.value = "Ukuran file terlalu besar";
    setTimeout(() => {
      passwordError.value = "";
    }, 3000);
    return;
  }

  isUploadingPhoto.value = true;
  try {
    const formData = new FormData();
    formData.append("id", profileForm.value.id);
    formData.append("file", file);

    await userSvc.updatePhoto(formData);

    displayProfile.value.name = displayProfile.value.name;
    passwordSuccess.value = true;
    loadProfile();
  } catch (error: any) {
    passwordError.value = "Gagal menyimpan data";
    setTimeout(() => {
      passwordError.value = "";
    }, 3000);
  } finally {
    isUploadingPhoto.value = false;
    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
  }
}

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
        Profil Saya
      </h1>
      <p class="text-slate-500 dark:text-slate-400">
        Kelola informasi akun Anda
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Card -->
      <div class="lg:col-span-1">
        <UiCard>
          <div class="text-center py-6">
            <div class="relative inline-block">
              <img
                :src="
                  displayProfile.foto
                    ? `/api/files?path=${displayProfile.foto}`
                    : '/images/default-user.jpg'
                "
                :alt="displayProfile.name"
                class="aspect-square object-cover w-30 mx-auto rounded-full"
              />
              <button
                @click="fileInputRef?.click()"
                :disabled="isUploadingPhoto"
                class="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UiIcon v-if="!isUploadingPhoto" name="mdi-camera" size="sm" />
                <svg
                  v-else
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </button>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                class="hidden"
                @change="handlePhotoSelect"
              />
            </div>

            <h3
              class="mt-4 text-xl font-semibold text-slate-900 dark:text-white"
            >
              {{ displayProfile.name }}
            </h3>
            <p class="text-slate-500 dark:text-slate-400">
              {{
                typeof authStore.user?.role === "object"
                  ? authStore.user?.role?.name
                  : authStore.user?.role || "Pengguna"
              }}
            </p>

            <div class="mt-6 space-y-3 text-left px-4">
              <div
                class="flex items-center gap-3 text-sm"
                v-if="displayProfile.personNumber"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                >
                  <UiIcon
                    name="mdi-card-account-details-outline"
                    size="sm"
                    color="info"
                  />
                </div>
                <span class="text-slate-600 dark:text-slate-400">{{
                  displayProfile.personNumber
                }}</span>
              </div>
              <div
                class="flex items-center gap-3 text-sm"
                v-if="displayProfile.personnelType"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
                >
                  <UiIcon name="mdi-file-sign" size="sm" color="primary" />
                </div>
                <span class="text-slate-600 dark:text-slate-400">{{
                  displayProfile.personnelType
                }}</span>
              </div>
              <div
                class="flex items-center gap-3 text-sm"
                v-if="displayProfile.companyName"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
                >
                  <UiIcon
                    name="mdi-city-variant-outline"
                    size="sm"
                    color="warning"
                  />
                </div>
                <span class="text-slate-600 dark:text-slate-400">{{
                  displayProfile.companyName
                }}</span>
              </div>
              <div
                class="flex items-center gap-3 text-sm"
                v-if="displayProfile.departmentName"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                >
                  <UiIcon name="mdi-domain" size="sm" color="success" />
                </div>
                <span class="text-slate-600 dark:text-slate-400">{{
                  displayProfile.departmentName
                }}</span>
              </div>
              <div
                class="flex items-center gap-3 text-sm"
                v-if="displayProfile.sectionName"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center"
                >
                  <UiIcon name="mdi-factory" size="sm" color="info" />
                </div>
                <span class="text-slate-600 dark:text-slate-400">{{
                  displayProfile.sectionName
                }}</span>
              </div>
              <div
                class="flex items-center gap-3 text-sm"
                v-if="displayProfile.workAreaName"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center"
                >
                  <UiIcon
                    name="mdi-briefcase-outline"
                    size="sm"
                    color="error"
                  />
                </div>
                <span class="text-slate-600 dark:text-slate-400">{{
                  displayProfile.workAreaName
                }}</span>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Tabs Navigation -->
        <div class="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
            :class="
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            "
            @click="activeTab = tab.id"
          >
            <svg
              v-if="tab.icon === 'user'"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <svg
              v-if="tab.icon === 'lock'"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <svg
              v-if="tab.icon === 'clock'"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {{ tab.label }}
          </button>
        </div>

        <!-- Account Tab -->
        <template v-if="activeTab === 'account'">
          <UiCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                >
                  <UiIcon
                    name="mdi-account-outline"
                    size="lg"
                    color="primary"
                  />
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900 dark:text-white">
                    Ubah Profil
                  </h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    Perbarui informasi profil Anda
                  </p>
                </div>
              </div>
            </template>
            <UiForm ref="accountFormRef">
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UiInput
                    v-model="profileForm.name"
                    label="Nama"
                    placeholder="Masukkan Nama"
                    required
                    :rules="nameRules"
                  />
                  <UiInput
                    v-model="profileForm.username"
                    label="Username"
                    placeholder="Masukkan Username"
                    required
                    :rules="usernameRules"
                  />
                  <UiInput
                    v-model="profileForm.email"
                    type="email"
                    label="Email"
                    placeholder="Masukkan Email"
                    required
                    :rules="emailRules"
                    class="md:col-span-2"
                  />
                </div>
                <div class="flex gap-3 justify-end pt-2">
                  <UiButton
                    color="primary"
                    :loading="isLoadingSave"
                    @click="saveProfile"
                  >
                    Simpan Perubahan
                  </UiButton>
                </div>
              </div>
            </UiForm>
          </UiCard>
        </template>

        <!-- Security Tab -->
        <template v-if="activeTab === 'security'">
          <UiCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                >
                  <UiIcon name="mdi-lock-outline" size="lg" color="error" />
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900 dark:text-white">
                    Ubah Password
                  </h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    Perbarui password akun Anda
                  </p>
                </div>
              </div>
            </template>

            <!-- Success Message -->
            <div
              v-if="passwordSuccess"
              class="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl"
            >
              <div class="flex items-center gap-3">
                <UiIcon
                  name="mdi-check-circle-outline"
                  size="lg"
                  color="success"
                />
                <p
                  class="text-sm text-emerald-700 dark:text-emerald-400 font-medium"
                >
                  Data berhasil diperbarui
                </p>
              </div>
            </div>

            <!-- Error Message -->
            <div
              v-if="passwordError"
              class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <div class="flex items-center gap-3">
                <svg
                  class="w-5 h-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p class="text-sm text-red-700 dark:text-red-400 font-medium">
                  {{ passwordError }}
                </p>
              </div>
            </div>

            <UiForm ref="securityFormRef">
              <div class="space-y-4">
                <!-- Old Password -->
                <UiInput
                  v-model="passwordForm.oldPassword"
                  :type="showOldPassword ? 'text' : 'password'"
                  label="Password Lama"
                  placeholder="Masukkan Password Lama"
                  required
                  :rules="oldPasswordRules"
                >
                  <template #suffix>
                    <button
                      type="button"
                      class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      @click="showOldPassword = !showOldPassword"
                    >
                      <svg
                        v-if="showOldPassword"
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </template>
                </UiInput>

                <!-- New Password -->
                <div>
                  <UiInput
                    v-model="passwordForm.newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    label="Password Baru"
                    placeholder="Masukkan Password Baru"
                    required
                    :rules="newPasswordRules"
                  >
                    <template #suffix>
                      <button
                        type="button"
                        class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        @click="showNewPassword = !showNewPassword"
                      >
                        <svg
                          v-if="showNewPassword"
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                        <svg
                          v-else
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </template>
                  </UiInput>
                  <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Minimal 8 karakter
                  </p>
                </div>

                <!-- Confirm New Password -->
                <UiInput
                  v-model="passwordForm.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  label="Konfirmasi Password Baru"
                  placeholder="Masukkan Konfirmasi Password Baru"
                  required
                  :rules="confirmPasswordRules"
                >
                  <template #suffix>
                    <button
                      type="button"
                      class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <svg
                        v-if="showConfirmPassword"
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </template>
                </UiInput>

                <div class="flex justify-end pt-2">
                  <UiButton
                    color="primary"
                    :loading="isLoadingSave"
                    @click="changePassword"
                  >
                    Perbarui Password
                  </UiButton>
                </div>
              </div>
            </UiForm>
          </UiCard>
        </template>
      </div>
    </div>
  </div>
</template>
