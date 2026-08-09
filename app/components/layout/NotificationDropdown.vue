<script setup lang="ts">
import notificationService from "@/services/notification.service";
import { useFormat } from "~/composables/useFormat";
import { useAuthStore } from "~/stores/auth";

// const { $firebase } = useNuxtApp() as any;
const authStore = useAuthStore();
const router = useRouter();
const notificationSvc = notificationService();
const { formatDateTemplate } = useFormat();
const showDropdown = ref(false);
const dropdownContainer = ref<HTMLElement | null>(null);

const notifications: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const unreadCount = computed(() => notifications.value.items.filter((n: any) => !n.readAt).length);

function getNotificationByUser() {
  notificationSvc
    .retrieveByUser({
      pageNumber: 1,
      pageSize: 10,
      ignorePagging: true
    })
    .then((res: any) => {
      notifications.value = res.data;
    });
}

function readNotif(item: any) {
  redirectNotif(item);
  notificationSvc
    .read([{ id: item.id }])
    .then((res) => {
      getNotificationByUser();
    });
}

function boldKeywords(text: string, keywords: string[]) {
  let result = text;
  keywords.forEach((keyword) => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    result = result.replace(regex, '<strong style="color: black;">$1</strong>');
  });
  return result;
}

function getFormattedTitle(title: string) {
  return boldKeywords(title, ['ditolak', 'disetujui']);
}

function getFormattedMessage(message: string) {
  return boldKeywords(message, ['ditolak', 'disetujui', 'berhasil diajukan']);
}

function redirectNotif(item: any) {
  let path = "";

  if (
    item.entityType === "PERSONNEL_MUTATION"
  ) {
    path = `/mutation-employee`;
  }

  router.push(path);
}

function readAllNotif() {
  notificationSvc
    .retrieveByUser({
      pageNumber: 1,
      pageSize: 10,
      ignorePagging: true
    })
    .then((res: any) => {
      const allNotif: any = [];
      res.data.items.forEach((el: any) => {
        allNotif.push({ id: el.id });
      });
      if (allNotif.length == 0) {
        return;
      }
      notificationSvc
        .read(allNotif)
        .then((res) => {
          getNotificationByUser();
        });
    });
}

onMounted(() => {
  // getNotificationByUser();

  // const off = $firebase.onFcmMessage((e: any) => {
  //   const data = e.payload?.data || {};

  //   if (e.source == "foreground") {
  //     getNotificationByUser();
  //   }
  // });

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
      showDropdown.value = false;
    }
  };

  document.addEventListener('click', handleClickOutside);

  onBeforeUnmount(() => {
    // off();
    document.removeEventListener('click', handleClickOutside);
  });
});
</script>

<template>
  <div ref="dropdownContainer" class="relative notification-dropdown-container">
    <button
      class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
      @click="showDropdown = !showDropdown">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span v-if="unreadCount > 0"
        class="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
        {{ unreadCount }}
      </span>
    </button>

    <!-- Notifications Dropdown -->
    <Transition enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-2" enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95">
      <div v-if="showDropdown"
        class="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 class="font-semibold text-slate-900 dark:text-white">Notifikasi</h3>
          <UiBadge variant="primary" v-if="unreadCount > 0">
            {{ unreadCount }} Baru
          </UiBadge>
        </div>

        <!-- Notification List -->
        <div class="max-h-80 overflow-y-auto">
          <div v-if="notifications.items.length === 0" class="px-4 py-12 text-center">
            <svg class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p class="text-slate-500 dark:text-slate-400 text-sm">Tidak ada notifikasi</p>
          </div>
          <div v-for="notif in notifications.items" :key="notif.id"
            class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
            :class="{ 'bg-primary-50/50 dark:bg-primary-950/30': !notif.readAt }" @click="readNotif(notif)">
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 mt-2 rounded-full shrink-0" :class="notif.readAt ? 'bg-transparent' : 'bg-primary-500'">
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900 dark:text-white" v-html="getFormattedTitle(notif.title)"></p>
                <p class="text-sm text-slate-600 dark:text-slate-400" v-html="getFormattedMessage(notif.message)"></p>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">{{ formatDateTemplate(notif.createdAt, 'relative') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="unreadCount > 0" class="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button class="w-full text-sm text-primary-500 hover:text-primary-600 font-medium cursor-pointer" @click="readAllNotif">
            Tandai Telah Dibaca
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>