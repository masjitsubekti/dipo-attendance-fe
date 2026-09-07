<template>
  <div class="print-wrapper">
    <!-- Header -->
    <div class="header-container text-center">
      <div class="header-title">LAPORAN REKAPITULASI PRESENSI PEGAWAI</div>
      <div v-if="institutionName" class="header-subtitle">{{ institutionName }}</div>
      <div class="header-period">PERIODE: {{ data.periodText || "" }}</div>
    </div>

    <!-- Summary Table -->
    <table class="summary-table">
      <colgroup>
        <col style="width: 3%;" />  <!-- NO -->
        <col style="width: 9%;" />  <!-- NIP -->
        <col style="width: 17%;" /> <!-- NAMA PEGAWAI -->
        <col style="width: 15%;" /> <!-- INSTITUSI -->
        <col style="width: 5%;" />  <!-- HADIR -->
        <col style="width: 5%;" />  <!-- JML TELAT -->
        <col style="width: 7%;" />  <!-- DURASI TELAT -->
        <col style="width: 5%;" />  <!-- JML PLG CEPAT -->
        <col style="width: 7%;" />  <!-- DURASI PLG CEPAT -->
        <col style="width: 4%;" />  <!-- IZIN -->
        <col style="width: 4%;" />  <!-- CUTI -->
        <col style="width: 4%;" />  <!-- SAKIT -->
        <col style="width: 5%;" />  <!-- DINAS -->
        <col style="width: 4%;" />  <!-- MANGKIR -->
        <col style="width: 4%;" />  <!-- ALPHA -->
        <col style="width: 4%;" />  <!-- LIBUR -->
      </colgroup>
      <thead>
        <tr>
          <th>NO</th>
          <th>NIP</th>
          <th>NAMA PEGAWAI</th>
          <th>INSTITUSI</th>
          <th>HADIR</th>
          <th>JML TELAT</th>
          <th>DURASI TELAT</th>
          <th>JML PLG CEPAT</th>
          <th>DURASI PLG CEPAT</th>
          <th>IZIN</th>
          <th>CUTI</th>
          <th>SAKIT</th>
          <th>DINAS</th>
          <th>MANGKIR</th>
          <th>ALPHA</th>
          <th>LIBUR</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(emp, idx) in (data.items || data.employees || [])" :key="emp.personId || idx">
          <td class="text-center">{{ Number(idx) + 1 }}</td>
          <td class="text-center font-mono">{{ emp.nip }}</td>
          <td class="text-left uppercase">{{ emp.name }}</td>
          <td class="text-left uppercase">{{ emp.institutionName || '-' }}</td>
          <td class="text-center">{{ emp.countHadir }}</td>
          <td class="text-center">{{ emp.countTerlambat > 0 ? `${emp.countTerlambat}` : '-' }}</td>
          <td class="text-center font-mono">{{ emp.totalLateMinutes > 0 ? `${emp.totalLateHours}j ${emp.totalLateRemainingMinutes}m` : '-' }}</td>
          <td class="text-center">{{ emp.countPulangCepat > 0 ? `${emp.countPulangCepat}` : '-' }}</td>
          <td class="text-center font-mono">{{ emp.totalEarlyLeaveMinutes > 0 ? `${emp.totalEarlyLeaveHours}j ${emp.totalEarlyLeaveRemainingMinutes}m` : '-' }}</td>
          <td class="text-center">{{ emp.countIzin || '-' }}</td>
          <td class="text-center">{{ emp.countCuti || '-' }}</td>
          <td class="text-center">{{ emp.countSakit || '-' }}</td>
          <td class="text-center">{{ emp.countDinas || '-' }}</td>
          <td class="text-center">{{ emp.countMangkir || '-' }}</td>
          <td class="text-center">{{ emp.countAlpha || '-' }}</td>
          <td class="text-center">{{ emp.countLibur || '-' }}</td>
        </tr>
      </tbody>
      <tfoot v-if="data.summary">
        <tr class="summary-footer-row font-bold">
          <td colspan="4" class="text-left font-extrabold">TOTAL ({{ data.summary.totalEmployee }} PEGAWAI)</td>
          <td class="text-center">{{ data.summary.totalHadir }}</td>
          <td class="text-center">{{ data.summary.totalTerlambat }}</td>
          <td class="text-center font-mono">{{ data.summary.totalLateMinutes > 0 ? `${data.summary.totalLateHours}j ${data.summary.totalLateRemainingMinutes}m` : '-' }}</td>
          <td class="text-center">{{ data.summary.totalPulangCepat }}</td>
          <td class="text-center font-mono">{{ data.summary.totalEarlyLeaveMinutes > 0 ? `${data.summary.totalEarlyLeaveHours}j ${data.summary.totalEarlyLeaveRemainingMinutes}m` : '-' }}</td>
          <td class="text-center">{{ data.summary.totalIzin }}</td>
          <td class="text-center">{{ data.summary.totalCuti }}</td>
          <td class="text-center">{{ data.summary.totalSakit }}</td>
          <td class="text-center">{{ data.summary.totalDinas }}</td>
          <td class="text-center">{{ data.summary.totalMangkir }}</td>
          <td class="text-center">{{ data.summary.totalAlpha }}</td>
          <td class="text-center">{{ data.summary.totalLibur }}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: any;
  institutionName?: string;
}>();

const customStyles = `
  .print-wrapper {
    position: relative;
    width: 100%;
    color: #000000;
    font-family: Arial, Helvetica, sans-serif;
  }
  .text-center {
    text-align: center;
  }
  .text-left {
    text-align: left;
  }
  .font-bold {
    font-weight: bold;
  }
  .font-extrabold {
    font-weight: 800;
  }
  .font-mono {
    font-family: monospace;
  }
  .uppercase {
    text-transform: uppercase;
  }

  .header-container {
    border-bottom: 2px solid #000000;
    padding-bottom: 10px;
    margin-bottom: 12px;
    text-align: center;
  }
  .header-title {
    font-size: 15px;
    font-weight: bold;
    text-transform: uppercase;
    color: #000000;
    letter-spacing: 0.5px;
  }
  .header-subtitle {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    color: #000000;
    margin-top: 2px;
  }
  .header-period {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    color: #000000;
    margin-top: 2px;
  }

  .summary-box {
    margin-bottom: 12px;
  }
  .summary-box-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000000;
  }
  .summary-box-table td {
    padding: 5px 4px;
    font-size: 9px;
    border: 1px solid #000000;
    text-align: center;
    background-color: #ffffff;
    color: #000000;
  }

  .summary-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    table-layout: fixed;
    border: 1px solid #000000;
  }
  .summary-table th {
    background-color: #ffffff;
    color: #000000;
    font-weight: bold;
    font-size: 9px;
    padding: 5px 3px;
    border: 1px solid #000000;
    text-align: center;
    vertical-align: middle;
  }
  .summary-table td {
    padding: 4px 3px;
    font-size: 9px;
    border: 1px solid #000000;
    color: #000000;
    vertical-align: middle;
  }
  .summary-footer-row td {
    background-color: #ffffff;
    font-weight: bold;
    border-top: 2px solid #000000;
    border-bottom: 2px solid #000000;
  }
`;

const customPrintStyles = ``;

function getPrintStyles() {
  return { customStyles, customPrintStyles };
}

defineExpose({
  getPrintStyles,
});
</script>
