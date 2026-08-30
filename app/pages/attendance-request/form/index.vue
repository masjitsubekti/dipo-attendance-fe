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
          {{ isEditing ? "Ubah Pengajuan Izin" : "Tambah Pengajuan Izin" }}
        </h2>
      </div>

      <UiForm ref="formRef" class="mt-6">
        <div class="space-y-4">
          <UiRow>
            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="form.personId"
                label="Pegawai / Pengajar"
                placeholder="Pilih Pegawai"
                :options="listPerson"
                item-value="id"
                :item-title="item => `${item.nip} - ${item.name}`"
                required
                :rules="[(v: any) => !!v || 'Pegawai wajib dipilih']"
                clearable
              />
            </UiCol>

            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="form.attendanceTypeId"
                label="Jenis Presensi / Izin / Dinas"
                placeholder="Pilih Jenis Pengajuan"
                :options="listAttendanceType"
                item-value="id"
                item-title="name"
                required
                :rules="[(v: any) => !!v || 'Jenis pengajuan wajib dipilih']"
                clearable
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="3">
              <UiDatePicker
                v-model="form.startDate"
                mode="date"
                label="Tanggal Mulai"
                placeholder="Pilih Tanggal Mulai"
                required
                :rules="[(v: any) => !!v || 'Wajib diisi']"
              />
            </UiCol>

            <UiCol cols="12" md="3">
              <UiDatePicker
                v-model="form.endDate"
                mode="date"
                label="Tanggal Selesai"
                placeholder="Pilih Tanggal Selesai"
                required
                :rules="[(v: any) => !!v || 'Wajib diisi']"
              />
            </UiCol>

            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="form.durationType"
                label="Tipe Durasi"
                placeholder="Pilih Tipe Durasi"
                :options="listDurationType"
                item-value="id"
                item-title="name"
                required
              />
            </UiCol>
          </UiRow>

          <!-- Partial Day Time Input -->
          <UiRow v-if="form.durationType === 'partial_day'">
            <UiCol cols="12" md="6">
              <UiInput
                v-model="form.startTime"
                type="time"
                label="Jam Mulai"
                placeholder="08:00"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="form.endTime"
                type="time"
                label="Jam Selesai"
                placeholder="12:00"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="12">
              <UiTextarea
                v-model="form.reason"
                label="Alasan / Keterangan"
                placeholder="Masukkan alasan atau keterangan pengajuan..."
                :rows="3"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="12">
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Lampiran Berkas / Surat Bukti (Opsional)
                </label>
                <UiFileUpload
                  v-model="uploadedFile"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  placeholder="Unggah berkas surat dokter, bukti izin, atau dokumen pendukung"
                  hint="Format didukung: PDF, PNG, JPG, DOC (Maks. 1MB)"
                  :max-size="1"
                  @error="handleFileError"
                />
                <div v-if="form.filePath" class="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <UiIcon name="mdi-paperclip" class="text-sm" />
                  <span>Berkas Tersimpan: {{ form.filePath }}</span>
                </div>
              </div>
            </UiCol>
          </UiRow>
        </div>
      </UiForm>

      <div class="flex justify-end gap-3 mt-4 pt-6 border-t border-slate-100 dark:border-slate-700">
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
import attendanceRequestService from "@/services/attendance-request.service";
import personService from "@/services/person.service";
import attendanceTypeService from "@/services/attendance-type.service";
import { useSwal } from "~/composables/useSwal";
import { useFormat } from "~/composables/useFormat";

definePageMeta({
  layout: "admin",
  permission: "PERSON_LEAVE.VIEW",
});

const pageTitle = "Form Pengajuan Izin";

useHead({
  title: pageTitle,
});

const route = useRoute();
const router = useRouter();
const swal = useSwal();
const { formatDate } = useFormat();
const attendanceRequestSvc = attendanceRequestService();
const personSvc = personService();
const attendanceTypeSvc = attendanceTypeService();

const isLoadingSave = ref(false);
const isEditing = computed(() => !!route.query.id);
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);
const uploadedFile = ref<File | File[] | null>(null);

const listPerson: any = ref([]);
const listAttendanceType: any = ref([]);

const listDurationType = [
  { id: "full_day", name: "Penuh (Seharian)" },
  { id: "partial_day", name: "Sebagian Hari (Jam)" },
];

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Kehadiran & Izin" },
  { label: "Pengajuan Izin", to: "/attendance-request" },
  { label: isEditing.value ? "Ubah" : "Tambah" },
]);

const defaultItem = {
  id: null as number | null,
  personId: null as number | null,
  attendanceTypeId: null as number | null,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  startTime: "",
  endTime: "",
  durationType: "full_day",
  reason: "",
  filePath: "",
  status: "pending",
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
    personSvc.retrieve({ pageSize: 1000, ignorePaging: true }).then((res: any) => {
      if (res.data?.items) listPerson.value = res.data.items;
      else if (Array.isArray(res.data)) listPerson.value = res.data;
    }).catch(() => {}),
    attendanceTypeSvc.retrieveAll({ category: 'leave,time_off,duty,absence' }).then((res: any) => {
      if (res.data) listAttendanceType.value = res.data;
    }).catch(() => {}),
  ]);
}

async function loadData(id: any) {
  await attendanceRequestSvc.retrieveById(id).then((res: any) => {
    if (res.data) {
      const item = res.data;
      form.value = {
        ...item,
        startDate: item.startDate ? formatDate(item.startDate, 'YYYY-MM-DD') : "",
        endDate: item.endDate ? formatDate(item.endDate, 'YYYY-MM-DD') : "",
      };
    }
  }).catch((err: any) => {
    console.error("Failed to load request data", err);
  });
}

function handleCancel() {
  router.back();
}

function handleFileError(msg: string) {
  swal.toast(msg || "Ukuran berkas melebihi batas maksimal 1MB", "warning");
}

async function onSubmit() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  let fileObj: File | null = null;
  if (uploadedFile.value) {
    fileObj = Array.isArray(uploadedFile.value) ? (uploadedFile.value[0] ?? null) : uploadedFile.value;
  }

  if (fileObj && fileObj.size > 1 * 1024 * 1024) {
    swal.toast(`Ukuran berkas "${fileObj.name}" melebihi batas maksimal (Maksimal 1MB)`, "warning");
    return;
  }

  isLoadingSave.value = true;

  attendanceRequestSvc
    .save(form.value, fileObj)
    .then(() => {
      swal.toast(
        isEditing.value
          ? "Data pengajuan berhasil diperbarui"
          : "Pengajuan izin berhasil disimpan",
        "success",
      );
      router.push("/attendance-request");
    })
    .catch((err: any) => {
      console.error("Failed to save data", err);
    })
    .finally(() => {
      isLoadingSave.value = false;
    });
}
</script>
