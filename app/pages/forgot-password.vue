<template>
  <div class="bg-white rounded-[28px] shadow-2xl p-8 sm:p-10 relative overflow-hidden">
    
    <div class="text-center mb-8">
      <h2 class="text-[28px] font-bold text-slate-800 mb-3">Lupa Kata Sandi</h2>
      <p class="text-[15px] text-gray-500 font-medium leading-relaxed px-2">Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi.</p>
    </div>

    <!-- Form -->
    <UiForm ref="formRef" class="space-y-5" @submit="handleSubmit">
      <!-- Email Input -->
      <UiInput
        v-model="form.email"
        name="email"
        type="email"
        label="Email"
        placeholder="Masukkan email Anda"
        :rules="emailRules"
        size="lg"
      >
        <template #prefix>
          <UiIcon name="mdi-email-outline" size="md" />
        </template>
      </UiInput>

      <div class="flex flex-col gap-3 pt-4">
        <!-- Submit Button -->
        <UiButton
          type="submit"
          size="lg"
          :loading="isSubmitting"
          class="w-full !bg-blue-600 hover:!bg-blue-700 !border-blue-600 rounded-xl font-semibold shadow-md shadow-blue-200"
          :disabled="!form.email || isSubmitting"
        >
          Kirim Tautan Reset
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
</template>

<script setup lang="ts">
import { useSwal } from "~/composables/useSwal";
import userService from "~/services/user.service";

const router = useRouter();
const swal = useSwal();
const formRef = ref();

const form = reactive({
  email: "",
});

const emailRules = [
  (v: string) => !!v || "Email wajib diisi",
  (v: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(v) || "Format email tidak valid";
  },
];

const isSubmitting = ref(false);

definePageMeta({
  layout: "auth",
});

useHead({
  title: "Lupa Kata Sandi - Sistem Manajemen Sekolah",
});

const handleSubmit = async () => {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isSubmitting.value = true;

  try {
    await userService().sendResetLink({ email: form.email });

    swal.toast(
      "Tautan reset kata sandi telah dikirim ke email Anda.",
      "success"
    );

    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  } catch (err: any) {
    const errorMessage =
      err.data?.data?.message || err.data?.message || err.message || "Gagal mengirim tautan reset kata sandi.";
    swal.toast(errorMessage, "error");
  } finally {
    isSubmitting.value = false;
  }
};
</script>
