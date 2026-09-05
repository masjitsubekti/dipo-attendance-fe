
import { useSwal } from "~/composables/useSwal";

export interface PrintHTMLMargins {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

export interface PrintHTMLOptions {
  /** Document title shown in the browser tab and toolbar */
  title?: string;
  /** Popup window width in pixels */
  width?: number;
  /** Popup window height in pixels */
  height?: number;
  /** Page margin (e.g. "1cm", "0.6cm" or an object specifying individual margins) */
  margin?: string | PrintHTMLMargins;
  /** Orientation of the paper: "portrait" or "landscape". Defaults to "portrait" */
  orientation?: "portrait" | "landscape";
  /** Paper size (e.g. "A4", "A5", "Letter"). Defaults to "A4" */
  paperSize?: string;
  /** 
   * Controls if window.print() is executed automatically on window load.
   * - true: always auto print on load.
   * - false: never auto print on load.
   * - "mobile-only": only auto print if opened from a mobile/tablet browser.
   * Defaults to "mobile-only".
   */
  autoPrint?: boolean | "mobile-only";
  /** Additional CSS styles specific to this report/document */
  customStyles?: string;
  /** Additional CSS for @media print overrides specific to this report */
  customPrintStyles?: string;
  /** Font family for the document, e.g. "'Times New Roman', Times, serif" */
  fontFamily?: string;
}

export function useHTMLPrint() {
  const swal = useSwal();

  function printHTML(contentHtml: string, options: PrintHTMLOptions = {}) {
    const {
      title = "Print Document",
      width,
      height,
      margin = "1cm",
      orientation = "portrait",
      paperSize = "A4",
      autoPrint = "mobile-only",
      customStyles = "",
      customPrintStyles = "",
      fontFamily = "'Arial', sans-serif",
    } = options;

    // Resolve margin string or object into standard CSS shorthand
    let cssMargin = "1cm";
    if (typeof margin === "string") {
      cssMargin = margin;
    } else if (margin && typeof margin === "object") {
      const top = margin.top ?? "1cm";
      const right = margin.right ?? "1cm";
      const bottom = margin.bottom ?? "1cm";
      const left = margin.left ?? "1cm";
      cssMargin = `${top} ${right} ${bottom} ${left}`;
    }

    // Resolve dynamic sizes based on orientation to maintain perfect desktop look
    const isLandscape = orientation === "landscape";
    const defaultWidth = isLandscape ? 1200 : 850;
    const defaultHeight = isLandscape ? 850 : 900;
    const windowWidth = width || defaultWidth;
    const windowHeight = height || defaultHeight;
    const viewportWidth = isLandscape ? 1200 : 850;
    const bodyMinWidth = isLandscape ? 1150 : 820;

    // A4 dimensions: 210mm x 297mm
    const pageContainerWidth = paperSize === "A4" ? (isLandscape ? "297mm" : "210mm") : "800px";
    const pageContainerMinHeight = paperSize === "A4" ? (isLandscape ? "210mm" : "297mm") : "auto";

    const printWindow = window.open("", "_blank", `width=${windowWidth},height=${windowHeight},scrollbars=yes,resizable=yes`);
    if (!printWindow) {
      swal.toast("Gagal membuka jendela cetak. Pastikan pop-up tidak diblokir.", "error");
      return;
    }

    // Check if we should trigger print dialog automatically
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const shouldTriggerPrint = autoPrint === true || (autoPrint === "mobile-only" && isMobileDevice);

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=${viewportWidth}">
          <title>${title}</title>
          <style>
            /* ========== BASE PRINT MEDIA ========== */
            @media print {
              .no-print { display: none !important; }
              @page {
                size: ${paperSize} ${orientation};
                margin: 0;
              }
              body { 
                margin: 0 !important; 
                padding: 0 !important;
                min-width: unset !important;
                background-color: #fff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-page { 
                margin: 0 auto !important; 
                padding: ${cssMargin} !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                box-sizing: border-box !important;
                min-height: unset !important;
                background-color: transparent !important;
              }
              .page-break {
                height: 0 !important;
                background-color: transparent !important;
                border: none !important;
                margin: 0 !important;
                page-break-after: always !important;
                break-after: page !important;
              }
              /* Table printing best practices */
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
              /* Custom print overrides per report */
              ${customPrintStyles}
            }

            /* ========== BASE SCREEN STYLES ========== */
            .print-page, .print-page * {
              font-family: ${fontFamily} !important;
            }
            .print-toolbar, .print-toolbar * {
              font-family: Arial, Helvetica, sans-serif !important;
            }
            body {
              color: #000;
              line-height: 1.3;
              margin: 0;
              padding: 80px 20px 40px 20px; /* Leave space for fixed header */
              background-color: #525659; /* Sleek PDF Viewer style background */
              /* Force fixed desktop width on screen for precise pinch-to-zoom PDF feel */
              min-width: ${bodyMinWidth}px;
            }
            .print-toolbar {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: 56px;
              background-color: #323639; /* Sleek PDF Reader dark slate toolbar color */
              color: #f1f5f9;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0 24px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.35);
              z-index: 1000;
              box-sizing: border-box;
            }
            .toolbar-left {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .pdf-icon {
              color: #ff5252; /* PDF Red accent */
            }
            .toolbar-title {
              font-size: 14px;
              font-weight: bold;
              letter-spacing: 0.5px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 450px;
            }
            .toolbar-right {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              font-weight: bold;
              cursor: pointer;
              font-size: 13px;
              transition: background-color 0.15s, transform 0.1s;
              outline: none;
            }
            .btn:active {
              transform: scale(0.98);
            }
            .btn-print {
              background-color: #16a34a;
              color: #fff;
            }
            .btn-print:hover {
              background-color: #15803d;
            }
            .btn-close {
              background-color: #4a4d51;
              color: #f1f5f9;
              border: 1px solid #5a5d62;
            }
            .btn-close:hover {
              background-color: #5a5d62;
            }

            /* Responsive Scaling for Mobile Viewport */
            @media screen and (max-width: 500px) {
              .print-toolbar {
                height: 88px; /* Taller header */
                padding: 0 20px;
              }
              .toolbar-title {
                font-size: 18px;
                max-width: 250px;
              }
              .pdf-icon {
                width: 32px;
                height: 32px;
              }
              .btn {
                padding: 14px 26px; /* Super easy touch targets for fingers */
                font-size: 18px;
                border-radius: 6px;
              }
              .btn svg {
                width: 22px;
                height: 22px;
                margin-right: 8px !important;
              }
              .toolbar-right {
                gap: 16px;
              }
              body {
                padding-top: 110px; /* Extra padding to clear the taller mobile toolbar */
              }
            }

            .print-page {
              background-color: #fff;
              padding: ${cssMargin};
              border-radius: 4px;
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
              width: ${pageContainerWidth};
              min-height: ${pageContainerMinHeight};
              margin: 0 auto;
              box-sizing: border-box;
            }
            /* Clean visual dashed page split space in screen preview */
            .page-break {
              height: 40px;
              border-top: 1px dashed #cbd5e1;
              margin-top: 25px;
              margin-bottom: 25px;
              background-color: transparent;
            }

            /* ========== CUSTOM REPORT STYLES ========== */
            ${customStyles}
          </style>
        </head>
        <body>
          <div class="no-print print-toolbar">
            <div class="toolbar-left">
              <!-- Clean Single Page PDF Icon SVG -->
              <svg class="pdf-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4.5-3H19v1.5h1.5V11H19v2h-1.5V7h3v1.5zM9 10h1V8H9v2zm5 2.5h1v-4h-1v4z"/>
              </svg>
              <span class="toolbar-title">${title}</span>
            </div>
            <div class="toolbar-right">
              <button onclick="window.print()" class="btn btn-print">
                <!-- Printer Icon SVG -->
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 6px;">
                  <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
                Cetak
              </button>
              <button onclick="window.close()" class="btn btn-close">
                <!-- Close Icon SVG -->
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 6px;">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                Tutup
              </button>
            </div>
          </div>

          <div class="print-page">
            ${contentHtml}
          </div>

          <script>
            window.onload = function() {
              if (${shouldTriggerPrint}) {
                setTimeout(function() {
                  window.print();
                }, 400);
              }
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
  }

  return {
    printHTML
  };
}
