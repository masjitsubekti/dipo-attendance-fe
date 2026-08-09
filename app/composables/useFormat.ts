/**
 * Global formatting utilities composable
 * Auto-imported by Nuxt for use in any component
 */
import moment from 'moment'
import 'moment/locale/id' // Indonesian locale

// Set default locale to Indonesian
moment.locale('id')

export const useFormat = () => {
    /**
     * Format date using moment.js
     * @param date - Date string, Date object, or timestamp
     * @param format - Moment format string or preset name
     * @returns Formatted date string
     */
    const formatDate = (
        date: string | Date | number | null | undefined,
        format: string = 'YYYY-MM-DD',
        utc: boolean = false
    ): string => {
        if (!date) return '-'

        try {
            const m = utc ? moment.utc(date, [moment.ISO_8601, 'HH:mm', 'HH:mm:ss']) : moment(date)
            if (!m.isValid()) return '-'
            return m.format(format)
        } catch {
            return '-'
        }
    }

    /**
    * Format date using moment.js
    * @param date - Date string, Date object, or timestamp
    * @param format - Moment format string or preset name
    * @param utc - Whether to format as UTC (don't convert to local timezone)
    * @returns Formatted date string
    */
    const formatDateTemplate = (
        date: string | Date | number | null | undefined,
        format: string | 'short' | 'long' | 'datetime' | 'time' | 'relative' = 'short',
        utc: boolean = false
    ): string => {
        if (!date) return '-'

        try {
            const m = utc ? moment.utc(date) : moment(date)

            if (!m.isValid()) return '-'

            // Preset formats
            const presets: Record<string, string> = {
                short: 'DD MMM YYYY',           // 02 Feb 2026
                long: 'dddd, DD MMMM YYYY',     // Senin, 02 Februari 2026
                datetime: 'DD MMM YYYY, HH:mm', // 02 Feb 2026, 17:10
                time: 'HH:mm:ss',               // 17:10:30
                iso: 'YYYY-MM-DD',              // 2026-02-02
                full: 'DD MMMM YYYY HH:mm:ss',  // 02 Februari 2026 17:10:30
            }

            // Handle relative time separately
            if (format === 'relative') {
                return m.fromNow() // "2 hari yang lalu"
            }

            const formatString = presets[format] || format
            return m.format(formatString)
        } catch {
            return '-'
        }
    }

    /**
     * Format date to relative time using moment.js
     * @param date - Date string, Date object, or timestamp
     * @returns Relative time string (e.g., "2 hari yang lalu")
     */
    const formatRelativeTime = (date: string | Date | number | null | undefined): string => {
        if (!date) return '-'

        try {
            const m = moment(date)
            if (!m.isValid()) return '-'
            return m.fromNow()
        } catch {
            return '-'
        }
    }

    /**
     * Format number with thousand separators
     * @param num - Number to format
     * @param decimals - Number of decimal places
     * @returns Formatted number string
     */
    const formatNumber = (num: number | null | undefined, decimals: number = 0): string => {
        if (num === null || num === undefined) return '-'

        return num.toLocaleString('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })
    }

    /**
     * Format currency
     * @param amount - Amount to format
     * @param currency - Currency code (default: IDR)
     * @returns Formatted currency string
     */
    const formatCurrency = (
        amount: number | null | undefined,
        currency: string = 'IDR'
    ): string => {
        if (amount === null || amount === undefined) return '-'

        return amount.toLocaleString('id-ID', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })
    }

    /**
     * Format phone number
     * @param phone - Phone number string
     * @returns Formatted phone number
     */
    const formatPhone = (phone: string | null | undefined): string => {
        if (!phone) return '-'

        // Remove non-digits
        const cleaned = phone.replace(/\D/g, '')

        // Format Indonesian phone number
        if (cleaned.startsWith('62')) {
            return `+62 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`
        }
        if (cleaned.startsWith('0')) {
            return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`
        }

        return phone
    }

    /**
     * Mask sensitive string (e.g., for identity numbers)
     * @param str - String to mask
     * @param visibleStart - Number of visible characters at start
     * @param visibleEnd - Number of visible characters at end
     * @returns Masked string
     */
    const maskString = (
        str: string | null | undefined,
        visibleStart: number = 4,
        visibleEnd: number = 4
    ): string => {
        if (!str) return '-'
        if (str.length <= visibleStart + visibleEnd) return str

        const start = str.slice(0, visibleStart)
        const end = str.slice(-visibleEnd)
        const maskLength = str.length - visibleStart - visibleEnd
        const mask = '*'.repeat(Math.min(maskLength, 6))

        return `${start}${mask}${end}`
    }

    /**
     * Helper to spell out numbers in Indonesian word format
     * @param nilai - Number to spell out
     * @returns Spelled out string
     */
    const terbilang = (nilai: number): string => {
        const bilangan = [
            "", "Satu", "Dua", "Tiga", "Empat", "Lima",
            "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
        ]
        if (nilai < 12) {
            return bilangan[nilai] || ""
        } else if (nilai < 20) {
            return terbilang(nilai - 10) + " Belas"
        } else if (nilai < 100) {
            return terbilang(Math.floor(nilai / 10)) + " Puluh " + terbilang(nilai % 10)
        } else if (nilai < 200) {
            return "Seratus " + terbilang(nilai - 100)
        } else if (nilai < 1000) {
            return terbilang(Math.floor(nilai / 100)) + " Ratus " + terbilang(nilai % 100)
        } else if (nilai < 2000) {
            return "Seribu " + terbilang(nilai - 1000)
        } else if (nilai < 1000000) {
            return terbilang(Math.floor(nilai / 1000)) + " Ribu " + terbilang(nilai % 1000)
        } else if (nilai < 1000000000) {
            return terbilang(Math.floor(nilai / 1000000)) + " Juta " + terbilang(nilai % 1000000)
        } else if (nilai < 1000000000000) {
            return terbilang(Math.floor(nilai / 1000000000)) + " Milyar " + terbilang(nilai % 1000000000)
        } else if (nilai < 1000000000000000) {
            return terbilang(Math.floor(nilai / 1000000000000)) + " Trilyun " + terbilang(nilai % 1000000000000)
        }
        return ""
    }

    /**
     * Get spelled out charge amount in Rupiah
     * @param nilai - Amount to spell out
     * @returns Spelled out charge string
     */
    const getSpelledOutCharge = (nilai: number | null | undefined): string => {
        if (!nilai) return "Nol Rupiah"
        const words = terbilang(Math.round(nilai)).trim().replace(/\s+/g, " ") + " Rupiah"
        return words.charAt(0).toUpperCase() + words.slice(1)
    }

    return {
        formatDate,
        formatDateTemplate,
        formatRelativeTime,
        formatNumber,
        formatCurrency,
        formatPhone,
        maskString,
        terbilang,
        getSpelledOutCharge
    }
}
