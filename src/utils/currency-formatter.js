/**
 * Currency Formatter Module
 * 
 * Handles currency display using browser's Intl API
 * Platform-agnostic version
 */

export class CurrencyFormatter {
    constructor(locale = null, baseCurrency = 'USD') {
        this.baseCurrency = baseCurrency;
        this.locale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
    }
    
    /**
     * Format amount in specific currency using Intl API
     * 
     * @param {number} amount - Amount to format
     * @param {string} currencyCode - ISO currency code (USD, EUR, GBP, etc.)
     * @param {string} locale - Optional locale override
     * @returns {string} Formatted currency string
     */
    format(amount, currencyCode = 'USD', locale = null) {
        const useLocale = locale || this.locale;
        
        try {
            const formatter = new Intl.NumberFormat(useLocale, {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            return formatter.format(amount);
        } catch (error) {
            // Fallback if currency not supported
            console.warn(`Currency ${currencyCode} not supported, using simple format`);
            return `${amount.toFixed(2)} ${currencyCode}`;
        }
    }
    
    /**
     * Parse currency symbol from formatted string
     * 
     * @param {string} formattedPrice - Formatted price string (e.g., "$49.99", "€49,99")
     * @returns {string} Currency symbol
     */
    extractSymbol(formattedPrice) {
        return formattedPrice.replace(/[\d,.\s]/g, '').trim() || '$';
    }
    
    /**
     * Parse numeric value from formatted string
     * 
     * @param {string} formattedPrice - Formatted price string
     * @returns {number} Numeric value
     */
    extractValue(formattedPrice) {
        const numericString = formattedPrice.replace(/[^\d.,]/g, '');
        // Handle different decimal separators
        const normalized = numericString.replace(',', '.');
        return parseFloat(normalized) || 0;
    }
    
    /**
     * Map common currency symbols to ISO codes
     * 
     * @param {string} symbol - Currency symbol
     * @returns {string} ISO currency code
     */
    symbolToCode(symbol) {
        const symbolMap = {
            '$': 'USD',
            '€': 'EUR',
            '£': 'GBP',
            '¥': 'JPY',
            '₹': 'INR',
            'CHF': 'CHF',
            'R$': 'BRL',
            '₽': 'RUB',
            'kr': 'SEK',
            'zł': 'PLN',
            '₩': 'KRW',
            '฿': 'THB',
            '₺': 'TRY',
            'A$': 'AUD',
            'C$': 'CAD',
            'HK$': 'HKD',
            'NZ$': 'NZD',
            'S$': 'SGD',
            'MX$': 'MXN',
            '﷼': 'SAR',
            'lei': 'RON',
            'Kč': 'CZK',
            'Ft': 'HUF',
            'RM': 'MYR',
            '₱': 'PHP',
            'NT$': 'TWD',
            'IDR': 'IDR',
            '₫': 'VND',
            'AED': 'AED',
        };
        
        return symbolMap[symbol] || 'USD';
    }
    
    /**
     * Format token amount with proper decimals
     * 
     * @param {bigint|number|string} amount - Amount in smallest unit
     * @param {number} decimals - Token decimals
     * @param {string} symbol - Token symbol
     * @returns {string} Formatted token amount
     */
    formatTokenAmount(amount, decimals, symbol) {
        const value = Number(amount) / Math.pow(10, decimals);
        return `${value.toFixed(decimals)} ${symbol}`;
    }
}

/**
 * Create a currency formatter instance
 * @param {string} locale - Browser locale
 * @param {string} baseCurrency - Base currency code
 * @returns {CurrencyFormatter}
 */
export function createFormatter(locale = null, baseCurrency = 'USD') {
    return new CurrencyFormatter(locale, baseCurrency);
}

