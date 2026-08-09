<template>
  <UiCard class="relative overflow-hidden" variant="outlined" :padding="false">
    <div class="flex flex-col p-4">
      <div class="flex flex-row justify-between items-center">
        <div class="flex flex-col">
          <p class="text-[15px] font-bold text-slate-900 dark:text-white">
            {{ data.gateName }}
          </p>
          <div
            class="flex flex-row text-[15px] font-medium text-slate-900 dark:text-white items-center gap-1 mt-1"
          >
            <UiIcon
              :name="
                data.status ? 'mdi-radiobox-marked' : 'mdi-radiobox-marked'
              "
              type="mdi"
              size="sm"
              :class="data.status ? 'text-green-500' : 'text-red-500'"
            />{{ data.status ? "Online" : "Offline" }}
          </div>
        </div>
        <div class="rounded-xl px-3" :class="getGateTypeBgColor(data.gateType)">
          <UiIcon
            :name="getGateTypeIcon(data.gateType)"
            type="mdi"
            :size="42"
            :class="getGateTypeIconColor(data.gateType)"
          />
        </div>
      </div>

      <div
        class="flex flex-col bg-slate-50 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-lg w-full mt-4 px-3 py-2"
      >
        <p class="text-[13px] font-medium text-slate-500 dark:text-slate-400">
          Last activity
        </p>
        <div class="flex flex-row justify-between items-center">
          <p
            class="text-[13px] font-semibold gap-1 flex items-center text-slate-900 dark:text-white"
          >
            <UiIcon
              v-if="data.direction?.toLowerCase() === 'in'"
              name="mdi-arrow-down-bold"
              type="mdi"
              size="sm"
              class="text-green-500"
            />
            <UiIcon
              v-else
              name="mdi-arrow-up-bold"
              type="mdi"
              size="sm"
              class="text-red-500"
            />
            {{ data.personName }}
          </p>
          <p
            class="text-[11px] font-regular text-slate-500 dark:text-slate-400"
          >
            {{
              data.accessTime && data.accessTime !== "-"
                ? new Date(data.accessTime)
                    .toLocaleString("id-ID", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })
                    .replace(/\./g, ":")
                : "-"
            }}
          </p>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4 mt-4">
        <div
          class="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg py-2"
        >
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
            In Today
          </p>
          <p class="font-bold text-slate-900 dark:text-white">
            {{ data.totalIn }}
          </p>
        </div>
        <div
          class="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg py-2"
        >
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
            Out Today
          </p>
          <p class="font-bold text-slate-900 dark:text-white">
            {{ data.totalOut }}
          </p>
        </div>
        <div
          class="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg py-2"
        >
          <p class="text-xs font-medium text-red-500 dark:text-red-400">
            Failed
          </p>
          <p class="font-bold text-slate-900 dark:text-white">
            {{ data.totalFailed }}
          </p>
        </div>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
interface Props {
  data: any;
}

defineProps<Props>();

const getGateTypeIcon = (gateType: string): string => {
  const iconMap: Record<string, string> = {
    PEDESTRIAN: "mdi-walk",
    MOBIL: "mdi-car",
    MOTOR: "mdi-motorbike",
  };
  return iconMap[gateType] || "mdi-walk";
};

const getGateTypeBgColor = (gateType: string): string => {
  const bgColorMap: Record<string, string> = {
    PEDESTRIAN: "bg-amber-100 dark:bg-amber-900/30",
    MOBIL: "bg-blue-100 dark:bg-blue-900/30",
    MOTOR: "bg-purple-100 dark:bg-purple-900/30",
  };
  return bgColorMap[gateType] || "bg-amber-200";
};

const getGateTypeIconColor = (gateType: string): string => {
  const iconColorMap: Record<string, string> = {
    PEDESTRIAN: "text-amber-500",
    MOBIL: "text-blue-500",
    MOTOR: "text-purple-500",
  };
  return iconColorMap[gateType] || "text-amber-500";
};
</script>
