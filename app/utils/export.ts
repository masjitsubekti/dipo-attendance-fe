export interface ExportColumn {
    header: string;
    key: string;
    width?: number;
    formatter?: (value: any, row: any) => any;
    isNum?: boolean;
    numFmt?: string;
    align?: 'left' | 'center' | 'right';
}

export interface ColumnGroup {
    label: string;         // Group label shown on row 1 (e.g. "Invoice")
    keys: string[];        // Column keys that belong to this group
    rowspan?: number;      // If set >1, the label cell spans this many rows (used for standalone columns)
}

export interface ExportHeaderOptions {
    title?: string;
    subtitle?: string;
    periode?: string;
    showPrintDate?: boolean;
    headerHeight?: number;
}
