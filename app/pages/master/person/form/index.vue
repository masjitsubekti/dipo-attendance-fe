<template>
  <div class="w-full space-y-4 animate-fade-in pb-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <LayoutBreadcrumb :items="breadcrumbs" />
    </div>

    <UiCard class="w-full border border-slate-200 dark:border-slate-700 shadow-sm rounded-md p-6">
      <div class="flex items-center gap-3 mb-6">
        <UiIcon
          name="mdi-arrow-left"
          class="text-xl cursor-pointer hover:text-primary-600 transition-colors"
          @click="handleCancel"
        />
        <h2 class="text-2xl font-bold">
          {{ isEditing ? "Ubah Data Pegawai" : "Tambah Data Pegawai" }}
        </h2>
      </div>

      <UiForm ref="formRef" class="mt-6">
        <div class="space-y-4">
          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="form.nip"
                label="NIP"
                placeholder="Masukkan NIP (Opsional)"
                :rules="[(v) => !!v || 'Wajib diisi']"
                required
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="form.name"
                label="Nama Lengkap"
                placeholder="Masukkan Nama Lengkap"
                :rules="[(v) => !!v || 'Wajib diisi']"
                required
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="form.institutionId"
                label="Institusi / Sekolah"
                placeholder="Pilih Institusi"
                :options="listInstitution"
                item-value="id"
                item-title="name"
                :rules="[(v) => !!v || 'Wajib diisi']"
                required
                clearable
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="form.departmentId"
                label="Departemen / Divisi"
                placeholder="Pilih Departemen"
                :options="listDepartment"
                item-value="id"
                item-title="name"
                :rules="[(v) => !!v || 'Wajib diisi']"
                required
                clearable
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="form.positionId"
                label="Jabatan"
                placeholder="Pilih Jabatan"
                :options="listPosition"
                item-value="id"
                item-title="name"
                :rules="[(v) => !!v || 'Wajib diisi']"
                required
                clearable
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="form.status"
                label="Status Pegawai"
                placeholder="Pilih Status"
                :options="statusOptions"
                item-value="id"
                item-title="name"
                :rules="[(v) => !!v || 'Wajib diisi']"
                required
                clearable
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiDatePicker
                v-model="form.birthDate"
                mode="date"
                label="Tanggal Lahir"
                placeholder="Pilih Tanggal Lahir"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiDatePicker
                v-model="form.tmt"
                mode="date"
                label="TMT (Terhitung Mulai Tanggal)"
                placeholder="Pilih TMT"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="form.phone"
                label="Nomor Telepon"
                placeholder="Masukkan Nomor Telepon"
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="form.email"
                label="Email"
                placeholder="Masukkan Email"
                type="email"
              />
            </UiCol>
          </UiRow>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiAutocomplete
                v-model="form.gender"
                label="Jenis Kelamin"
                placeholder="Pilih Jenis Kelamin"
                :options="genderOptions"
                item-value="id"
                item-title="name"
                clearable
              />
            </UiCol>
            <UiCol cols="12" md="6">
              <UiTextarea
                v-model="form.address"
                label="Alamat"
                placeholder="Masukkan Alamat"
                :rows="1"
                :auto-resize="true"
              />
            </UiCol>
          </UiRow>
        </div>
      </UiForm>

      <div class="flex justify-end gap-3 mt-2 pt-6 border-t border-slate-100 dark:border-slate-700">
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
import personService from "@/services/person.service";
import institutionService from "@/services/institution.service";
import positionService from "@/services/position.service";
import departmentService from "@/services/department.service";
import { useSwal } from "~/composables/useSwal";

definePageMeta({
  layout: "admin",
  permission: "PERSON.VIEW",
});

const pageTitle = "Form Data Pegawai";

useHead({
  title: pageTitle,
});

const route = useRoute();
const router = useRouter();
const swal = useSwal();
const { formatDate } = useFormat();
const personSvc = personService();
const institutionSvc = institutionService();
const positionSvc = positionService();
const departmentSvc = departmentService();

const isLoadingSave = ref(false);
const isEditing = computed(() => !!route.query.id);
const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);

const listInstitution: any = ref([]);
const listPosition: any = ref([]);
const listDepartment: any = ref([]);

const genderOptions = [
  { id: "L", name: "Laki-laki" },
  { id: "P", name: "Perempuan" },
];

const statusOptions = [
  { id: "aktif", name: "Aktif" },
  { id: "nonaktif", name: "Nonaktif" },
  { id: "cuti", name: "Cuti" },
  { id: "pensiun", name: "Pensiun" },
];

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: "Pegawai", to: "/master/person" },
  { label: isEditing.value ? "Ubah" : "Tambah" },
]);

const defaultItem = {
  id: null as number | null,
  nip: "",
  name: "",
  gender: null as string | null,
  birthDate: null as string | null,
  tmt: null as string | null,
  phone: "",
  email: "",
  address: "",
  institutionId: null as number | null,
  positionId: null as number | null,
  departmentId: null as number | null,
  status: "aktif",
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
    positionSvc.retrieveAll().then((res: any) => {
      if (res.data) listPosition.value = res.data;
    }).catch(() => {}),
    departmentSvc.retrieveAll().then((res: any) => {
      if (res.data) listDepartment.value = res.data;
    }).catch(() => {}),
  ]);
}

async function loadData(id: any) {
  await personSvc.retrieveById(id).then((res: any) => {
    if (res.data) {
      form.value = {
        ...res.data,
        institutionId: res.data.institutionId ?? null,
        positionId: res.data.positionId ?? null,
        departmentId: res.data.departmentId ?? null,
        birthDate: res.data.birthDate ? formatDate(res.data.birthDate, 'YYYY-MM-DD') : null,
        tmt: res.data.tmt ? formatDate(res.data.tmt, 'YYYY-MM-DD') : null,
      };
    }
  }).catch((err: any) => {
    console.error("Failed to load person data", err);
  });
}

function handleCancel() {
  router.back();
}

async function onSubmit() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isLoadingSave.value = true;

  personSvc
    .save(form.value)
    .then(() => {
      swal.toast(
        isEditing.value
          ? "Data berhasil diperbarui"
          : "Data berhasil disimpan",
        "success",
      );
      router.push("/master/person");
    })
    .catch((err: any) => {
      console.error("Failed to save data", err);
    })
    .finally(() => {
      isLoadingSave.value = false;
    });
}
</script>
