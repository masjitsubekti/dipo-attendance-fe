<script setup lang="ts">
import { useConfigStore } from "~/stores/config";
import { useRoute } from "vue-router";

const configStore = useConfigStore();
const route = useRoute();

const slides = computed(() => {
  const routeName = route.name as string;
  
  if (routeName === "login") {
    return [
      {
        title1: "Sistem Informasi",
        titleHighlight: "Manajemen Sekolah",
        title2: "Terpadu",
        description: "Platform pengelolaan akademik, presensi, dan tata kelola sekolah yang terintegrasi, cepat, dan akurat.",
      },
      {
        title1: "Manajemen Presensi",
        titleHighlight: "dan Akademik",
        title2: "Digital",
        description: "Memudahkan pemantauan kehadiran siswa & guru serta pengelolaan data nilai secara real-time.",
      },
      {
        title1: "Kemudahan Akses",
        titleHighlight: "Satu Pintu",
        title2: "Untuk Semua",
        description: "Kelola seluruh aktivitas sekolah dengan mudah, efisien, dan transparan dalam satu sistem.",
      },
    ];
  } else if (routeName === "forgot-password") {
    return [
      {
        title1: "Lupa Kata Sandi",
        titleHighlight: "Sistem Sekolah",
        title2: "",
        description: "Pulihkan akses akun Anda untuk kembali mengelola aktivitas akademik dan presensi sekolah.",
      },
      {
        title1: "Keamanan Akun",
        titleHighlight: "Terjamin",
        title2: "",
        description: "Kami memastikan proses reset kata sandi berjalan aman dan mudah.",
      },
    ];
  } else if (routeName === "reset-password") {
    return [
      {
        title1: "Pembaruan Kata Sandi",
        titleHighlight: "Akun Sekolah",
        title2: "",
        description: "Buat kata sandi baru yang aman untuk melanjutkan penggunaan Sistem Manajemen Sekolah.",
      },
    ];
  }
  
  return [];
});

const currentSlide = ref(0);
let slideInterval: any;

onMounted(() => {
  slideInterval = setInterval(() => {
    if (slides.value.length > 0) {
      currentSlide.value = (currentSlide.value + 1) % slides.value.length;
    }
  }, 4000);
  configStore.applyPrimaryColor();
  configStore.applyTheme();
});

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval);
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#DDF0FF]">
    <!-- Massive Right Circle -->
    <div class="absolute -top-[10%] -right-[20%] md:-top-[15%] md:-right-[10%] lg:-top-[25%] lg:-right-[15%] w-[230px] h-[230px] md:w-[300px] md:h-[300px] lg:w-[500px] lg:h-[500px] rounded-full bg-[#C0E0FF] pointer-events-none"></div>
    
    <!-- Massive Bottom Left Circle -->
    <div class="absolute -bottom-[10%] -left-[20%] md:-bottom-[15%] md:-left-[10%] lg:-bottom-[20%] lg:-left-[15%] w-[240px] h-[240px] md:w-[300px] md:h-[300px] lg:w-[500px] lg:h-[500px] rounded-full bg-[#C0E0FF] pointer-events-none"></div>
    
    <!-- Bottom Left Outline Circles -->
    <div class="absolute bottom-[2%] left-[5%] md:bottom-[5%] md:left-[15%] lg:left-[20%] opacity-20 md:opacity-40 pointer-events-none z-0">
      <div class="relative w-48 h-48 lg:w-80 lg:h-80">
        <div class="w-48 h-48 lg:w-80 lg:h-80 rounded-full border border-[#CBD5E1] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        <div class="w-32 h-32 lg:w-56 lg:h-56 rounded-full border border-[#CBD5E1] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>

    <div class="relative z-10 w-full max-w-[1200px] mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-16">
      
      <!-- Left Content -->
      <div class="flex flex-col max-w-lg lg:w-1/2">
        <UiAppLogo class="mb-6 md:mb-8 lg:mb-12" />

        <!-- Title & Description Slider -->
        <div class="hidden lg:block relative h-[250px]" v-if="slides.length > 0">
          <div v-for="(slide, index) in slides" :key="index" 
               class="absolute top-0 left-0 w-full transition-all duration-700 ease-in-out" 
               :class="currentSlide === index ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 -translate-x-4 z-0 pointer-events-none'">
            <h1 class="text-[30px] md:text-[36px] font-bold text-slate-800 mb-6 leading-[1.15]">
              {{ slide.title1 }}<br v-if="slide.title1" />
              <span class="text-blue-600">{{ slide.titleHighlight }}</span>
              <template v-if="slide.title2">
                {{ ' ' + slide.title2 }}
              </template>
            </h1>
            
            <p class="text-slate-600 text-[15px] md:text-[16px] max-w-[400px] leading-relaxed mb-10 font-medium">
              {{ slide.description }}
            </p>
          </div>

          <!-- Slider Dots -->
          <div class="absolute bottom-4 left-0 flex items-center gap-2.5 z-20">
            <button 
              v-for="(_, index) in slides" 
              :key="'dot-'+index"
              @click="currentSlide = index"
              class="h-2 rounded-full transition-all duration-300"
              :class="currentSlide === index ? 'w-8 bg-blue-600' : 'w-2 bg-slate-400 hover:bg-slate-600'"
              aria-label="Select slide"
            ></button>
          </div>
        </div>
      </div>

      <!-- Right Content (Card Wrapper via Slot) -->
      <div class="w-full max-w-[460px] shrink-0">
        <slot />
        
        <!-- Copyright -->
        <p class="mt-8 text-center text-sm text-slate-500 font-medium">
          Copyright © 2026 Sistem Manajemen Sekolah. All rights reserved.
        </p>
      </div>
      
    </div>

    <!-- Cookie Consent -->
    <UiCookieConsent />
  </div>
</template>
