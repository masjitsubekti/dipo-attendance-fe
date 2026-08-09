<template>
  <div class="print-wrapper">
    <div class="header-container">
      <div class="header-left">
        <img class="logo-img" src="/images/logo-mkn2.png" />
      </div>
      <div class="header-right text-right">
        <div class="company-name">PT MITRA KARGO NUSANTARA</div>
        <div class="company-address">Komplek Pergudangan 88 Jl. Pasar Wisata Blok D-03 Pabean Kec. Sedati</div>
        <div class="company-address">Kab. Sidoarjo 61253</div>
        <div class="company-address">Phone: 62818706099, Fax: 0</div>
        <div class="company-address">Email: cs@aap.co.id</div>
      </div>
    </div>

    <div class="invoice-title">
      INVOICE
    </div>

    <div class="info-grid">
      <div class="invoice-to">
        <div class="info-label">Invoice To</div>
        <div class="agent-name">{{ data.agentName || "-" }}</div>
        <div class="agent-address">{{ data.agentCity || "Surabaya" }}</div>
      </div>
      <div class="invoice-meta-box">
        <table class="meta-table">
          <tbody>
            <tr>
              <td class="meta-label">Invoice No</td>
              <td class="meta-separator">:</td>
              <td class="meta-value">{{ data.invoiceNo || "-" }}</td>
            </tr>
            <tr>
              <td class="meta-label">Invoice Date</td>
              <td class="meta-separator">:</td>
              <td class="meta-value">{{ formatDate(data.invoiceDate, 'YYYY-MM-DD') }}</td>
            </tr>
            <tr>
              <td class="meta-label">Due Date</td>
              <td class="meta-separator">:</td>
              <td class="meta-value">{{ formatDate(data.dueDate, 'YYYY-MM-DD') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 50%;">Description</th>
          <th style="width: 10%;">AWB</th>
          <th style="width: 10%;">Colly</th>
          <th style="width: 10%;">Weight</th>
          <th style="width: 15%;">Charge</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">1</td>
          <td>Transaksi Regulated Agent {{ formatDate(data.periodStart, 'YYYY-MM-DD') }} s/d {{ formatDate(data.periodEnd, 'YYYY-MM-DD') }}</td>
          <td class="text-center">{{ data.totalAwb || data.awbCount || 0 }}</td>
          <td class="text-center">{{ formatNumber(data.totalColly) }}</td>
          <td class="text-center">{{ formatNumber(data.totalWeight) }}</td>
          <td class="text-right">IDR {{ formatNumber(data.subtotal) }}</td>
        </tr>
        <tr class="summary-row">
          <td colspan="5" class="text-right summary-label">Sub Total</td>
          <td class="text-right font-bold">IDR {{ formatNumber(data.subtotal) }}</td>
        </tr>
        <tr v-if="data.discountAmount > 0" class="summary-row">
          <td colspan="5" class="text-right summary-label">Discount</td>
          <td class="text-right font-bold" style="color: #e81123;">IDR {{ formatNumber(data.discountAmount) }}</td>
        </tr>
        <tr v-if="data.adminFee > 0" class="summary-row">
          <td colspan="5" class="text-right summary-label">Admin Fee</td>
          <td class="text-right font-bold" style="color: #006847;">IDR {{ formatNumber(data.adminFee) }}</td>
        </tr>
        <tr v-if="data.ppn > 0" class="summary-row">
          <td colspan="5" class="text-right summary-label">PPN ({{ data.ppn || 0 }}%)</td>
          <td class="text-right font-bold" style="color: #006847;">IDR {{ formatNumber(data.ppnAmount) }}</td>
        </tr>
        <tr class="summary-row main-total">
          <td colspan="5" class="text-right summary-label font-bold">Grand Total</td>
          <td class="text-right font-bold">IDR {{ formatNumber(data.grandTotal) }}</td>
        </tr>
        <tr v-if="data.pph > 0" class="summary-row">
          <td colspan="5" class="text-right summary-label" style="color: #e81123;">PPh 23 ({{ data.pph || 0 }}%)</td>
          <td class="text-right font-bold" style="color: #e81123;">- IDR {{ formatNumber(data.pphAmount) }}</td>
        </tr>
        <tr v-if="data.pph > 0" class="summary-row main-total" style="background-color: #f1f5f9; border-top: 1px solid #cbd5e1;">
          <td colspan="5" class="text-right summary-label font-bold" style="color: #1e3a8a;">Total yang Harus Dibayar</td>
          <td class="text-right font-bold" style="color: #1e3a8a;">IDR {{ formatNumber(data.grandTotal - (data.pphAmount || 0)) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="inword-section">
      <strong>Inword :</strong> {{ getSpelledOutCharge(data.grandTotal) }}
    </div>

    <div class="bottom-grid">
      <div class="card-box">
        <div class="card-title">Rekening Pembayaran</div>
        <table class="card-table">
          <tbody>
            <tr>
              <td style="width: 25%">Bank</td>
              <td style="width: 5%">:</td>
              <td>{{ data.bankName || "-" }}</td>
            </tr>
            <tr>
              <td>Nama</td>
              <td>:</td>
              <td>{{ data.bankAccName || "-" }}</td>
            </tr>
            <tr>
              <td>Rekening</td>
              <td>:</td>
              <td class="font-mono font-bold">{{ data.bankAccNumber || "-" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-box">
        <div class="card-title">Notes :</div>
        <ul class="notes-list">
          <li v-for="(remark, index) in remarksList" :key="index">{{ remark }}</li>
        </ul>
      </div>
    </div>

    <div class="signature-section">
      <div class="print-meta">
        by {{ data.createdByName || "System" }} with Printed Time<br>
        {{ getPrintedTime() }}
      </div>
      <div class="approved-by-box">
        <div class="signature-label">Approved By</div>
        <div class="signature-space"></div>
        <div class="signature-name">Sasti Putri Marzarinda</div>
        <div class="signature-title">Finance</div>
      </div>
    </div>

    <!-- Annex / Lampiran Section -->
    <div v-if="data.details && data.details.length > 0" class="page-break"></div>

    <div v-if="data.details && data.details.length > 0" class="annex-section">
      <div class="annex-header">
        <div class="annex-header-left">
          <img class="logo-img" src="/images/logo-mkn2.png" />
        </div>
        <div class="annex-header-right text-right">
          <div class="annex-title">LAMPIRAN {{ data.invoiceNo || 'DRAFT' }}</div>
          <div class="annex-period">Periode : {{ formatDate(data.periodStart, 'YYYY-MM-DD') }} s/d {{ formatDate(data.periodEnd, 'YYYY-MM-DD') }}</div>
        </div>
      </div>

      <table class="annex-table">
        <thead>
          <tr>
            <th rowspan="3" style="width: 3%">No</th>
            <th rowspan="3" style="width: 10%">Date</th>
            <th rowspan="3" style="width: 10%">CSD</th>
            <th rowspan="3" style="width: 5%">Airline</th>
            <th rowspan="3" style="width: 12%">AWB.No</th>
            <th rowspan="3" style="width: 8%">Route</th>
            <th rowspan="3" style="width: 12%">Commodity</th>
            <th rowspan="3" style="width: 5%">Colly</th>
            <th rowspan="3" style="width: 5%">Weight</th>
            <th colspan="6" class="text-center">Charges</th>
          </tr>
          <tr>
            <th colspan="2" class="text-center">Amount</th>
            <th rowspan="2" class="text-center">Disc</th>
            <th rowspan="2" class="text-center">PPN</th>
            <th rowspan="2" class="text-center">PPH</th>
            <th rowspan="2" class="text-center">Total</th>
          </tr>
          <tr>
            <th class="text-center">Rate</th>
            <th class="text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(detail, idx) in data.details" :key="detail.id || idx">
            <td class="text-center">{{ Number(idx) + 1 }}</td>
            <td class="text-center">{{ formatDate(detail.trxDate, 'YYYY-MM-DD') }}</td>
            <td class="text-center">{{ detail.csdNo || '-' }}</td>
            <td class="text-center">{{ detail.airlineCode || '-' }}</td>
            <td class="text-center">{{ detail.awbNo || '-' }}</td>
            <td class="text-center">{{ detail.route || '-' }}</td>
            <td>{{ detail.commodityName || '-' }}</td>
            <td class="text-right">{{ formatNumber(detail.colly) }}</td>
            <td class="text-right">{{ formatNumber(detail.weight) }}</td>
            <td class="text-right">{{ formatNumber(detail.rate) }}</td>
            <td class="text-right">{{ formatNumber(detail.subtotal) }}</td>
            <td class="text-right">{{ formatNumber(detail.discountAmount) }}</td>
            <td class="text-right">0</td>
            <td class="text-right">0</td>
            <td class="text-right">{{ formatNumber((detail.subtotal || 0) - (detail.discountAmount || 0)) }}</td>
          </tr>
          <tr class="annex-totals-row font-bold">
            <td colspan="7" class="text-right">Total</td>
            <td class="text-right">{{ formatNumber(annexTotals.colly) }}</td>
            <td class="text-right">{{ formatNumber(annexTotals.weight) }}</td>
            <td></td>
            <td class="text-right">{{ formatNumber(annexTotals.subtotal) }}</td>
            <td class="text-right">{{ formatNumber(annexTotals.discountAmount) }}</td>
            <td class="text-right">{{ formatNumber(annexTotals.ppn) }}</td>
            <td class="text-right">{{ formatNumber(annexTotals.pph) }}</td>
            <td class="text-right">{{ formatNumber(annexTotals.totalAmount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFormat } from "~/composables/useFormat";

const props = defineProps<{
  data: any;
}>();

const { formatDate, formatNumber, getSpelledOutCharge } = useFormat();

const remarksList = computed(() => {
  if (!props.data?.remarks) return [];
  return props.data.remarks
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
});

const getPrintedTime = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const date = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`
}

const annexTotals = computed(() => {
  let colly = 0;
  let weight = 0;
  let subtotal = 0;
  let discountAmount = 0;
  let ppn = 0;
  let pph = 0;
  let totalAmount = 0;

  if (props.data?.details) {
    for (const detail of props.data.details) {
      colly += detail.colly || 0;
      weight += detail.weight || 0;
      subtotal += detail.subtotal || 0;
      discountAmount += detail.discountAmount || 0;
      ppn += 0;
      pph += 0;
      totalAmount += (detail.subtotal || 0) - (detail.discountAmount || 0);
    }
  }

  return { colly, weight, subtotal, discountAmount, ppn, pph, totalAmount };
});

const customStyles = `
  .header-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .logo-img {
    max-height: 50px;
    object-fit: contain;
  }
  .company-name {
    font-size: 18px;
    font-weight: bold;
    color: #1e3a8a;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .company-address {
    font-size: 12px;
    color: #475569;
    line-height: 1.4;
  }
  .text-right {
    text-align: right;
  }
  .invoice-title {
    font-size: 26px;
    font-weight: 800;
    color: #1e3a8a;
    text-align: center;
    letter-spacing: 1px;
    margin: 30px 0;
  }
  .info-grid {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }
  .invoice-to {
    width: 50%;
  }
  .info-label {
    font-size: 15px;
    font-weight: bold;
    color: #0f172a;
    margin-bottom: 6px;
  }
  .agent-name {
    font-size: 14px;
    font-weight: bold;
    color: #1e3a8a;
    margin-bottom: 2px;
  }
  .agent-address {
    font-size: 13px;
    color: #475569;
  }
  .invoice-meta-box {
    width: 40%;
    background-color: #1e3a8a;
    border-radius: 4px;
    padding: 10px 15px;
    color: #ffffff;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
  }
  .meta-table td {
    padding: 3px 0;
    font-size: 12px;
    vertical-align: middle;
  }
  .meta-label {
    font-weight: bold;
    width: 40%;
  }
  .meta-separator {
    width: 5%;
  }
  .meta-value {
    font-weight: normal;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  .items-table th {
    background-color: #1e3a8a;
    color: #ffffff;
    font-weight: bold;
    font-size: 12px;
    padding: 8px 10px;
    text-align: left;
    border: 1px solid #e2e8f0;
  }
  .items-table td {
    padding: 8px 10px;
    font-size: 12px;
    border: 1px solid #e2e8f0;
    color: #334155;
  }
  .items-table tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .text-center {
    text-align: center;
  }
  .text-right {
    text-align: right;
  }
  .font-bold {
    font-weight: bold;
  }
  .summary-row td {
    border: none;
    border-bottom: 1px solid #f1f5f9;
    padding: 6px 10px;
  }
  .summary-label {
    font-weight: 600;
    color: #475569;
  }
  .main-total td {
    border-top: 2px solid #cbd5e1;
    border-bottom: 2px solid #cbd5e1;
    font-size: 14px;
    padding: 10px;
  }
  .inword-section {
    font-size: 13px;
    color: #334155;
    margin-bottom: 25px;
    font-style: italic;
  }
  .bottom-grid {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 40px;
  }
  .card-box {
    width: 48%;
    background-color: #f1f5f9;
    border-radius: 4px;
    padding: 12px 16px;
  }
  .card-title {
    font-size: 12px;
    font-weight: bold;
    color: #1e3a8a;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .card-table {
    width: 100%;
    border-collapse: collapse;
  }
  .card-table td {
    padding: 3px 0;
    font-size: 12px;
    color: #334155;
    vertical-align: middle;
  }
  .font-mono {
    font-family: monospace;
  }
  .notes-list {
    margin: 0;
    padding-left: 15px;
    font-size: 12px;
    color: #334155;
    line-height: 1.5;
  }
  .signature-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 40px;
  }
  .print-meta {
    font-size: 10px;
    color: #64748b;
    line-height: 1.4;
  }
  .approved-by-box {
    text-align: center;
    width: 200px;
  }
  .signature-label {
    font-size: 13px;
    font-weight: bold;
    color: #0f172a;
    margin-bottom: 4px;
  }
  .signature-space {
    height: 75px;
  }
  .signature-name {
    font-size: 13px;
    font-weight: bold;
    color: #1e293b;
    padding-bottom: 2px;
    margin-bottom: 2px;
  }
  .signature-title {
    font-size: 11px;
    color: #64748b;
  }
  .annex-section {
    font-family: Arial, sans-serif;
  }
  .annex-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  .annex-header-left {
    display: flex;
    align-items: center;
  }
  .annex-header-left .logo-img {
    max-height: 45px;
    object-fit: contain;
  }
  .annex-title {
    font-size: 15px;
    font-weight: bold;
    color: #333;
    letter-spacing: 0.5px;
  }
  .annex-period {
    font-size: 12px;
    color: #333;
    margin-top: 4px;
  }
  .annex-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  .annex-table th {
    background-color: #b4c6e7;
    color: #000000;
    font-weight: bold;
    font-size: 11px;
    padding: 6px 3px;
    border: 1px solid #7f7f7f;
    text-align: center;
    vertical-align: middle;
  }
  .annex-table td {
    padding: 5px 3px;
    font-size: 10px;
    border: 1px solid #7f7f7f;
    color: #000000;
    vertical-align: middle;
  }
  .annex-totals-row td {
    background-color: #ffffff !important;
    border-top: 2px solid #000000;
    border-bottom: 2px solid #000000;
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
