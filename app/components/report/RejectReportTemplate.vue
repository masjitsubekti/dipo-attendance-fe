<template>
  <div class="reject-report">
    <template v-for="(item, index) in items" :key="item.id || index">
      <section class="reject-report-page">
        <div class="reject-report-header">
          <img class="reject-report-logo" src="/images/logo-mkn2.png" />
          <div class="reject-report-title">{{ t('FORMULIR PENOLAKAN BARANG') }}</div>
        </div>

        <table class="reject-report-table">
          <tbody>
            <tr>
              <td class="reject-form-number">
                <div class="reject-label">{{ t('Nomor Formulir') }}</div>
                <div>{{ item.rejectNo || '-' }}</div>
              </td>
              <td>
                <div class="reject-label">{{ t('Tanggal Insiden') }}</div>
                <div>{{ formatDate(item.rejectDateTime, 'YYYY-MM-DD') || '-' }}</div>
              </td>
              <td>
                <div class="reject-label">{{ t('Waktu Insiden') }}</div>
                <div>{{ formatDate(item.rejectDateTime, 'HH:mm:ss') || '-' }}</div>
              </td>
            </tr>
            <tr>
              <td><div class="reject-label">{{ t('Nama Perusahaan Pengirim') }}</div></td>
              <td colspan="2">
                {{ joinValues(item.agentName, item.shipperName) }}
              </td>
            </tr>
            <tr>
              <td><div class="reject-label">{{ t('Nama Perusahaan Penerbangan') }}</div></td>
              <td colspan="2">{{ item.airlineName || '-' }}</td>
            </tr>
            <tr>
              <td><div class="reject-label">{{ t('Keterangan Pemeriksaan') }}</div></td>
              <td colspan="2">{{ item.imageDescription || '-' }}</td>
            </tr>
            <tr>
              <td class="reject-detail-cell">
                <table class="reject-nested-table">
                  <tbody>
                    <tr>
                      <td>
                        <div class="reject-label">{{ t('Nomor SMU / AWB') }}</div>
                        <div>{{ item.awbNumber || '-' }}</div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div class="reject-label">{{ t('Airline / Route') }}</div>
                        <div>{{ joinValues(item.flightNo, item.route) }}</div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div class="reject-label">{{ t('Uraian PTI') }}</div>
                        <div>{{ item.commodityName || '-' }}</div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div class="reject-label">{{ t('Pengambilan Tindakan') }}</div>
                        <div>{{ item.actionTaking || '-' }}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td colspan="2" class="reject-photo-cell">
                <div class="reject-label">{{ t('Hasil Pemeriksaan (Lampiran Foto)') }}</div>
                <img
                  v-if="item.photoUrl"
                  class="reject-evidence-image"
                  :src="item.photoUrl"
                />
                <div v-else class="reject-no-photo">
                  {{ t('Tidak ada lampiran foto') }}
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="3">
                <div class="reject-label">{{ t('Bag Seal / Resi') }}</div>
                <div>{{ joinValues(item.bagSealNo, item.resiNo) }}</div>
              </td>
            </tr>
            <tr>
              <td colspan="3">
                <div class="reject-label">{{ t('Keterangan') }}</div>
                <div>{{ item.remarks || quantityLabel(item) }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <div v-if="index < items.length - 1" class="page-break"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  items: any[]
}>()

const { formatDate } = useFormat()
const { t } = useTranslation()

const joinValues = (...values: unknown[]) => {
  const filtered = values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
  return filtered.length ? filtered.join(' / ') : '-'
}

const quantityLabel = (item: any) => {
  const qty = Number(item.qty || 0)
  if (!qty) return '-'
  return `${qty} ${String(item.rejectType || 'pcs').toLowerCase()}`
}

const customStyles = `
  .reject-report {
    width: 100%;
  }
  .reject-report-page {
    width: 100%;
    box-sizing: border-box;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .reject-report-header {
    display: grid;
    grid-template-columns: 180px 1fr 180px;
    align-items: center;
    min-height: 70px;
    margin-bottom: 4px;
  }
  .reject-report-logo {
    grid-column: 1;
    max-width: 165px;
    max-height: 65px;
    object-fit: contain;
  }
  .reject-report-title {
    grid-column: 2;
    text-align: center;
    font-size: 15px;
    font-weight: bold;
  }
  .reject-report-table {
    width: 100%;
    border-collapse: collapse;
    border: 2px solid #000;
    table-layout: fixed;
    font-size: 13px;
  }
  .reject-report-table > tbody > tr > td {
    border: 2px solid #000;
    padding: 3px 5px;
    vertical-align: top;
    word-break: break-word;
  }
  .reject-report-table > tbody > tr:first-child > td:first-child {
    width: 34%;
  }
  .reject-report-table > tbody > tr:first-child > td:nth-child(2),
  .reject-report-table > tbody > tr:first-child > td:nth-child(3) {
    width: 33%;
  }
  .reject-label {
    color: #000;
    line-height: 1.15;
  }
  .reject-detail-cell {
    padding: 0 !important;
    width: 34%;
  }
  .reject-nested-table {
    width: 100%;
    height: 100%;
    border-collapse: collapse;
    border: 0;
  }
  .reject-nested-table td {
    min-height: 42px;
    border: 0;
    border-bottom: 2px solid #000;
    padding: 4px 5px;
    vertical-align: top;
  }
  .reject-nested-table tr:last-child td {
    border-bottom: 0;
  }
  .reject-photo-cell {
    height: 220px;
    padding: 4px 7px !important;
  }
  .reject-evidence-image {
    display: block;
    max-width: 92%;
    max-height: 190px;
    object-fit: contain;
    margin: 5px auto 0;
  }
  .reject-no-photo {
    margin-top: 70px;
    text-align: center;
    color: #777;
    font-size: 12px;
    font-style: italic;
  }
`

const customPrintStyles = `
  .reject-report-page {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
`

function getPrintStyles() {
  return { customStyles, customPrintStyles }
}

defineExpose({ getPrintStyles })
</script>
