<template>
  <div class="w-full space-y-4 animate-fade-in pb-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <LayoutBreadcrumb :items="breadcrumbs" />
    </div>

    <UiCard>
      <div class="flex items-center gap-3 mb-6">
        <UiIcon
          name="mdi-arrow-left"
          class="text-xl cursor-pointer hover:text-primary-600 transition-colors"
          @click="handleCancel"
        />
        <h2 class="text-2xl font-bold">
          {{ isEditing ? "Ubah Master Jam Kerja / Shift" : "Tambah Master Jam Kerja / Shift" }}
        </h2>
      </div>

      <UiForm ref="formRef" class="mt-6">
        <!-- Header Section -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 pb-2">
            Informasi Shift
          </h3>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="form.code"
                label="Kode Shift"
                placeholder="Contoh: SHIFT-PAGI"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="form.name"
                label="Nama Shift"
                placeholder="Contoh: Shift Pagi Reguler"
                required
                :rules="[(v) => !!v || 'Wajib diisi']"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="form.institutionId"
                label="Institusi / Sekolah"
                placeholder="Pilih Institusi (Opsional)"
                :options="listInstitution"
                item-value="id"
                item-title="name"
                clearable
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiSwitch
                v-model="form.isActive"
                label="Status Shift"
                layout="stacked"
                :value-text="form.isActive ? 'Aktif' : 'Nonaktif'"
              />
            </UiCol>
          </UiRow>
        </div>

        <!-- Detail Section (7 Days Grid) -->
        <div class="mt-8 space-y-4">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 pb-2">
            Jadwal Harian (Detail Shift)
          </h3>

          <div class="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table class="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                <tr>
                  <th class="py-3 px-4 w-28">Hari</th>
                  <th class="py-3 px-4 w-24 text-center">Kerja</th>
                  <th class="py-3 px-4 min-w-[250px]">Preset Jam Kerja</th>
                  <th class="py-3 px-4 min-w-[180px]">Jam Kerja (Wajib)</th>
                  <th class="py-3 px-4 min-w-[220px]">Rentang Presensi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                <tr v-for="(d, index) in form.details" :key="d.dayOfWeek" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td class="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                    {{ getDayName(d.dayOfWeek) }}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      v-model="d.isWorkingDay"
                      class="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
                    />
                  </td>
                  <td class="py-3 px-4">
                    <div v-if="d.isWorkingDay">
                      <UiAutocomplete
                        v-model="d.workTimeId"
                        placeholder="Pilih Preset Jam Kerja"
                        :options="listWorkTime"
                        item-value="id"
                        item-title="name"
                        clearable
                        size="sm"
                        @update:model-value="(val) => onWorkTimeChange(d, val)"
                      />
                    </div>
                    <span v-else class="text-slate-400 italic">Libur</span>
                  </td>
                  <td class="py-3 px-4">
                    <div v-if="d.isWorkingDay && (d.workStartTime || d.workEndTime)" class="font-semibold text-slate-800 dark:text-slate-200">
                      {{ d.workStartTime || '-' }} - {{ d.workEndTime || '-' }}
                    </div>
                    <span v-else-if="d.isWorkingDay" class="text-slate-400 italic">Pilih jam kerja</span>
                    <span v-else class="text-slate-400 italic">Libur</span>
                  </td>
                  <td class="py-3 px-4 text-xs space-y-1">
                    <div v-if="d.isWorkingDay && (d.checkinStart || d.checkoutStart)">
                      <div><span class="font-medium">Masuk:</span> {{ d.checkinStart || '-' }} - {{ d.checkinEnd || '-' }}</div>
                      <div><span class="font-medium">Pulang:</span> {{ d.checkoutStart || '-' }} - {{ d.checkoutEnd || '-' }}</div>
                    </div>
                    <span v-else-if="d.isWorkingDay" class="text-slate-400 italic">-</span>
                    <span v-else class="text-slate-400 italic">Libur</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </UiForm>

      <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
        <UiButton color="secondary" @click="handleCancel" class="px-8">
          Batal
        </UiButton>
        <UiButton
          color="primary"
          :loading="isLoadingSave"
          @click="onSubmit"
          class="px-8"
        >
          Simpan
        </UiButton>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import workShiftService from "@/services/work-shift.service";
import workTimeService from "@/services/work-time.service";
import institutionService from "@/services/institution.service";
import { useSwal } from "~/composables/useSwal";

definePageMeta({
  layout: "admin",
  permission: "WORK_SHIFT.VIEW",
});

const pageTitle = "Form Master Jam Kerja / Shift";

useHead({
  title: pageTitle,
});

const route = useRoute();
const router = useRouter();
const swal = useSwal();
const workShiftSvc = workShiftService();
const workTimeSvc = workTimeService();
const institutionSvc = institutionService();

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: "Jam Kerja", to: "/master/work-shift" },
  { label: isEditing.value ? "Ubah" : "Tambah" },
]);

const isLoadingSave = ref(false);
const isEditing = computed(() => !!route.query.id);
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);

const listInstitution: any = ref([]);
const listWorkTime: any = ref([]);

const statusOptions = [
  { id: true, name: "Aktif" },
  { id: false, name: "Nonaktif" },
];

const dayNames: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

function getDayName(day: number) {
  return dayNames[day] || "Hari " + day;
}

const defaultDetails = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
  dayOfWeek: day,
  isWorkingDay: day <= 5,
  workTimeId: null as number | null,
  workStartTime: "",
  workEndTime: "",
  checkinStart: "",
  checkinEnd: "",
  checkoutStart: "",
  checkoutEnd: "",
}));

const defaultItem = {
  id: null as string | null,
  code: "",
  name: "",
  institutionId: null as number | null,
  isActive: true,
  details: defaultDetails,
};

const form: any = ref({ ...defaultItem });

onMounted(async () => {
  await loadOptions();
  if (route.query.id) {
    loadData(route.query.id);
  }
});

async function loadOptions() {
  await Promise.all([
    institutionSvc.retrieveAll().then((res: any) => {
      if (res.data) listInstitution.value = res.data;
    }).catch(() => {}),
    workTimeSvc.retrieveAll().then((res: any) => {
      if (res.data) listWorkTime.value = res.data;
    }).catch(() => {}),
  ]);
}

function onWorkTimeChange(detailRow: any, workTimeId: any) {
  if (!workTimeId) {
    detailRow.workStartTime = "";
    detailRow.workEndTime = "";
    detailRow.checkinStart = "";
    detailRow.checkinEnd = "";
    detailRow.checkoutStart = "";
    detailRow.checkoutEnd = "";
    return;
  }
  const wt = listWorkTime.value.find((item: any) => Number(item.id) === Number(workTimeId));
  if (wt) {
    detailRow.workStartTime = wt.workStartTime ?? wt.work_start_time ?? "";
    detailRow.workEndTime = wt.workEndTime ?? wt.work_end_time ?? "";
    detailRow.checkinStart = wt.checkinStart ?? wt.checkin_start ?? "";
    detailRow.checkinEnd = wt.checkinEnd ?? wt.checkin_end ?? "";
    detailRow.checkoutStart = wt.checkoutStart ?? wt.checkout_start ?? "";
    detailRow.checkoutEnd = wt.checkoutEnd ?? wt.checkout_end ?? "";
  }
}

async function loadData(id: any) {
  await workShiftSvc
    .retrieveById(id)
    .then((res: any) => {
      if (res.data) {
        const fetchedDetails = res.data.details || [];
        const detailsMap: Record<number, any> = {};
        fetchedDetails.forEach((d: any) => {
          detailsMap[d.dayOfWeek] = d;
        });

        const mergedDetails = [1, 2, 3, 4, 5, 6, 7].map((day) => {
          const existing = detailsMap[day];
          if (existing) {
            return {
              dayOfWeek: day,
              isWorkingDay: existing.isWorkingDay ?? existing.is_working_day ?? true,
              workTimeId: existing.workTimeId ?? existing.work_time_id ?? null,
              workStartTime: existing.workStartTime ?? existing.work_start_time ?? "",
              workEndTime: existing.workEndTime ?? existing.work_end_time ?? "",
              checkinStart: existing.checkinStart ?? existing.checkin_start ?? "",
              checkinEnd: existing.checkinEnd ?? existing.checkin_end ?? "",
              checkoutStart: existing.checkoutStart ?? existing.checkout_start ?? "",
              checkoutEnd: existing.checkoutEnd ?? existing.checkout_end ?? "",
            };
          }
          return {
            dayOfWeek: day,
            isWorkingDay: day <= 5,
            workTimeId: null,
            workStartTime: "",
            workEndTime: "",
            checkinStart: "",
            checkinEnd: "",
            checkoutStart: "",
            checkoutEnd: "",
          };
        });

        form.value = {
          ...res.data,
          institutionId: res.data.institutionId ?? res.data.institution_id ?? null,
          isActive: res.data.isActive ?? res.data.is_active ?? true,
          details: mergedDetails,
        };
      }
    })
    .catch((err: any) => {
      console.error("Failed to load shift data", err);
    });
}

function handleCancel() {
  router.back();
}

async function onSubmit() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isLoadingSave.value = true;

  workShiftSvc
    .save(form.value)
    .then(() => {
      swal.toast(
        isEditing.value ? "Data berhasil diperbarui" : "Data berhasil disimpan",
        "success"
      );
      router.push("/master/work-shift");
    })
    .catch((err: any) => {
      swal.toast(err.response?._data?.error || "Gagal menyimpan data", "error");
    })
    .finally(() => {
      isLoadingSave.value = false;
    });
}
</script>
