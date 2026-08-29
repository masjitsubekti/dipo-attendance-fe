import moment from "moment";
import appConfigService from "@/services/app_config.service";

import type { ExportColumn, ExportHeaderOptions } from "~/utils/export";

export interface SummaryRowOptions {
    label?: string;            // Custom label text for summary row (defaults to "TOTAL")
    labelColspan?: number;     // Number of columns to merge for label cell
    height?: number;           // Custom row height for summary row (e.g. 24, 28)
    data?: Record<string, any>; // Column key mapping to summary values
}

export interface MergeHeaderOption {
    cellFrom: string;       // Starting cell address relative to the table, e.g. "H1"
    cellTo: string;         // Ending cell address relative to the table, e.g. "I1"
    key?: string;           // Optional column key to auto-retrieve header text if value is omitted
    value?: any;            // Optional cell value/label override
    alignment?: any;        // Optional cell alignment styling
    font?: any;             // Optional cell font styling
    fill?: any;             // Optional cell fill styling
    border?: any;           // Optional cell border styling
}

interface ExportOptions {
    data: any[];
    columns: ExportColumn[];
    filename: string;
    sheetName?: string;
    headerOptions?: ExportHeaderOptions | boolean;
    summaryData?: SummaryRowOptions | Record<string, any>;
    headerHeight?: number;     // Custom height for the table header row (e.g. 24, 28)
    mergeHeaders?: MergeHeaderOption[];
}

export function useExcelExport() {
    const isExporting = ref(false);

    function getColumnLetter(colNum: number) {
        let letter = "";
        while (colNum > 0) {
            colNum--;
            letter = String.fromCharCode(65 + (colNum % 26)) + letter;
            colNum = Math.floor(colNum / 26);
        }
        return letter;
    }

    async function getImageInfo(url: string): Promise<{ dataUrl: string, ratio: number, width: number, height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/png');
                    resolve({
                        dataUrl,
                        ratio: img.width / img.height,
                        width: img.width,
                        height: img.height
                    });
                } else {
                    reject(new Error('Canvas context not available'));
                }
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    function sanitizeSheetName(name?: string): string {
        if (!name) return 'Data';
        const sanitized = name.replace(/[\/*?:\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
        return (sanitized.slice(0, 31) || 'Data').trim();
    }

    async function exportToExcel(options: ExportOptions) {
        let { data, columns, filename, sheetName = 'Data', headerOptions, summaryData, headerHeight, mergeHeaders } = options;
        if (data.length === 0) {
            return { success: false, message: 'No data to export' };
        }

        const effectiveHeaderHeight = headerHeight || (typeof headerOptions === 'object' ? (headerOptions as ExportHeaderOptions).headerHeight : undefined);

        isExporting.value = true;
        try {
            // Dynamic import of exceljs for client-side only
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(sanitizeSheetName(sheetName));

            // Add 'No' column at the beginning
            const allColumns = [
                { header: 'No', key: 'exportSeqNo', width: 5 },
                ...columns.map(col => ({
                    header: col.header,
                    key: col.key,
                    width: col.width || 15,
                })),
            ];

             worksheet.columns = allColumns;

            // Determine header rows count
            let maxHeaderRow = 1;
            if (mergeHeaders && Array.isArray(mergeHeaders)) {
                mergeHeaders.forEach(option => {
                    const matchFrom = option.cellFrom.match(/([0-9]+)$/);
                    const matchTo = option.cellTo.match(/([0-9]+)$/);
                    if (matchFrom && matchFrom[1]) maxHeaderRow = Math.max(maxHeaderRow, parseInt(matchFrom[1], 10));
                    if (matchTo && matchTo[1]) maxHeaderRow = Math.max(maxHeaderRow, parseInt(matchTo[1], 10));
                });
            }

            if (maxHeaderRow > 1) {
                const extraRowsCount = maxHeaderRow - 1;
                // Insert empty rows at the top to shift original headers down
                for (let i = 0; i < extraRowsCount; i++) {
                    worksheet.insertRow(1, []);
                }
            }

            // Style header rows - bold & center/middle alignment
            for (let r = 1; r <= maxHeaderRow; r++) {
                const headerRow = worksheet.getRow(r);
                headerRow.font = { bold: true };
                if (effectiveHeaderHeight) {
                    headerRow.height = effectiveHeaderHeight;
                }
                headerRow.eachCell({ includeEmpty: true }, (cell) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });
            }

            // Add data rows with numbering
            data.forEach((item: any, index: number) => {
                const rowData: Record<string, any> = { exportSeqNo: index + 1 };
                columns.forEach(col => {
                    const val = item[col.key];

                    // If numeric column or numeric value, keep as raw JavaScript number for Excel formatting
                    if (col.isNum || typeof val === 'number' || (val !== '' && val !== null && val !== undefined && !isNaN(Number(val)) && typeof val !== 'boolean')) {
                        const num = Number(val);
                        if (!isNaN(num)) {
                            rowData[col.key] = num;
                            return;
                        }
                    }

                    if (col.formatter) {
                        const formatted = col.formatter(val, item);
                        if (col.isNum && typeof formatted === 'string' && !isNaN(Number(formatted.replace(/[^0-9.-]/g, '')))) {
                            rowData[col.key] = Number(formatted.replace(/[^0-9.-]/g, ''));
                        } else {
                            rowData[col.key] = formatted;
                        }
                    } else {
                        rowData[col.key] = val ?? '';
                    }
                });

                worksheet.addRow(rowData);
            });

            // Add summary row if summaryData is provided
            let summaryRowNumber: number | null = null;
            let summaryLabelColspan = 1;
            let summaryLabelText = 'TOTAL';
            let summaryRowHeight: number | undefined = undefined;

            if (summaryData) {
                const isConfigObj = typeof summaryData === 'object' && ('data' in summaryData || 'label' in summaryData || 'height' in summaryData);
                const summaryValues: Record<string, any> = isConfigObj
                    ? (summaryData as SummaryRowOptions).data || {}
                    : (summaryData as Record<string, any>);

                summaryLabelText = (isConfigObj ? (summaryData as SummaryRowOptions).label : null) || 'TOTAL';
                summaryLabelColspan = isConfigObj ? ((summaryData as SummaryRowOptions).labelColspan || 0) : 0;
                summaryRowHeight = isConfigObj ? (summaryData as SummaryRowOptions).height : (summaryData as any)?.height;

                if (!summaryLabelColspan) {
                    const firstSumColIdx = columns.findIndex(col => col.key in summaryValues && summaryValues[col.key] !== undefined && summaryValues[col.key] !== null);
                    summaryLabelColspan = firstSumColIdx > 0 ? firstSumColIdx + 1 : 1; // +1 for 'No' column
                }

                const summaryRowData: Record<string, any> = { exportSeqNo: summaryLabelText };
                columns.forEach(col => {
                    const rawVal = summaryValues[col.key];
                    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                        const num = Number(rawVal);
                        if (!isNaN(num)) {
                            summaryRowData[col.key] = num;
                        } else {
                            summaryRowData[col.key] = rawVal;
                        }
                    } else {
                        summaryRowData[col.key] = '';
                    }
                });

                const addedSumRow = worksheet.addRow(summaryRowData);
                summaryRowNumber = addedSumRow.number;
                if (summaryRowHeight) {
                    addedSumRow.height = summaryRowHeight;
                }
            }

            // Add borders to all cells and format numeric cells
            worksheet.eachRow((row, rowNumber) => {
                const isSummaryRow = summaryRowNumber !== null && rowNumber === summaryRowNumber;
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                    if (rowNumber > maxHeaderRow) {
                        cell.alignment = { vertical: 'middle' };
                    }
                    if (isSummaryRow) {
                        cell.font = { bold: true };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
                    }
                    if (typeof cell.value === 'number') {
                        cell.numFmt = '#,##0';
                        cell.alignment = { horizontal: 'right', vertical: 'middle' };
                    }
                });
            });

            if (headerOptions) {
                let appConfig: any = null;
                try {
                    const res: any = await appConfigService().retrieveById(1);
                    if (res.data) {
                        appConfig = res.data;
                    }
                } catch (e) {
                    console.warn("Failed to fetch app config for excel export", e);
                }

                const opts = typeof headerOptions === 'boolean' ? {} : headerOptions;
                const companyName = opts.title || appConfig?.companyName || "Company Name";
                const numCols = allColumns.length;
                const endColLetter = getColumnLetter(numCols - 1 > 0 ? numCols - 1 : numCols);
                
                worksheet.spliceRows(1, 0, [], [], [], [], []);

                let headerRow = 1;

                worksheet.mergeCells(`A${headerRow}:${endColLetter}${headerRow}`);
                const titleCell = worksheet.getCell(`A${headerRow}`);
                titleCell.value = companyName;
                titleCell.font = { size: 16, bold: true };
                titleCell.alignment = { horizontal: "left", vertical: "middle" };
                worksheet.getRow(headerRow).height = 24;
                headerRow += 1;

                worksheet.mergeCells(`A${headerRow}:${endColLetter}${headerRow}`);
                const subtitleCell = worksheet.getCell(`A${headerRow}`);
                subtitleCell.value = "Data " + (opts.subtitle || "Data Export");
                subtitleCell.font = { size: 14, bold: true };
                subtitleCell.alignment = { horizontal: "left", vertical: "middle" };
                worksheet.getRow(headerRow).height = 20;
                headerRow += 1;

                worksheet.mergeCells(`A${headerRow}:${endColLetter}${headerRow}`);
                const periodeCell = worksheet.getCell(`A${headerRow}`);
                periodeCell.value = opts.periode ? `Periode : ${opts.periode}` : "";
                periodeCell.font = { size: 12, bold: false };
                periodeCell.alignment = { horizontal: "left", vertical: "middle" };
                headerRow += 1;

                if (opts.showPrintDate !== false) {
                    worksheet.mergeCells(`A${headerRow}:${endColLetter}${headerRow}`);
                    const dateCell = worksheet.getCell(`A${headerRow}`);
                    dateCell.value = "Dicetak pada : " + moment().format("DD/MM/YYYY HH:mm");
                    dateCell.font = { size: 12, bold: false };
                    dateCell.alignment = { horizontal: "left", vertical: "middle" };
                    headerRow += 1;
                }

                const dataHeaderRowIndex = 6;
                const dataHeaderRow = worksheet.getRow(dataHeaderRowIndex);
                dataHeaderRow.font = { bold: true };
                if (effectiveHeaderHeight) {
                    dataHeaderRow.height = effectiveHeaderHeight;
                }
                dataHeaderRow.eachCell({ includeEmpty: true }, (cell) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });

                let companyImage: { dataUrl: string, ratio: number, width: number, height: number } | null = null;
                const baseUrl = window.location.origin;

                // Try loading company logo from app config
                if (appConfig?.companyLogo) {
                    try {
                        const logoUrl = `${baseUrl}/api/files?path=${appConfig.companyLogo}`;
                        companyImage = await getImageInfo(logoUrl);
                    } catch (e) {
                        console.warn("Failed to load company logo from app config, trying default logo", e);
                    }
                }

                // If app config logo loading failed or was not specified, load the default logo
                if (!companyImage) {
                    try {
                        const defaultLogoUrl = `${baseUrl}/images/app-logo.png`;
                        companyImage = await getImageInfo(defaultLogoUrl);
                    } catch (e) {
                        console.warn("Failed to load default company logo", e);
                    }
                }

                // If we successfully got an image (either app config or default), add it to the worksheet
                if (companyImage) {
                    try {
                        const logoColStart = numCols;
                        const logoColEnd = numCols;
                                                worksheet.mergeCells(
                             `${getColumnLetter(logoColStart)}${1}:${getColumnLetter(logoColEnd)}${headerRow}`
                         );
                         
                         const logoCell = worksheet.getCell(`${getColumnLetter(logoColStart)}${1}`);
                         logoCell.alignment = { horizontal: "center", vertical: "middle" };
                         
                         const logoImgId = workbook.addImage({
                             base64: companyImage.dataUrl,
                             extension: "png",
                         });
 
                         worksheet.addImage(logoImgId, {
                             tl: { col: logoColStart - 1, row: 0 },
                             ext: { width: 115 * companyImage.ratio, height: 115 },
                         });
                    } catch (e) {
                        console.warn("Failed to add company logo to worksheet", e);
                    }
                }
            } else {
                for (let r = 1; r <= maxHeaderRow; r++) {
                    const headerRow = worksheet.getRow(r);
                    headerRow.font = { bold: true };
                    if (effectiveHeaderHeight) {
                        headerRow.height = effectiveHeaderHeight;
                    }
                    headerRow.eachCell({ includeEmpty: true }, (cell) => {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    });
                }
            }

            // Perform summary row cell merging and height adjustment AFTER spliceRows has shifted rows down
            if (summaryRowNumber !== null) {
                const finalSummaryRowIndex = headerOptions ? (summaryRowNumber + 5) : summaryRowNumber;
                const finalSumRow = worksheet.getRow(finalSummaryRowIndex);
                if (summaryRowHeight) {
                    finalSumRow.height = summaryRowHeight;
                }
                if (summaryLabelColspan > 1) {
                    const endLabelLetter = getColumnLetter(summaryLabelColspan);
                    worksheet.mergeCells(`A${finalSummaryRowIndex}:${endLabelLetter}${finalSummaryRowIndex}`);
                    const sumLabelCell = worksheet.getCell(`A${finalSummaryRowIndex}`);
                    sumLabelCell.value = summaryLabelText;
                    sumLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
                }
            }

            // Process mergeHeaders if provided
            if (mergeHeaders && Array.isArray(mergeHeaders)) {
                const offset = headerOptions ? 5 : 0;
                
                const getColIndex = (colStr: string) => {
                    let col = 0;
                    for (let i = 0; i < colStr.length; i++) {
                        col = col * 26 + (colStr.charCodeAt(i) - 64);
                    }
                    return col;
                };

                mergeHeaders.forEach(option => {
                    try {
                        const matchFromCol = option.cellFrom.match(/^([A-Z]+)/i);
                        const matchFromRow = option.cellFrom.match(/([0-9]+)$/);
                        const matchToCol = option.cellTo.match(/^([A-Z]+)/i);
                        const matchToRow = option.cellTo.match(/([0-9]+)$/);
                        
                        if (matchFromCol && matchFromRow && matchToCol && matchToRow && matchFromCol[1] && matchFromRow[1] && matchToCol[1] && matchToRow[1]) {
                            const fromColLetter = matchFromCol[1].toUpperCase();
                            const fromRowIndex = parseInt(matchFromRow[1], 10) + offset;
                            const toColLetter = matchToCol[1].toUpperCase();
                            const toRowIndex = parseInt(matchToRow[1], 10) + offset;
                            
                            const fromCell = `${fromColLetter}${fromRowIndex}`;
                            const toCell = `${toColLetter}${toRowIndex}`;
                            
                            // Find the value for the cell before merging
                            let cellValue = option.value;
                            if (cellValue === undefined) {
                                if (option.key) {
                                    const foundCol = columns.find(c => c.key === option.key);
                                    if (foundCol) {
                                        cellValue = foundCol.header;
                                    }
                                }
                                if (cellValue === undefined) {
                                    // If value is still undefined, look in the range (usually the last row of the header group)
                                    const sourceCell = worksheet.getCell(`${fromColLetter}${maxHeaderRow + offset}`);
                                    if (sourceCell && sourceCell.value !== null && sourceCell.value !== undefined) {
                                        cellValue = sourceCell.value;
                                    }
                                }
                            }

                            // Perform the merge
                            worksheet.mergeCells(fromCell, toCell);
                            
                            // Set the value in the top-left cell of the merge
                            const cell = worksheet.getCell(fromCell);
                            if (cellValue !== undefined) {
                                cell.value = cellValue;
                            }
                            
                            // Apply styling
                            if (option.alignment) {
                                cell.alignment = { ...cell.alignment, ...option.alignment };
                            } else {
                                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                            }
                            if (option.font) {
                                cell.font = { ...cell.font, ...option.font };
                            } else {
                                cell.font = { bold: true };
                            }
                            if (option.fill) {
                                cell.fill = option.fill;
                            }
                            
                            // Apply borders to all cells in the merged range
                            const borderStyle = option.border || {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                            
                            const fromColIndex = getColIndex(fromColLetter);
                            const toColIndex = getColIndex(toColLetter);
                            
                            for (let r = fromRowIndex; r <= toRowIndex; r++) {
                                const row = worksheet.getRow(r);
                                for (let c = fromColIndex; c <= toColIndex; c++) {
                                    const itemCell = row.getCell(c);
                                    itemCell.border = borderStyle;
                                }
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to merge cells ${option.cellFrom}:${option.cellTo}`, e);
                    }
                });
            }

            // Generate buffer
            const buffer = await workbook.xlsx.writeBuffer();

            // Small delay to show loading
            await new Promise(resolve => setTimeout(resolve, 500));

            // Create download
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);

            return { success: true };
        } catch (err: any) {
            console.error('Export failed:', err);
            return { success: false, message: err.message };
        } finally {
            isExporting.value = false;
        }
    }

    return {
        isExporting,
        exportToExcel,
    };
}
