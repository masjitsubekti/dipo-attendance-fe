<template>
  <div class="print-wrapper">
    <!-- Watermark Logo -->
    <!-- <div class="watermark-container">
      <img class="watermark-img" src="/images/app-logo.png" alt="School Logo" />
    </div> -->

    <!-- Header -->
    <div class="header-container text-center">
      <div class="header-title">{{ data.employee?.institution || "" }}</div>
      <div class="header-subtitle">{{ data.company?.title || "" }}</div>
      <div class="header-period">{{ data.company?.periodText || "" }}</div>
    </div>

    <!-- Employee Info Grid -->
    <div class="info-grid">
      <div class="info-column">
        <div class="info-row">
          <span class="info-label">Nama</span>
          <span class="info-sep">:</span>
          <span class="info-value uppercase">{{ data.employee?.name || "-" }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">NIP</span>
          <span class="info-sep">:</span>
          <span class="info-value">{{ data.employee?.nip || "-" }}</span>
        </div>
      </div>
      <div class="info-column">
        <div class="info-row">
          <span class="info-label">Departement</span>
          <span class="info-sep">:</span>
          <span class="info-value uppercase">{{ data.employee?.department || "-" }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Jabatan</span>
          <span class="info-sep">:</span>
          <span class="info-value uppercase">{{ data.employee?.position || "-" }}</span>
        </div>
      </div>
    </div>

    <!-- Attendance Table -->
    <table class="report-table">
      <thead>
        <tr>
          <th rowspan="3" style="width: 7%;">TANGGAL</th>
          <th rowspan="3" style="width: 7%;">HARI</th>
          <th colspan="6">REGULAR</th>
          <th colspan="2">NON REGULAR</th>
          <th rowspan="3" style="width: 9%;">STATUS</th>
          <th rowspan="3" style="width: 21%;">KETERANGAN</th>
        </tr>
        <tr>
          <th rowspan="2" style="width: 7%;">MASUK</th>
          <th colspan="2">TELAT MASUK</th>
          <th rowspan="2" style="width: 7%;">PULANG</th>
          <th colspan="2">PULANG CEPAT</th>
          <th rowspan="2" style="width: 7%;">MASUK</th>
          <th rowspan="2" style="width: 7%;">PULANG</th>
        </tr>
        <tr>
          <th style="width: 4%;">JAM</th>
          <th style="width: 4%;">MENIT</th>
          <th style="width: 4%;">JAM</th>
          <th style="width: 4%;">MENIT</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data.days" :key="row.dateKey">
          <td class="text-center font-mono">{{ row.date }}</td>
          <td class="text-center uppercase">{{ row.dayName }}</td>
          
          <!-- Regular Masuk -->
          <td class="text-center font-mono">{{ row.regularMasuk }}</td>
          <!-- Telat Jam & Menit -->
          <td class="text-center font-mono">{{ row.telatJam }}</td>
          <td class="text-center font-mono">{{ row.telatMenit }}</td>
          <!-- Regular Pulang -->
          <td class="text-center font-mono">{{ row.regularPulang }}</td>
          <!-- Pulang Cepat Jam & Menit -->
          <td class="text-center font-mono">{{ row.pulangCepatJam }}</td>
          <td class="text-center font-mono">{{ row.pulangCepatMenit }}</td>

          <!-- Non Regular Masuk & Pulang -->
          <td class="text-center font-mono">{{ row.nonRegularMasuk }}</td>
          <td class="text-center font-mono">{{ row.nonRegularPulang }}</td>

          <!-- Keterangan -->
          <td class="text-center" :style="getKeteranganStyle(row)">
            {{ row.keterangan }}
          </td>

          <!-- Keterangan Detail -->
          <td class="text-left font-medium" style="font-size: 8px; line-height: 1.1;">{{ row.keteranganDetail }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="summary-row font-bold">
          <td colspan="2" class="text-left font-extrabold">TOTAL</td>
          <td></td>
          <td class="text-center font-mono">
            {{ data.summary?.totalLateHours > 0 ? data.summary.totalLateHours : '-' }}
          </td>
          <td class="text-center font-mono">
            {{ data.summary?.totalLateRemainingMinutes > 0 ? data.summary.totalLateRemainingMinutes : '-' }}
          </td>
          <td></td>
          <td class="text-center font-mono">
            {{ data.summary?.totalEarlyLeaveHours > 0 ? data.summary.totalEarlyLeaveHours : '-' }}
          </td>
          <td class="text-center font-mono">
            {{ data.summary?.totalEarlyLeaveRemainingMinutes > 0 ? data.summary.totalEarlyLeaveRemainingMinutes : '-' }}
          </td>
          <td colspan="4"></td>
        </tr>
      </tfoot>
    </table>

    <!-- Legend Section -->
    <div class="legend-section">
      <div class="legend-title">Keterangan</div>
      <div class="legend-grid">
        <!-- Column 1: Color Boxes 1-4 -->
        <div class="legend-col">
          <div class="legend-item">
            <span class="color-box" style="background-color: #800080;"></span>
            <span>: LIBUR</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #00b050;"></span>
            <span>: IJIN/CUTI</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #92d050;"></span>
            <span>: SAKIT</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #0070c0;"></span>
            <span>: DINAS LUAR</span>
          </div>
        </div>

        <!-- Column 2: Color Boxes 5-9 -->
        <div class="legend-col">
          <div class="legend-item">
            <span class="color-box" style="background-color: #ffc000;"></span>
            <span>: PERINGATAN</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #ff0000;"></span>
            <span>: TERLAMBAT</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #a6a6a6;"></span>
            <span>: PULANG CEPAT</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #ff66cc;"></span>
            <span>: MANGKIR</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #ed7d31;"></span>
            <span>: ALPHA</span>
          </div>
        </div>

        <!-- Column 3: Abbreviations H, A, WFH, M, DL -->
        <div class="legend-col">
          <div class="legend-abbr"><span class="abbr-code">H</span><span>: HADIR</span></div>
          <div class="legend-abbr"><span class="abbr-code">A</span><span>: ALPHA</span></div>
          <div class="legend-abbr"><span class="abbr-code">WFH</span><span>: Work From Home</span></div>
          <div class="legend-abbr"><span class="abbr-code">M</span><span>: MANGKIR</span></div>
          <div class="legend-abbr"><span class="abbr-code">DL</span><span>: DINAS LUAR</span></div>
        </div>

        <!-- Column 4: Abbreviations LBN, CBR, CTH, SK -->
        <div class="legend-col">
          <div class="legend-abbr"><span class="abbr-code">LBN</span><span>: LIBNAS</span></div>
          <div class="legend-abbr"><span class="abbr-code">CBR</span><span>: CUTI BERSALIN</span></div>
          <div class="legend-abbr"><span class="abbr-code">CTH</span><span>: CUTI TAHUNAN</span></div>
          <div class="legend-abbr"><span class="abbr-code">SK</span><span>: SAKIT</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: any;
}>();

function getKeteranganStyle(row: any) {
  const styleMap: Record<string, { bg: string; text: string }> = {
    libur: { bg: '#800080', text: '#ffffff' },        // Purple
    izin: { bg: '#00b050', text: '#ffffff' },         // Green
    sakit: { bg: '#92d050', text: '#000000' },        // Light Green
    dinas: { bg: '#0070c0', text: '#ffffff' },        // Blue
    peringatan: { bg: '#ffc000', text: '#000000' },   // Yellow
    terlambat: { bg: '#ff0000', text: '#ffffff' },    // Red
    pulang_cepat: { bg: '#a6a6a6', text: '#ffffff' }, // Grey
    mangkir: { bg: '#ff66cc', text: '#000000' },      // Pink
    alpha: { bg: '#ed7d31', text: '#ffffff' },        // Orange
  };

  const style = styleMap[row.categoryClass];
  if (!style) return {};

  return {
    backgroundColor: style.bg,
    color: style.text,
  };
}

const customStyles = `
  .print-wrapper {
    position: relative;
    width: 100%;
    color: #000000;
    font-family: Arial, Helvetica, sans-serif;
  }
  .watermark-container {
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.08;
    pointer-events: none;
    z-index: 0;
    text-align: center;
    width: 100%;
  }
  .watermark-img {
    max-width: 320px;
    max-height: 320px;
    object-fit: contain;
  }
  .header-container,
  .info-grid,
  .report-table,
  .legend-section {
    position: relative;
    z-index: 1;
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
    margin-bottom: 14px;
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

  .info-grid {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 11px;
  }
  .info-column {
    width: 48%;
  }
  .info-row {
    display: flex;
    margin-bottom: 4px;
  }
  .info-label {
    width: 90px;
    font-weight: 600;
    color: #000000;
  }
  .info-sep {
    width: 12px;
    color: #000000;
  }
  .info-value {
    flex: 1;
    color: #000000;
  }

  .report-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    table-layout: fixed;
    border: 1px solid #000000;
  }
  .report-table th {
    background-color: #ffffff;
    color: #000000;
    font-weight: bold;
    font-size: 10px;
    padding: 5px 3px;
    border: 1px solid #000000;
    text-align: center;
    vertical-align: middle;
  }
  .report-table td {
    padding: 4px 3px;
    font-size: 10px;
    border: 1px solid #000000;
    color: #000000;
    vertical-align: middle;
  }
  .summary-row td {
    background-color: #ffffff;
    font-weight: bold;
    border: 1px solid #000000;
    border-top: 1px solid #000000;
    border-bottom: 1px solid #000000;
  }

  .legend-section {
    font-size: 8.5px;
    color: #000000;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .legend-title {
    font-size: 9.5px;
    font-weight: bold;
    margin-bottom: 4px;
  }
  .legend-grid {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .legend-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .color-box {
    width: 28px;
    height: 11px;
    display: inline-block;
    border-radius: 2px;
  }
  .legend-abbr {
    display: flex;
    align-items: center;
  }
  .abbr-code {
    width: 28px;
    font-weight: bold;
  }
`;

const customPrintStyles = ``;

function getPrintStyles() {
  return { customStyles, customPrintStyles };
}

defineExpose({
  getPrintStyles
});
</script>
