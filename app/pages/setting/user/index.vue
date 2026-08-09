<template>
  <div class="w-full space-y-4 animate-fade-in">
    <LayoutBreadcrumb :items="breadcrumbs" />

    <TableList
      :title="tableTitle"
      defaultSortBy="createdAt"
      :headers="headers"
      :tableData="tableData"
      :loading="isLoading"
      :filterSchema="filterSchema"
      :filterList="{ listRole }"
      :actions="actions"
      :actionToolbars="actionToolbars"
      @fetchData="loadAll"
      @addItem="addItem"
      @editItem="editItem"
      @deleteItem="deleteItem"
      @deactivateUser="toggleStatus"
      @activateUser="toggleStatus"
    >
      <template #item.active="{ value }">
        <UiBadge :variant="value ? 'success' : 'danger'">
          {{ value ? "Aktif" : "Nonaktif" }}
        </UiBadge>
      </template>
    </TableList>

    <UiModal v-model="showDialog" :title="dialogTitle" size="lg" persistent>
      <UiForm ref="formRef">
        <div class="space-y-4">
          <UiAutocomplete
            v-model="editedItem.roleId"
            label="Role"
            placeholder="Pilih Role"
            :options="listRole"
            item-value="id"
            item-title="name"
            required
            clearable
            :rules="[(v) => !!v || 'Wajib diisi']"
          />

          <UiInput
            v-model="editedItem.name"
            label="Nama"
            placeholder="Masukkan Nama"
            required
            :rules="[(v) => !!v || 'Wajib diisi']"
          >
            <template #suffix>
              <button
                type="button"
                class="flex items-center justify-center text-slate-500 hover:text-slate-700"
                @click.stop="openPersonLookup"
              >
                <UiIcon name="IconUserSearch" type="tabler" size="md" />
              </button>
            </template>
          </UiInput>

          <UiRow>
            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.username"
                label="Username"
                placeholder="Masukkan Username"
                required
                :rules="[
                  (v) => !!v || 'Wajib diisi',
                  (v) => (v && v.length >= 3) || 'Minimal 3 karakter',
                ]"
              />
            </UiCol>

            <UiCol cols="12" md="6">
              <UiInput
                v-model="editedItem.email"
                label="Email"
                type="email"
                placeholder="Masukkan Email"
                required
                :rules="[
                  (v) => !!v || 'Wajib diisi',
                  (v) => /.+@.+\..+/.test(v) || 'Format email tidak valid',
                ]"
              />
            </UiCol>
          </UiRow>

          <UiInput
            v-model="editedItem.password"
            label="Password"
            type="password"
            placeholder="Masukkan Password"
            :required="!isEditing"
            :rules="passwordRules"
          />

          <div v-if="isEditing" class="flex">
            <UiIcon
              name="mdi-information-outline"
              size="sm"
              class="text-slate-600 dark:text-slate-300 mr-1"
            />
            <span class="text-sm text-slate-600 dark:text-slate-300">
              Kosongkan kata sandi jika tidak ingin mengubah kata sandi.
            </span>
          </div>
        </div>
      </UiForm>

      <template #footer>
        <UiButton color="secondary" @click="handleClose">
          Batal
        </UiButton>
        <UiButton color="primary" :loading="isLoadingSave" @click="onSubmit">
          Simpan
        </UiButton>
      </template>
    </UiModal>
    <PersonLookup
       v-model="showPersonLookup"
       :multiple="false"
        title="Pilih Employee"
        @add-to-queue="handleSelectPerson"
     />
  </div>
</template>

<script setup lang="ts">
import userService from "@/services/user.service";
import roleService from "@/services/role.service";
import PersonLookup from '@/components/dialog/PersonLookup.vue'
import { useSwal } from "~/composables/useSwal";

definePageMeta({
  layout: "admin",
  permission: "USER.VIEW",
});

const pageTitle = "User";

useHead({
  title: pageTitle,
});

const formRef = ref<{
  validate: () => Promise<boolean>;
  reset: () => void;
  resetValidation: () => void;
} | null>(null);

const swal = useSwal();
const route = useRoute();
const userSvc = userService();
const roleSvc = roleService();

const itemPerPage = ref(10);
const isLoading = ref(false);
const isLoadingSave = ref(false);
const showDialog = ref(false);
const isEditing = ref(false);

const tableTitle = computed(() => "Data User");
const dialogTitle = computed(() => {
  return isEditing.value ? "Ubah Data User" : "Tambah Data User";
});

const filter = ref<{
  organizationId: number | null;
  institutionId: number | null;
}>({
  organizationId: null,
  institutionId: null,
});

const listRole: any = ref([]);

const tableData: any = ref({
  items: [],
  meta: {
    totalItems: 0,
  },
});

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/" },
  { label: "Pengaturan" },
  { label: pageTitle },
]);

const headers = computed(() => [
  { key: "name", title: "Nama", sortable: true },
  { key: "username", title: "Username", sortable: true },
  { key: "email", title: "Email", sortable: true },
  { key: "role", title: "Role", sortable: true },
  { key: "active", title: "Status", align: "center" },
  { key: "actions", title: "Aksi", align: "center", width: "10%" },
]);

const filterSchema = computed(() => [
  {
    name: "roleId",
    type: "autocomplete" as const,
    items: "listRole",
    placeholder: "Pilih Role",
    colMd: 2,
    valueKey: "id",
    textKey: "name",
  },
  { name: "", type: "text" as const, colMd: 6 },
  {
    name: "q",
    type: "search" as const,
    placeholder: "Cari (Tekan Enter)",
    colMd: 4,
  },
]);

const actions = computed(() => [
  {
    key: "edit",
    icon: "mdi-pencil",
    color: "#f59e0b",
    tooltip: "Ubah",
    emit: "editItem",
  },
  {
    key: "deactivate",
    icon: "mdi-account-off",
    color: "#6b7280",
    tooltip: "Nonaktifkan",
    emit: "deactivateUser",
    show: (item: any) => item.active === true,
  },
  {
    key: "activate",
    icon: "mdi-account-check",
    color: "#22c55e",
    tooltip: "Aktifkan",
    emit: "activateUser",
    show: (item: any) => item.active === false,
  },
  {
    key: "delete",
    icon: "mdi-delete",
    color: "#ef4444",
    tooltip: "Hapus",
    emit: "deleteItem",
  },
]);

const actionToolbars = computed(() => [
  {
    key: "addItem",
    icon: "mdi-plus-circle-outline",
    color: "primary",
    tooltip: "Tambah",
    emit: "addItem",
    type: "default" as const,
  },
]);

const defaultItem = {
  id: null as number | null,
  name: "",
  username: "",
  email: "",
  password: "",
  roleId: null as string | null,
  personId: null as number | null,
  status: "1",
};

const editedItem: any = ref({ ...defaultItem });

const passwordRules = computed(() => {
  if (isEditing.value) {
    return [
      (v: string) =>
        !v || v.length >= 8 || "Password minimal 8 karakter",
    ];
  }

  return [
    (v: string) => !!v || "Wajib diisi",
    (v: string) =>
      (v && v.length >= 8) || "Password minimal 8 karakter",
  ];
});

onMounted(() => {
  loadAllRole();
});

async function loadAll() {
  const {
    pageNumber,
    pageSize,
    q,
    sortBy,
    sortType,
    roleId,
    organizationId,
    institutionId,
  } = route.query;

  isLoading.value = true;

  await userSvc
    .retrieve({
      q: q,
      pageSize: pageSize ? pageSize : itemPerPage.value,
      pageNumber: pageNumber ? pageNumber : 1,
      sortBy: sortBy,
      sortType: sortType,
      roleId: roleId,
      organizationId: organizationId
        ? organizationId
        : filter.value.organizationId,
      institutionId: institutionId ? institutionId : filter.value.institutionId,
    })
    .then((res: any) => {
      isLoading.value = false;
      tableData.value = {
        items: res.data != null ? res.data.items : [],
        meta: res.data?.meta || { totalItems: 0 },
      };
    })
    .catch(() => {
      isLoading.value = false;
    });
}

async function loadAllRole() {
  await roleSvc.retrieveAll({}).then((res: any) => {
    listRole.value = res.data || [];
  });
}

function addItem() {
  isEditing.value = false;
  editedItem.value = {
    ...defaultItem,
  };
  formRef.value?.reset();
  formRef.value?.resetValidation();
  showDialog.value = true;
}

async function editItem(row: any) {
  formRef.value?.resetValidation();

  await userSvc.retrieveById(row.id).then((res: any) => {
    if (res.data?.id) {
      editedItem.value = { ...res.data };
      editedItem.value.password = null;

      if (editedItem.value.personId) {
        editedItem.value.personId = Number(editedItem.value.personId);
      }

      isEditing.value = true;
      showDialog.value = true;
    }
  });
}

async function onSubmit() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isLoadingSave.value = true;
  editedItem.value.status = "1";

  userSvc
    .save(editedItem.value)
    .then(() => {
      swal.toast(
        isEditing.value
          ? "Data berhasil diperbarui"
          : "Data berhasil disimpan",
        "success",
      );
      handleClose();
      loadAll();
    })
    .catch((err: any) => {
      isLoadingSave.value = false;
      console.error("Failed to save data", err);
    });
}

async function deleteItem(row: any) {
  const result = await swal.confirmDelete(row.name, {
    title: "Hapus Data",
    text: `Apakah Anda yakin ingin menghapus data "${row.name}"?`,
    confirmText: "Ya",
    cancelText: "Batal",
    preConfirm: async () => {
      await Promise.all([
        userSvc.destroy(row.id),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    },
  });

  if (result.isConfirmed) {
    swal.toast("Data berhasil dihapus", "success");
    loadAll();
  }
}

async function toggleStatus(row: any) {
  const newStatus = !row.active;
  const actionText = newStatus ? "Aktifkan" : "Nonaktifkan";
  const statusText = newStatus ? "aktif" : "nonaktif";

  const result = await swal.confirmDelete(row.name, {
    title: actionText + " User",
    text: `Apakah Anda yakin ingin mengubah status "${row.name}" menjadi ${statusText}?`,
    confirmText: "Ya",
    cancelText: "Batal",
    preConfirm: async () => {
      await Promise.all([
        userSvc.updateActiveStatus({ id: row.id, active: newStatus }),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    },
  });

  if (result.isConfirmed) {
    swal.toast("Data berhasil diperbarui", "success");
    loadAll();
  }
}

function handleClose() {
  isLoadingSave.value = false;
  isEditing.value = false;
  formRef.value?.reset();
  formRef.value?.resetValidation();
  editedItem.value = { ...defaultItem };
  showDialog.value = false;
}

const showPersonLookup = ref(false)

function openPersonLookup() {
  showPersonLookup.value = true
}

function generateUsernameFromPerson(person: any) {
  if (person?.personNumber) {
    return String(person.personNumber).toLowerCase().trim()
  }

  return String(person?.name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function handleSelectPerson(items: any[]) {
  if (!items || items.length === 0) return

  const person = items[0]

  editedItem.value.personId = person.id
  editedItem.value.name = person.name || ''
  editedItem.value.username = generateUsernameFromPerson(person)
  editedItem.value.email = person.email || ''
  showPersonLookup.value = false
}
</script>
