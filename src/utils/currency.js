/**
 * Currency Utilities for Pybara
 * 
 * Handles currency conversion and formatting across all platforms
 * Platform-agnostic, works with any e-commerce system or standalone
 */

/**
 * Token decimal places
 */
const TOKEN_DECIMALS = {
    'ICP': 8,
    'ckBTC': 8,
    'ckETH': 18,
    'ckUSDC': 6,
    'ckUSDT': 6
};

/**
 * Convert minimum amount from smallest units to USD
 * @param {number|bigint} minAmount - Minimum in smallest units (e.g., 1000000 for ckUSDC)
 * @param {string} token - Token symbol (ICP, ckBTC, etc.)
 * @param {number} tokenPrice - Current token price in USD
 * @returns {number} Minimum amount in USD
 */
export function convertMinimumToUSD(minAmount, token, tokenPrice) {
    if (!tokenPrice || tokenPrice <= 0) {
        console.warn(`Invalid token price for ${token}: ${tokenPrice}`);
        return 0;
    }
    
    const decimals = TOKEN_DECIMALS[token] || 8;
    const divisor = Math.pow(10, decimals);
    const tokenValue = Number(minAmount) / divisor;
    
    return tokenValue * tokenPrice;
}

/**
 * Convert USD amount to target currency
 * @param {number} usdAmount - Amount in USD
 * @param {string} targetCurrency - Target currency code (EUR, GBP, CNY, etc.)
 * @param {number} exchangeRate - Exchange rate from USD to target (e.g., 0.92 for EUR)
 * @returns {number} Amount in target currency
 */
export function convertUSDToCurrency(usdAmount, targetCurrency, exchangeRate = 1.0) {
    if (targetCurrency === 'USD') {
        return usdAmount;
    }
    
    if (!exchangeRate || exchangeRate <= 0) {
        console.warn(`Invalid exchange rate for ${targetCurrency}: ${exchangeRate}, using 1.0`);
        return usdAmount;
    }
    
    return usdAmount * exchangeRate;
}

/**
 * Format amount as currency using Intl.NumberFormat
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - ISO currency code (USD, EUR, GBP, CNY, etc.)
 * @param {string} locale - Locale for formatting (e.g., 'en-US', 'zh-CN')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'USD', locale = null) {
    // Auto-detect locale from browser if not provided
    const useLocale = locale || navigator.language || 'en-US';
    
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
        console.warn(`Currency ${currencyCode} not supported by Intl, using fallback`);
        
        // Simple fallback with common symbols
        const symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
            'CNY': '¥', 'INR': '₹', 'AUD': 'A$', 'CAD': 'C$'
        };
        
        const symbol = symbols[currencyCode] || currencyCode + ' ';
        return `${symbol}${amount.toFixed(2)}`;
    }
}

/**
 * Check if order total meets minimum requirement for a token
 * @param {number} orderTotal - Order total in display currency
 * @param {number|bigint} minAmount - Minimum in smallest units
 * @param {string} token - Token symbol
 * @param {number} tokenPrice - Current token price in USD
 * @param {string} orderCurrency - Order currency code (USD, EUR, etc.)
 * @param {number} exchangeRate - Exchange rate from USD to order currency
 * @returns {object} Result with meetsMinimum, minConverted, shortfall
 */
export function checkOrderMeetsMinimum(
    orderTotal, 
    minAmount, 
    token, 
    tokenPrice, 
    orderCurrency = 'USD',
    exchangeRate = 1.0
) {
    // Convert minimum to USD first
    const minUSD = convertMinimumToUSD(minAmount, token, tokenPrice);
    
    // Convert USD minimum to order currency
    const minConverted = convertUSDToCurrency(minUSD, orderCurrency, exchangeRate);
    
    // Check if order meets minimum
    const meetsMinimum = orderTotal >= minConverted;
    const shortfall = meetsMinimum ? 0 : minConverted - orderTotal;
    
    return {
        meetsMinimum,
        minAmount,       // Original in smallest units
        minUSD,          // Converted to USD
        minConverted,    // Converted to order currency
        shortfall        // Shortfall in order currency
    };
}

/**
 * Get token decimals
 * @param {string} token - Token symbol
 * @returns {number} Number of decimals
 */
export function getTokenDecimals(token) {
    return TOKEN_DECIMALS[token] || 8;
}

/**
 * Format token balance from smallest units to human-readable
 * @param {bigint|number|string} balance - Balance in smallest units
 * @param {string} token - Token symbol
 * @param {number} maxDecimals - Maximum decimal places to show (default: full precision)
 * @returns {string} Formatted balance
 */
export function formatTokenBalance(balance, token, maxDecimals = null) {
    const decimals = TOKEN_DECIMALS[token] || 8;
    const divisor = Math.pow(10, decimals);
    const value = Number(balance) / divisor;
    
    // Use maxDecimals if provided, otherwise show up to token's full decimals
    const displayDecimals = maxDecimals !== null ? maxDecimals : decimals;
    
    // Don't show unnecessary trailing zeros
    return value.toFixed(displayDecimals).replace(/\.?0+$/, '');
}

