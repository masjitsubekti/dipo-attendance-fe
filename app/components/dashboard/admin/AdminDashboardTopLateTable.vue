<template>
  <UiCard :padding="true" class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          Top 10 Pemantauan Keterlambatan Pegawai
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Daftar pegawai dengan akumulasi durasi &amp; frekuensi keterlambatan tertinggi
        </p>
      </div>

      <div>
        <UiBadge variant="warning" class="text-xs font-semibold">
          {{ selectedMonthLabel }}
        </UiBadge>
      </div>
    </div>

    <!-- List Top 10 Table View -->
    <div class="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-700">
            <th class="py-3 px-4 w-12 text-center">Rank</th>
            <th class="py-3 px-4">Nama Pegawai &amp; NIP</th>
            <th class="py-3 px-4">Departemen &amp; Jabatan</th>
            <th class="py-3 px-4">Durasi Terlambat</th>
            <th class="py-3 px-4">Total</th>
            <th class="py-3 px-4 text-center">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
          <tr v-if="employees.length === 0">
            <td colspan="6" class="py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
              Tidak ada data keterlambatan pegawai pada periode ini
            </td>
          </tr>
          <tr
            v-else
            v-for="(person, index) in employees"
            :key="person.id || index"
            class="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors text-slate-800 dark:text-slate-200"
          >
            <td class="py-3 px-4 text-center font-extrabold">
              <span
                class="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs"
                :class="
                  index === 0
                    ? 'bg-rose-100 text-rose-700 font-bold dark:bg-rose-950/80 dark:text-rose-300'
                    : index === 1
                    ? 'bg-amber-100 text-amber-700 font-bold dark:bg-amber-950/80 dark:text-amber-300'
                    : index === 2
                    ? 'bg-blue-100 text-blue-700 font-bold dark:bg-blue-950/80 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                "
              >
                #{{ index + 1 }}
              </span>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {{ person.initials }}
                </div>
                <div>
                  <span class="font-bold text-slate-900 dark:text-white block">
                    {{ person.name }}
                  </span>
                  <span class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    NIP. {{ person.nip }}
                  </span>
                </div>
              </div>
            </td>
            <td class="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
              <div>{{ person.department }}</div>
              <div class="text-[10px] text-slate-400">{{ person.position }}</div>
            </td>
            <td class="py-3 px-4">
              <span class="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                {{ formatLateDuration(person.lateDuration) }}
              </span>
            </td>
            <td class="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
              {{ person.monthlyCount }} Kali
            </td>
            <td class="py-3 px-4 text-center">
              <UiBadge
                :variant="
                  person.monthlyCount >= 5
                    ? 'danger'
                    : person.monthlyCount >= 3
                    ? 'warning'
                    : 'default'
                "
                class="text-[10px] font-bold"
              >
                {{ person.statusText }}
              </UiBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
interface Employee {
  id?: string | number;
  initials?: string;
  name: string;
  nip?: string;
  department?: string;
  position?: string;
  lateDuration: number;
  monthlyCount: number;
  statusText?: string;
}

defineProps<{
  employees: Employee[];
  selectedMonthLabel: string;
}>();

function formatLateDuration(mins: number): string {
  const m = Number(mins || 0);
  const hoursVal = m / 60;
  const hoursStr = hoursVal % 1 === 0 ? String(hoursVal) : hoursVal.toFixed(1);
  return `${hoursStr}j (${m}m)`;
}
</script>
