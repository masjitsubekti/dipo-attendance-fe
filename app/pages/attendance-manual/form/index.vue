<template>
  <div class="w-full space-y-5 animate-fade-in pb-12">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <LayoutBreadcrumb :items="breadcrumbs" />
    </div>

    <UiCard>
      <!-- Header -->
      <div class="flex items-center justify-between pb-2">
        <div class="flex items-center gap-3">
          <UiIconButton
            icon="mdi-arrow-left"
            variant="ghost"
            tooltip="Kembali"
            size="lg"
            @click="handleCancel"
          />
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">
              {{ isEditing ? "Ubah Dispensasi Presensi" : "Form Dispensasi Presensi" }}
            </h2>
          </div>
        </div>
      </div>

      <UiForm ref="formRef" class="mt-6 space-y-6">
        <!-- Info Alert for Time Input -->
        <div class="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
          <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <i class="mdi mdi-information text-base"></i>
          </div>
          <div class="space-y-1">
            <p class="font-semibold text-blue-950 dark:text-blue-100">
              Petunjuk Pengisian Jam Masuk & Jam Pulang:
            </p>
            <ul class="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-300">
              <li>Pengisian <strong>Jam Masuk</strong> dan <strong>Jam Pulang</strong> bersifat opsional.</li>
              <li>Kosongkan <strong>Jam Masuk</strong> jika hanya ingin mengisikan/memperbarui jam pulang tanpa mengubah data jam masuk lama pegawai.</li>
              <li>Kosongkan <strong>Jam Pulang</strong> jika pegawai belum atau tidak ada jam pulang.</li>
            </ul>
          </div>
        </div>

        <!-- Section 1: Rincian Presensi & Waktu -->
        <div class="space-y-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <i class="mdi mdi-clock-outline text-base"></i>
            </div>
            <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Rincian Presensi & Waktu
            </h3>
          </div>

          <UiRow>
            <!-- Tanggal Presensi -->
            <UiCol cols="12" md="6">
              <UiDatePicker
                v-model="form.attendanceDate"
                mode="date"
                label="Tanggal Presensi"
                placeholder="Pilih Tanggal"
                required
                :rules="[(v: any) => !!v || 'Wajib diisi']"
                :clearable="false"
              />
            </UiCol>

            <!-- Jenis Presensi / Izin Master -->
            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="form.attendanceTypeId"
                label="Jenis Kehadiran"
                placeholder="Pilih Jenis Kehadiran"
                :options="listAttendanceType"
                item-value="id"
                item-title="name"
                :rules="[(v: any) => !!v || 'Wajib diisi']"
                required
                clearable
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <!-- Jam Masuk -->
            <UiCol cols="12" md="3">
              <UiInput
                v-model="form.checkinTime"
                type="time"
                label="Jam Masuk"
                placeholder="00:00"
                clearable
              />
            </UiCol>

            <!-- Jam Pulang -->
            <UiCol cols="12" md="3">
              <UiInput
                v-model="form.checkoutTime"
                type="time"
                label="Jam Pulang"
                placeholder="00:00"
                clearable
              />
            </UiCol>

            <!-- Status Kehadiran -->
            <UiCol cols="12" md="3">
              <UiAutocomplete
                v-model="form.status"
                label="Status Kehadiran"
                placeholder="Pilih Status"
                :options="listStatus"
                item-value="id"
                item-title="name"
                required
                :rules="[(v: any) => !!v || 'Wajib diisi']"
              />
            </UiCol>

            <!-- Menit Terlambat -->
            <UiCol cols="12" md="3">
              <UiNumberInput
                v-model="form.lateMinutes"
                label="Menit Keterlambatan"
                placeholder="0"
                :min="0"
                :disabled="form.status !== 'late'"
                hint="Aktif jika status Terlambat"
              />
            </UiCol>
          </UiRow>

          <UiRow mb="0">
            <UiCol cols="12">
              <UiTextarea
                v-model="form.note"
                label="Catatan Dispensasi"
                placeholder="Masukkan catatan atau alasan dispensasi"
                :rows="2"
                required
                :rules="[(v: any) => !!v || 'Wajib diisi']"
              />
            </UiCol>
          </UiRow>
        </div>

        <!-- Section 2: Pemilihan Pegawai -->
        <div class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <i class="mdi mdi-account-group-outline text-base"></i>
              </div>
              <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Pilih Pegawai
              </h3>
              <span v-if="!isEditing && selectedPersons.length > 0" class="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-full">
                {{ selectedPersons.length }} Pegawai Dipilih
              </span>
            </div>

            <div v-if="!isEditing" class="flex items-center gap-2">
              <UiButton
                v-if="selectedPersons.length > 0"
                type="button"
                variant="outline"
                color="danger"
                size="xs"
                @click="selectedPersons = []"
              >
                <i class="mdi mdi-delete-sweep mr-1"></i> Reset Pilihan
              </UiButton>
              <UiButton
                type="button"
                color="primary"
                size="sm"
                @click="showPersonLookup = true"
              >
                <i class="mdi mdi-account-multiple-plus mr-1.5"></i>
                Pilih Pegawai
              </UiButton>
            </div>
          </div>

          <!-- Multiple Selection Table (Create Mode) -->
          <div v-if="!isEditing">
            <div v-if="selectedPersons.length > 0" class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
              <div class="max-h-60 overflow-y-auto">
                <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead class="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th class="py-2.5 px-3 w-10 text-center">#</th>
                      <th class="py-2.5 px-3">NIP</th>
                      <th class="py-2.5 px-3">Nama Pegawai</th>
                      <th class="py-2.5 px-3">Institusi</th>
                      <th class="py-2.5 px-3">Departemen</th>
                      <th class="py-2.5 px-3">Jabatan</th>
                      <th class="py-2.5 px-3 w-16 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr
                      v-for="(person, idx) in selectedPersons"
                      :key="person.id"
                      class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td class="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{{ idx + 1 }}</td>
                      <td class="py-2 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">{{ person.nip || '—' }}</td>
                      <td class="py-2 px-3 font-medium text-slate-900 dark:text-white">{{ person.name }}</td>
                      <td class="py-2 px-3 text-slate-600 dark:text-slate-400">{{ person.institutionName || '—' }}</td>
                      <td class="py-2 px-3 text-slate-600 dark:text-slate-400">{{ person.departmentName || '—' }}</td>
                      <td class="py-2 px-3 text-slate-600 dark:text-slate-400">{{ person.positionName || '—' }}</td>
                      <td class="py-2 px-3 text-center">
                        <UiIconButton
                          icon="mdi-close"
                          color="danger"
                          variant="ghost"
                          size="xs"
                          tooltip="Hapus dari daftar"
                          @click="handleRemovePerson(person.id)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Empty State for Person Selection -->
            <div
              v-else
              class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-center space-y-2 cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
              @click="showPersonLookup = true"
            >
              <div class="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl">
                <i class="mdi mdi-account-search-outline"></i>
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Belum ada pegawai yang dipilih
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Klik tombol <strong>"Pilih Pegawai"</strong> untuk memilih pegawai secara multi-select
                </p>
              </div>
            </div>
          </div>

          <!-- Single Person Read-Only Info Table (Edit Mode) -->
          <div v-else class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th class="py-2.5 px-3 w-10 text-center">#</th>
                  <th class="py-2.5 px-3">NIP</th>
                  <th class="py-2.5 px-3">Nama Pegawai</th>
                  <th class="py-2.5 px-3">Institusi</th>
                  <th class="py-2.5 px-3">Departemen</th>
                  <th class="py-2.5 px-3">Jabatan</th>
                </tr>
              </thead>
              <tbody>
                <tr class="bg-white dark:bg-slate-900">
                  <td class="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">1</td>
                  <td class="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">{{ form.personNip || '—' }}</td>
                  <td class="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{{ form.personName || '—' }}</td>
                  <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400">{{ form.institutionName || '—' }}</td>
                  <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400">{{ form.departmentName || '—' }}</td>
                  <td class="py-2.5 px-3 text-slate-600 dark:text-slate-400">{{ form.positionName || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </UiForm>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
        <UiButton
          type="button"
          color="secondary"
          class="px-6"
          @click="handleCancel"
        >
          Batal
        </UiButton>
        <UiButton
          type="button"
          color="primary"
          :loading="isLoadingSave"
          @click="onSubmit"
        >
          <i class="mdi mdi-content-save mr-1.5"></i> Simpan
        </UiButton>
      </div>
    </UiCard>

    <!-- Person Lookup Dialog Component -->
    <PersonLookup
      v-model="showPersonLookup"
      :multiple="true"
      :exclude-ids="selectedPersons.map((p: any) => p.id)"
      title="Pilih Pegawai"
      @add-to-queue="handleAddPersons"
    />
  </div>
</template>

<script setup lang="ts">
import attendanceManualService from "@/services/attendance-manual.service";
import attendanceTypeService from "@/services/attendance-type.service";
import PersonLookup from "@/components/dialog/PersonLookup.vue";
import { useSwal } from "~/composables/useSwal";
import { useFormat } from "~/composables/useFormat";

definePageMeta({
  layout: "admin",
  permission: ["ATTENDANCE_MANUAL.CREATE", "ATTENDANCE_MANUAL.UPDATE"],
});

const pageTitle = "Form Presensi Manual & Dispensasi";

useHead({
  title: pageTitle,
});

const route = useRoute();
const router = useRouter();
const swal = useSwal();
const { formatDate } = useFormat();
const manualSvc = attendanceManualService();
const attendanceTypeSvc = attendanceTypeService();

const isLoadingSave = ref(false);
const showPersonLookup = ref(false);
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);

const isEditing = computed(() => !!route.query.id);

const selectedPersons = ref<any[]>([]);
const listAttendanceType = ref<any[]>([]);

const listStatus = [
  { id: "present", name: "Hadir" },
  { id: "late", name: "Terlambat" },
];

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Dispensasi Presensi", to: "/attendance-manual" },
  { label: isEditing.value ? "Ubah" : "Tambah" },
]);

const defaultItem = {
  id: null as number | null,
  personId: null as number | null,
  personName: "",
  personNip: "",
  departmentName: "",
  positionName: "",
  institutionName: "",
  attendanceDate: new Date().toISOString().slice(0, 10),
  attendanceTypeId: null as number | null,
  attendanceType: "regular",
  checkinTime: "",
  checkoutTime: "",
  status: "present",
  teachingStatus: null as string | null,
  lateMinutes: 0,
  note: "",
  mode: "manual",
};

const form = ref({ ...defaultItem });

watch(
  () => form.value.status,
  (newStatus) => {
    if (newStatus !== "late") {
      form.value.lateMinutes = 0;
    }
  }
);

onMounted(async () => {
  await loadOptions();
  if (route.query.id) {
    loadData(route.query.id);
  }
});

async function loadOptions() {
  try {
    const res: any = await attendanceTypeSvc.retrieveAll({
      category: "attendance",
    });
    const items = res.data || res || [];
    listAttendanceType.value = items;

    if (!isEditing.value && !form.value.attendanceTypeId) {
      const regType = items.find((item: any) => item.code === "REG" || item.code?.toUpperCase() === "REG");
      if (regType) {
        form.value.attendanceTypeId = regType.id;
      }
    }
  } catch (err) {
    console.error("Failed to load attendance types", err);
  }
}

async function loadData(id: any) {
  try {
    const res: any = await manualSvc.retrieveById(id);
    if (res.data) {
      const item = res.data;
      form.value = {
        ...item,
        attendanceDate: item.attendanceDate ? formatDate(item.attendanceDate, "YYYY-MM-DD") : "",
        checkinTime: item.checkinTime ? formatDate(item.checkinTime, "HH:mm", true) : "",
        checkoutTime: item.checkoutTime ? formatDate(item.checkoutTime, "HH:mm", true) : "",
        lateMinutes: item.lateMinutes || 0,
      };
    }
  } catch (err: any) {
    console.error("Failed to load attendance record", err);
    swal.toast("Gagal memuat data presensi", "error");
  }
}

function handleAddPersons(persons: any[]) {
  if (!Array.isArray(persons)) return;
  for (const p of persons) {
    if (!selectedPersons.value.some((existing) => existing.id === p.id)) {
      selectedPersons.value.push(p);
    }
  }
}

function handleRemovePerson(id: number) {
  selectedPersons.value = selectedPersons.value.filter((p) => p.id !== id);
}

function handleCancel() {
  router.push("/attendance-manual");
}

async function onSubmit() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  if (!isEditing.value && selectedPersons.value.length === 0) {
    swal.toast("Silakan pilih minimal 1 pegawai terlebih dahulu", "warning");
    return;
  }

  isLoadingSave.value = true;

  const payload: any = {
    ...form.value,
    attendanceType: form.value.attendanceType || "regular",
    mode: "manual",
  };

  if (!isEditing.value) {
    payload.personIds = selectedPersons.value.map((p) => p.id);
  }

  manualSvc
    .save(payload)
    .then((res: any) => {
      const total = res.data?.totalCreated || selectedPersons.value.length || 1;
      swal.toast(
        isEditing.value
          ? "Data presensi berhasil diperbarui"
          : `Presensi manual berhasil disimpan untuk ${total} pegawai`,
        "success",
      );
      router.back();
    })
    .catch((err: any) => {
      console.error("Failed to save manual attendance", err);
      swal.toast(err.message || "Gagal menyimpan data presensi manual", "error");
    })
    .finally(() => {
      isLoadingSave.value = false;
    });
}
</script>
