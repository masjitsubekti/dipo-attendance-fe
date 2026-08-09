<template>
  <div v-if="token" class="bg-white rounded-[28px] shadow-2xl p-8 sm:p-10 relative overflow-hidden w-full">
    
    <div class="text-center mb-8">
      <h2 class="text-[28px] font-bold text-slate-800 mb-3">Reset Kata Sandi</h2>
      <p class="text-[15px] text-gray-500 font-medium leading-relaxed px-2">Buat kata sandi baru untuk akun Anda.</p>
    </div>

    <!-- Form -->
    <UiForm ref="formRef" class="space-y-5" @submit="handleSubmit">
      <!-- Password Input -->
      <UiInput
        v-model="form.password"
        name="password"
        :type="showPassword ? 'text' : 'password'"
        label="Kata Sandi Baru"
        placeholder="Masukkan kata sandi baru"
        :rules="passwordRules"
        size="lg"
      >
        <template #prefix>
          <UiIcon name="mdi-key-outline" size="md" />
        </template>
        <template #suffix>
          <UiIconButton
            :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            size="sm"
            variant="ghost"
            @click="showPassword = !showPassword"
          />
        </template>
      </UiInput>

      <!-- Confirm Password Input -->
      <UiInput
        v-model="form.confirmPassword"
        name="confirmPassword"
        :type="showConfirmPassword ? 'text' : 'password'"
        label="Konfirmasi Kata Sandi"
        placeholder="Masukkan ulang kata sandi baru"
        :rules="confirmPasswordRules"
        size="lg"
      >
        <template #prefix>
          <UiIcon name="mdi-key-outline" size="md" />
        </template>
        <template #suffix>
          <UiIconButton
            :icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
            size="sm"
            variant="ghost"
            @click="showConfirmPassword = !showConfirmPassword"
          />
        </template>
      </UiInput>

      <div class="flex flex-col gap-3 pt-4">
        <!-- Submit Button -->
        <UiButton
          type="submit"
          size="lg"
          :loading="isSubmitting"
          class="w-full !bg-blue-600 hover:!bg-blue-700 !border-blue-600 rounded-xl font-semibold shadow-md shadow-blue-200"
          :disabled="
            !form.password ||
            !form.confirmPassword ||
            isSubmitting
          "
        >
          Simpan Kata Sandi
        </UiButton>

        <!-- Back to Login -->
        <NuxtLink
          to="/login"
          class="text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors py-2"
        >
          Kembali ke Login
        </NuxtLink>
      </div>
    </UiForm>
  </div>

  <div v-else class="bg-white rounded-[28px] shadow-2xl p-8 sm:p-10 relative overflow-hidden text-center w-full">
    <p class="text-slate-600 dark:text-slate-400 font-medium text-lg">
      Memuat informasi token...
    </p>
  </div>
</template>

<script setup lang="ts">
import { useSwal } from "~/composables/useSwal";
import userService from "~/services/user.service";

const router = useRouter();
const route = useRoute();
const swal = useSwal();
const formRef = ref();

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isSubmitting = ref(false);

const token = computed(
  () => (route.query.token as string) || (route.params.token as string),
);

const form = reactive({
  password: "",
  confirmPassword: "",
});

// Validation rules
const passwordRules = [
  (v: string) => !!v || "Kata sandi baru wajib diisi",
  (v: string) => v.length >= 6 || "Kata sandi minimal 6 karakter",
];

const confirmPasswordRules = [
  (v: string) => !!v || "Konfirmasi kata sandi wajib diisi",
  (v: string) => v === form.password || "Konfirmasi kata sandi tidak cocok",
];

definePageMeta({
  layout: "auth",
});

useHead({
  title: "Reset Kata Sandi - Sistem Manajemen Sekolah",
});

onMounted(() => {
  // Validate token exists
  if (!token.value) {
    swal.toast("Token reset tidak valid atau tidak ditemukan.", "error");
    router.push("/login");
  }
});

const handleSubmit = async () => {
  const isValid = await formRef.value?.validate();
  if (!isValid || !token.value) return;

  isSubmitting.value = true;

  try {
    await userService().resetPasswordSubmit({
      token: token.value,
      newPassword: form.password,
    });

    swal.toast("Kata sandi berhasil diperbarui. Silakan login kembali.", "success");
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  } catch (err: any) {
    const errorMessage =
      err.data?.data?.message ||
      err.data?.message ||
      err.message ||
      "Gagal memperbarui kata sandi.";
    swal.toast(errorMessage, "error");
  } finally {
    isSubmitting.value = false;
  }
};
</script>
