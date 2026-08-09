import moment from "moment";
import appConfigService from "@/services/app_config.service";

/**
 * Composable for exporting data to PDF
 */

import type { ExportColumn, ExportHeaderOptions } from "~/utils/export";

export interface FontOptions {
    headerTitle?: number;
    headerSubtitle?: number;
    headerText?: number;
    tableHeader?: number;
    tableBody?: number;
}

interface ExportOptions {
    data: any[];
    columns: ExportColumn[];
    filename: string;
    headerOptions?: ExportHeaderOptions | boolean;
    orientation?: "portrait" | "landscape";
    pageSize?: string;
    fontOptions?: FontOptions;
}

export function usePDFExport() {
    const isExporting = ref(false);

    async function getImageInfo(url: string): Promise<{
        dataUrl: string;
        ratio: number;
        width: number;
        height: number;
    }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL("image/png");
                    resolve({
                        dataUrl,
                        ratio: img.width / img.height,
                        width: img.width,
                        height: img.height,
                    });
                } else {
                    reject(new Error("Canvas context not available"));
                }
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    async function exportToPdf(options: ExportOptions) {
        const {
            data,
            columns,
            filename,
            headerOptions,
            orientation = "landscape",
            pageSize = "A4",
            fontOptions = {},
        } = options;

        const fonts = {
            headerTitle: fontOptions.headerTitle ?? 14,
            headerSubtitle: fontOptions.headerSubtitle ?? 12,
            headerText: fontOptions.headerText ?? 9,
            tableHeader: fontOptions.tableHeader ?? 8,
            tableBody: fontOptions.tableBody ?? 8,
        };

        if (data.length === 0) {
            return { success: false, message: "No data to export" };
        }

        isExporting.value = true;
        try {
            // Dynamic import of pdfmake for client-side only
            const pdfMake = (await import("pdfmake/build/pdfmake"))
                .default as any;
            const pdfFonts = (await import("pdfmake/build/vfs_fonts")).default;
            pdfMake.vfs = pdfFonts;

            let appConfig: any = null;
            let logoImage: any = null;

            // Fetch app config and logo if needed
            if (headerOptions) {
                try {
                    const res: any = await appConfigService().retrieveById(1);
                    if (res.data) {
                        appConfig = res.data;
                    }
                } catch (e) {
                    console.warn(
                        "Failed to fetch app config for pdf export",
                        e,
                    );
                }

                if (appConfig?.companyLogo && headerOptions) {
                    try {
                        const baseUrl = window.location.origin;
                        const logoUrl = `${baseUrl}/api/files?path=${appConfig.companyLogo}`;
                        const logoInfo = await getImageInfo(logoUrl);
                        logoImage = {
                            image: logoInfo.dataUrl,
                            width: 60,
                            height: 60 / logoInfo.ratio,
                        };
                    } catch (e) {
                        console.warn(
                            "Failed to load company logo for pdf export",
                            e,
                        );
                    }
                }
            }

            // Build table data with numbering
            const tableBody: any[][] = [];

            // Header row with 'No' column
            const headerRow = [
                {
                    text: "No",
                    style: "tableHeader",
                    alignment: "center",
                    fontSize: fonts.tableHeader,
                },
                ...columns.map((col) => ({
                    text: col.header,
                    style: "tableHeader",
                    alignment: "center",
                    fontSize: fonts.tableHeader,
                })),
            ];
            tableBody.push(headerRow);

            // Data rows
            data.forEach((item: any, index: number) => {
                const rowData: any[] = [
                    { text: index + 1, alignment: "center", fontSize: fonts.tableBody },
                ];

                columns.forEach((col) => {
                    let value = "";
                    if (col.formatter) {
                        value = col.formatter(item[col.key], item);
                    } else {
                        value = item[col.key] ?? "";
                    }
                    rowData.push({
                        text: String(value),
                        alignment: "left",
                        fontSize: fonts.tableBody,
                    });
                });

                tableBody.push(rowData);
            });

            // Build column widths
            const columnWidths: (string | number)[] = [35];
            columns.forEach((col) => {
                columnWidths.push(col.width ? col.width : "auto");
            });

            // Build document content
            const content: any[] = [];

            // Add header section if headerOptions provided
            if (headerOptions) {
                const opts =
                    typeof headerOptions === "boolean" ? {} : headerOptions;
                const companyName =
                    opts.title || appConfig?.companyName || "Company Name";
                const subtitle = opts.subtitle || "Data Export";
                const periode = opts.periode || "";
                const showPrintDate = opts.showPrintDate !== false;

                // Header table with logo and text
                if (logoImage) {
                    content.push({
                        table: {
                            widths: ["70%", "30%"],
                            body: [
                                [
                                    {
                                        stack: [
                                            {
                                                text: companyName,
                                                style: "headerTitle",
                                            },
                                            {
                                                text: "Data " + subtitle,
                                                style: "headerSubtitle",
                                            },
                                            periode
                                                ? {
                                                      text: `Periode : ${periode}`,
                                                      style: "headerText",
                                                  }
                                                : "",
                                            showPrintDate
                                                ? {
                                                      text: `Dicetak pada : ${moment().format("DD/MM/YYYY HH:mm")}`,
                                                      style: "headerText",
                                                  }
                                                : "",
                                        ].filter(Boolean),
                                        border: [false, false, false, false],
                                    },
                                    {
                                        image: logoImage.image,
                                        width: logoImage.width,
                                        height: logoImage.height,
                                        alignment: "right",
                                        border: [false, false, false, false],
                                    },
                                ],
                            ],
                            border: [false, false, false, false],
                        },
                    });
                } else {
                    content.push({
                        stack: [
                            { text: companyName, style: "headerTitle" },
                            {
                                text: "Data " + subtitle,
                                style: "headerSubtitle",
                            },
                            periode
                                ? {
                                      text: `Periode : ${periode}`,
                                      style: "headerText",
                                  }
                                : "",
                            showPrintDate
                                ? {
                                      text: `Dicetak pada : ${moment().format("DD/MM/YYYY HH:mm")}`,
                                      style: "headerText",
                                  }
                                : "",
                        ].filter(Boolean),
                    });
                }

                content.push({ text: "", margin: [0, 5] });
            }

            // Add data table
            content.push({
                table: {
                    headerRows: 1,
                    widths: columnWidths,
                    body: tableBody,
                },
                layout: {
                    hLineWidth: (i: number, node: any) => {
                        return i === 0 || i === node.table.body.length
                            ? 1.0
                            : 0.5;
                    },
                    vLineWidth: (i: number, node: any) => {
                        return i === 0 || i === node.table.widths.length
                            ? 1.0
                            : 0.5;
                    },
                    hLineColor: (i: number, node: any) => {
                        return i === 0 || i === node.table.body.length
                            ? "#d0d0d0"
                            : "#d0d0d0";
                    },
                    vLineColor: (i: number, node: any) => {
                        return i === 0 || i === node.table.widths.length
                            ? "#d0d0d0"
                            : "#d0d0d0";
                    },
                    paddingLeft: (i: number) => 3,
                    paddingRight: (i: number) => 3,
                    paddingTop: (i: number) => 2,
                    paddingBottom: (i: number) => 2,
                },
            });

            // Document definition with enterprise styling
            const docDefinition: any = {
                pageSize: pageSize,
                pageOrientation: orientation,
                pageMargins: [15, 30, 15, 30],
                content: content,
                styles: {
                    headerTitle: {
                        fontSize: fonts.headerTitle,
                        bold: true,
                        margin: [0, 0, 0, 3],
                    },
                    headerSubtitle: {
                        fontSize: fonts.headerSubtitle,
                        bold: true,
                        margin: [0, 0, 0, 2],
                    },
                    headerText: {
                        fontSize: fonts.headerText,
                        margin: [0, 0, 0, 1],
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: fonts.tableHeader,
                        fillColor: "#e8e8e8",
                        color: "#333333",
                        margin: [3, 3, 3, 3],
                    },
                },
                defaultStyle: {
                    font: "Roboto",
                    fontSize: fonts.tableBody,
                },
            };

            // Generate PDF
            const pdfDoc = pdfMake.createPdf(docDefinition);

            // Small delay to show loading
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Download PDF
            pdfDoc.download(
                `${filename}_${new Date().toISOString().split("T")[0]}.pdf`,
            );

            return { success: true };
        } catch (err: any) {
            console.error("PDF export failed:", err);
            return { success: false, message: err.message };
        } finally {
            isExporting.value = false;
        }
    }

    return {
        isExporting,
        exportToPdf,
    };
}
