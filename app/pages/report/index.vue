<script setup lang="ts">
definePageMeta({
  middleware: [
    function () {
      return navigateTo("/report/employee-recap");
    },
  ],
});
</script>
