<script setup lang="ts">
import DashboardExecutive from "~/pages/dashboard/index.vue";
definePageMeta({
  layout: "admin",
  permission: "DASHBOARD.VIEW",
});

useHead({
  title: "Dashboard",
});
</script>

<template>
  <DashboardExecutive />
</template>

