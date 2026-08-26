<template>
  <div class="print-wrapper">
    <div class="header-container">
      <div>
        <img class="logo-img" src="/images/app-logo.png" />
      </div>
      <div class="doc-title">
        FORMULIR PENOLAKAN BARANG
      </div>
    </div>

    <table class="main-table">
      <tbody>
        <tr>
          <td style="width: 40%;">
            <div class="cell-label">Nomor Formulir</div>
            <div class="cell-value">{{ data.rejectNo || "-" }}</div>
          </td>
          <td style="width: 30%;">
            <div class="cell-label">Tanggal Insiden</div>
            <div class="cell-value">{{ formatDate(data.rejectDateTime, 'DD-MM-YYYY') }}</div>
          </td>
          <td style="width: 30%;">
            <div class="cell-label">Waktu Insiden</div>
            <div class="cell-value">{{ formatDate(data.rejectDateTime, 'HH:mm:ss') }}</div>
          </td>
        </tr>
        <tr>
          <td>
            <div class="cell-label">Nama Perusahaan Pengirim</div>
          </td>
          <td colspan="2"> 
            <div class="cell-value">{{ data.agentName }} / {{ data.shipperName }}</div>
          </td>
        </tr>
        <tr>
          <td>
            <div class="cell-label">Nama Perusahaan Penerbangan</div>
          </td>
          <td colspan="2">
            <div class="cell-value">{{ data.airlineName || "-" }}</div>
          </td>
        </tr>
        <tr>
          <td>
            <div class="cell-label">Keterangan Pemeriksaan</div>
          </td>
          <td colspan="2">
            <div class="cell-value">{{ data.dgItem || "-" }}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 0;">
            <table class="nested-table">
              <tbody>
                <tr>
                  <td>
                    <div class="cell-label">Nomor SMU / AWB</div>
                    <div class="cell-value">{{ data.bookingCode || "-" }}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="cell-label">Airline / Route</div>
                    <div class="cell-value">{{ data.airlineName || "" }} {{ data.flightNo }} / {{ data.route || "" }}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="cell-label">Uraian PTI</div>
                    <div class="cell-value">{{ data.commodityName || "-" }}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="cell-label">Pengambilan Tindakan</div>
                    <div class="cell-value">{{ data.actionTaking || "-" }}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
          <td colspan="2" class="photo-container">
            <div class="cell-label" style="text-align: left;">Hasil Pemeriksaan ( Lampiran Foto )</div>
            <img v-if="data.photoUrl" class="evidence-img" :src="data.photoUrl" />
            <div v-else class="no-photo">Tidak ada lampiran foto</div>
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <div class="cell-label">Bag Seal / Resi</div>
            <div class="cell-value">{{ data.bagSealNo || "-" }} / {{ data.resiNo || "-" }}</div>
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <div class="cell-label">Keterangan</div>
            <div class="cell-value">{{ data.remarks || "-" }}</div>
          </td>
        </tr>
      </tbody>
    </table>

    <table class="signature-table">
      <tbody>
        <tr>
          <td style="width: 50%; text-align: center; border: none; padding: 0;">
            <div class="signature-header">Submitted By</div>
            <div class="signature-space"></div>
            <div class="signature-name">( {{ data.avsecName }} )</div>
            <div class="signature-title">{{ data.avsecJobPosition }}</div>
          </td>
          <td style="width: 50%; text-align: center; border: none; padding: 0;">
            <div class="signature-header">Received By</div>
            <div class="signature-space"></div>
            <div class="signature-name">( {{ data.shipperName }} )</div>
            <div class="signature-title">Shipper</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  data: any;
}>();

const { formatDate } = useFormat();

const customStyles = `
  .header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    padding-bottom: 12px;
  }
  .logo-img {
    max-height: 60px;
    object-fit: contain;
  }
  .fallback-logo {
    font-weight: bold;
    font-size: 16px;
    color: #1e3a8a;
  }
  .fallback-logo span {
    font-size: 12px;
    color: #dc2626;
    font-style: italic;
  }
  .doc-title {
    font-size: 16px;
    font-weight: bold;
    text-align: right;
    letter-spacing: 0.5px;
  }
  .main-table {
    width: 100%;
    border-collapse: collapse;
    border: 2px solid #000;
  }
  .main-table td {
    border: 2px solid #000;
    padding: 4px 6px;
    vertical-align: top;
  }
  .cell-label {
    font-size: 14px;
    color: #000000;
    margin-bottom: 2px;
  }
  .cell-value {
    font-size: 14px;
  }
  .nested-table {
    width: 100%;
    border-collapse: collapse;
    border: none;
  }
  .nested-table td {
    border: none;
    border-bottom: 2px solid #000;
    padding: 4px 6px;
  }
  .nested-table tr:last-child td {
    border-bottom: none;
  }
  .photo-container {
    text-align: center;
    padding: 2px 2px;
  }
  .evidence-img {
    max-width: 100%;
    max-height: 250px;
    object-fit: contain;
    margin-top: 8px;
  }
  .no-photo {
    color: #888;
    font-style: italic;
    margin-top: 40px;
    font-size: 12px;
  }
  .signature-table {
    width: 100%;
    border: none;
    border-collapse: collapse;
    margin-top: 70px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .signature-header {
    font-size: 14px;
    color: #000;
    margin-bottom: 4px;
  }
  .signature-space {
    height: 75px;
  }
  .signature-name {
    font-size: 14px;
    color: #000000;
    margin-bottom: 2px;
  }
  .signature-title {
    font-size: 14px;
    color: #000000;
  }
  .signature-container {
    page-break-inside: avoid;
    break-inside: avoid;
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
