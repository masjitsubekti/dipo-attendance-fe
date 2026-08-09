<template>
  <div class="w-full space-y-4 animate-fade-in pb-10">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4"
    >
      <LayoutBreadcrumb :items="breadcrumbs" />
    </div>

    <UiCard
      class="w-full border border-slate-200 dark:border-slate-700 shadow-sm rounded-md p-6"
    >
      <div class="flex items-center gap-3 mb-6">
        <UiIcon
          name="mdi-arrow-left"
          class="text-xl cursor-pointer hover:text-primary-600 transition-colors"
          @click="handleCancel"
        />
        <h2 class="text-2xl font-bold">
          {{ isEditing ? "Ubah Employee" : "Tambah Employee" }}
        </h2>
      </div>

      <UiForm ref="formRef" class="mt-6">
        <UiRow>
          <UiCol cols="12" md="6">
            <UiInput
              v-model="form.personNumber"
              label="Employee Number"
              placeholder="Masukkan Employee Number"
              required
              :rules="[(v) => !!v || 'Wajib diisi']"
            />
          </UiCol>

          <UiCol cols="12" md="6">
            <UiInput
              v-model="form.name"
              label="Name"
              placeholder="Masukkan Name"
              required
              :rules="[(v) => !!v || 'Wajib diisi']"
            />
          </UiCol>

          <UiCol cols="12" md="6">
            <UiAutocomplete
              v-model="form.jobPositionId"
              label="Job Position"
              placeholder="Pilih Job Position"
              :options="listJobPosition"
              item-value="id"
              item-title="name"
              required
              :rules="[(v) => !!v || 'Wajib diisi']"
              clearable
            />
          </UiCol>

          <UiCol cols="12" md="6">
            <UiAutocomplete
              v-model="form.raId"
              label="Regulated Agent"
              placeholder="Pilih Regulated Agent"
              :options="listRegulatedAgent"
              item-value="id"
              item-title="name"
              clearable
            />
          </UiCol>

          <UiCol cols="12" md="6">
            <UiAutocomplete
              v-model="form.personType"
              label="Employee Type"
              placeholder="Pilih Employee Type"
              :options="personnelTypeOptions"
              required
              :rules="[(v) => !!v || 'Wajib diisi']"
              clearable
            />
          </UiCol>

          <UiCol cols="12" md="6">
            <UiDatePicker
              v-model="form.tmt"
              mode="date"
              size="sm"
              label="TMT"
              placeholder="Pilih TMT"
            />
          </UiCol>

          <UiCol cols="12" md="6">
            <UiAutocomplete
              v-model="form.gender"
              label="Gender"
              placeholder="Pilih Gender"
              :options="genderOptions"
              required
              :rules="[(v) => !!v || 'Wajib diisi']"
              clearable
            />
          </UiCol>

          <UiCol cols="12" md="6">
            <UiInput
              v-model="form.phone"
              label="Telepon"
              placeholder="Masukkan Nomor Telepon"
            />
          </UiCol>

          <UiCol cols="12" md="6">
            <UiInput
              v-model="form.email"
              label="Email"
              placeholder="Masukkan Alamat Email"
              type="email"
            />
          </UiCol>

          <UiCol cols="12" md="6">
            <UiInput
              v-model="form.address"
              label="Address"
              placeholder="Masukkan Address"
            />
          </UiCol>

          <UiCol cols="12" md="6">
            <UiSwitch
              v-model="form.isActive"
              label="Status"
              layout="stacked"
              :valueText="form.isActive ? 'Aktif' : 'Nonaktif'"
            />
          </UiCol>
        </UiRow>
      </UiForm>

      <div
        class="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700"
      >
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
import { ref, computed, onMounted } from "vue";
import personService from "@/services/person.service";
import { PERSON_GENDER, PERSONNEL_TYPES } from "~/constants/data";
import { useSwal } from "~/composables/useSwal";
import { useRoute, useRouter } from "vue-router";
import { useFormat } from "~/composables/useFormat";
import DocumentPreview from "~/components/dialog/DocumentPreview.vue";

definePageMeta({
  layout: "admin",
  permission: "PERSON.VIEW",
});

const pageTitle = "Employee";

useHead({
  title: pageTitle,
});

const route = useRoute();
const router = useRouter();
const swal = useSwal();
const personSvc = personService();
const { formatDateTemplate } = useFormat();

const isLoadingSave = ref(false);
const isEditing = computed(() => !!route.query.id);

const formRef = ref<{ validate: () => Promise<boolean> } | null>(null);

const activeTab = ref("personal");
const tabs = computed(() => {
  const items = [{ id: "personal", name: "Personal Info" }];
  if (isEditing.value) {
    items.push({ id: "document", name: "Document" });
  }
  return items;
});

const listJobPosition: any = ref([]);
const listRegulatedAgent: any = ref([]);
const genderOptions = PERSON_GENDER;
const personnelTypeOptions = PERSONNEL_TYPES;

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Master Data" },
  { label: "Employee", to: "/master/person" },
  { label: isEditing.value ? "Ubah" : "Tambah" },
]);

const defaultItem = {
  id: null as number | null,
  personNumber: "",
  name: "",
  personType: "",
  tmt: "",
  jobPositionId: null as number | null,
  phone: "",
  email: "",
  address: "",
  gender: "",
  raId: null as number | null,
  isActive: true,
};

const form: any = ref({ ...defaultItem });

onMounted(() => {
  loadJobPositions();
  loadRegulatedAgents();
  if (route.query.id) {
  }
});

function loadJobPositions() {
  // jobPositionSvc
  //   .retrieveAll({})
  //   .then((res: any) => {
  //     listJobPosition.value = res.data || [];
  //   })
  //   .catch((err: any) => {
  //     console.error("Failed to load job position", err);
  //     listJobPosition.value = [];
  //   });
}

function loadRegulatedAgents() {
  // regulatedAgentSvc
  //   .retrieveAll({})
  //   .then((res: any) => {
  //     listRegulatedAgent.value = res.data || [];
  //   })
  //   .catch((err: any) => {
  //     console.error("Failed to load regulated agent", err);
  //     listRegulatedAgent.value = [];
  //   });
}

function handleCancel() {
  router.back();
}

async function onSubmit() {
  if (activeTab.value !== "personal") {
    activeTab.value = "personal";
  }

  setTimeout(async () => {
    const isValid = await formRef.value?.validate();
    if (!isValid) return;

    isLoadingSave.value = true;

    const payload = {
      ...form.value,
      jobPositionId: Number(form.value.jobPositionId),
      raId: form.value.raId ? Number(form.value.raId) : null,
    };

    personSvc
      .save(payload)
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
  }, 50);
}
</script>
