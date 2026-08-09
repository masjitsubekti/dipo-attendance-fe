<template>
  <div class="bg-white rounded-[28px] shadow-2xl p-7 sm:p-9 relative overflow-hidden">
    <div class="text-center mb-7">
      <h2 class="text-[26px] font-bold text-slate-800 mb-2">Selamat Datang</h2>
      <p class="text-[15px] text-gray-500 font-medium leading-relaxed px-2">Silakan masuk menggunakan username dan kata sandi Anda.</p>
    </div>

    <UiForm ref="formRef" class="space-y-5" @submit="handleSubmit">            
      <UiInput
        v-model="form.username"
        name="username"
        type="text"
        label="Username"
        placeholder="Masukkan username anda"
        :rules="usernameRules"
        size="lg"
      >
        <template #prefix>
          <UiIcon name="mdi-account-outline" size="sm" class="text-gray-400" />
        </template>
      </UiInput>

      <UiInput
        v-model="form.password"
        name="password"
        :type="showPassword ? 'text' : 'password'"
        label="Kata Sandi"
        placeholder="Masukkan kata sandi anda"
        :rules="passwordRules"
        size="lg"
      >
        <template #prefix>
          <UiIcon name="mdi-lock-outline" size="sm" class="text-gray-400" />
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
      
      <div class="flex items-center justify-end">
        <NuxtLink
          to="/forgot-password"
          class="text-[13px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Lupa Kata Sandi?
        </NuxtLink>
      </div>

      <div class="pt-2">
        <UiButton 
          type="submit"
          size="lg"
          :loading="authStore.loading"
          :disabled="!form.username || !form.password"
          class="w-full"
        >
          Masuk
        </UiButton>
      </div>
    </UiForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useSwal } from '~/composables/useSwal';
import { useAuthStore } from "~/stores/auth";

definePageMeta({
  layout: "auth"
})

useHead({
  title: "Login - Sistem Manajemen Sekolah",
});

const authStore = useAuthStore();
const swal = useSwal();
const formRef = ref();
const showPassword = ref(false)

const form = reactive({
  username: '',
  password: '',
  remember: false,
})

const usernameRules = [(v: string) => !!v || 'Username wajib diisi'];
const passwordRules = [(v: string) => !!v || 'Kata sandi wajib diisi'];

const handleSubmit = async () => {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  try {
    await authStore.login(
      form.username,
      form.password,
    );
  } catch (err: any) {
    const errorMessage =
      err.data?.data?.message ||
      err.data?.message ||
      err.message ||
      'Gagal masuk. Silakan periksa kembali username dan kata sandi Anda.';
    swal.toast(errorMessage, "error");
  }
}
</script>

