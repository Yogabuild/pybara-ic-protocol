/**
 * Payment Calculator Utility
 * 
 * Platform-agnostic payment calculation logic
 * Used by all platform integrations (WooCommerce, Shopify, etc.)
 * 
 * @module utils/payment-calculator
 */

/**
 * Calculate payment details for an order
 * 
 * @class PaymentCalculator
 */
export class PaymentCalculator {
    
    /**
     * Calculate payment details for a single token
     * 
     * @param {number} usdAmount - Order total in USD
     * @param {string} token - Token symbol (ICP, ckBTC, ckETH, etc.)
     * @param {number} price - Current price of token in USD
     * @param {number} decimals - Token decimals (8 for ICP/ckBTC, 18 for ckETH, etc.)
     * @param {BigInt} minimum - Minimum order amount in smallest units
     * @param {BigInt} userBalance - User's current balance (optional, defaults to 0)
     * @returns {Object} Payment calculation details
     */
    static calculatePayment(usdAmount, token, price, decimals, minimum, userBalance = 0n) {
        // Validate inputs
        if (!usdAmount || usdAmount <= 0) {
            throw new Error('USD amount must be greater than 0');
        }
        
        if (!price || price <= 0) {
            throw new Error(`Invalid price for ${token}: ${price}`);
        }
        
        // Calculate required amount in token units
        const requiredAmount = usdAmount / price;
        const requiredSmallestUnit = BigInt(Math.ceil(requiredAmount * Math.pow(10, decimals)));
        
        // Add 10% buffer to account for:
        // - Platform fee (1%)
        // - Transfer fees (user + merchant + platform)
        // - Price fluctuations during payment
        const requiredWithBuffer = requiredSmallestUnit + (requiredSmallestUnit / 10n);
        
        // Check constraints
        const isBelowMinimum = requiredSmallestUnit < minimum;
        const hasSufficientBalance = userBalance >= requiredWithBuffer;
        
        // Calculate human-readable amounts
        const requiredInToken = Number(requiredSmallestUnit) / Math.pow(10, decimals);
        const requiredWithBufferInToken = Number(requiredWithBuffer) / Math.pow(10, decimals);
        const minimumInToken = Number(minimum) / Math.pow(10, decimals);
        const balanceInToken = Number(userBalance) / Math.pow(10, decimals);
        const balanceInUSD = balanceInToken * price;
        const minimumInUSD = minimumInToken * price;
        
        return {
            // Token info
            token,
            price,
            decimals,
            
            // Required amounts
            requiredAmount: requiredSmallestUnit,          // BigInt (smallest units)
            requiredWithBuffer: requiredWithBuffer,        // BigInt (with 10% buffer)
            requiredInToken: requiredInToken,              // Number (human-readable)
            requiredWithBufferInToken: requiredWithBufferInToken, // Number (with buffer)
            
            // Minimum constraints
            minimum: minimum,                              // BigInt (smallest units)
            minimumInToken: minimumInToken,                // Number (human-readable)
            minimumInUSD: minimumInUSD,                    // Number (USD)
            isBelowMinimum: isBelowMinimum,               // Boolean
            
            // Balance info
            userBalance: userBalance,                      // BigInt (smallest units)
            balanceInToken: balanceInToken,                // Number (human-readable)
            balanceInUSD: balanceInUSD,                    // Number (USD)
            hasSufficientBalance: hasSufficientBalance,    // Boolean
            
            // Payment status
            isPayable: !isBelowMinimum && hasSufficientBalance
        };
    }
    
    /**
     * Calculate payment details for all supported tokens
     * 
     * @param {number} usdAmount - Order total in USD
     * @param {Object} priceData - Price data from getTokenPrices() {token: price}
     * @param {Object} tokenConfig - Config from getTokenConfig() {decimals, minimums, supported_tokens}
     * @param {Object} balances - User balances {token: BigInt}
     * @returns {Array} Array of payment calculations for each token
     */
    static calculateAllTokens(usdAmount, priceData, tokenConfig, balances = {}) {
        const supportedTokens = tokenConfig.supported_tokens || ['ICP', 'ckBTC', 'ckETH', 'ckUSDC', 'ckUSDT'];
        
        return supportedTokens.map(token => {
            try {
                const price = priceData[token];
                const decimals = tokenConfig.decimals[token];
                const minimum = BigInt(tokenConfig.minimums[token] || 0);
                const balance = balances[token] || 0n;
                
                return this.calculatePayment(
                    usdAmount,
                    token,
                    price,
                    decimals,
                    minimum,
                    balance
                );
            } catch (error) {
                console.error(`Failed to calculate payment for ${token}:`, error);
                // Return error state
                return {
                    token,
                    error: error.message,
                    isPayable: false,
                    isBelowMinimum: true,
                    hasSufficientBalance: false
                };
            }
        });
    }
    
    /**
     * Find the best token for payment
     * Prioritizes tokens user has sufficient balance for, cheapest fees, etc.
     * 
     * @param {Array} calculations - Array from calculateAllTokens()
     * @returns {Object|null} Best token calculation or null if none available
     */
    static findBestToken(calculations) {
        // Filter payable tokens
        const payable = calculations.filter(calc => calc.isPayable);
        
        if (payable.length === 0) {
            return null;
        }
        
        // Sort by:
        // 1. Has sufficient balance
        // 2. Not below minimum
        // 3. Highest balance in USD (user probably prefers to use what they have)
        return payable.sort((a, b) => {
            // Both payable, prefer highest balance
            return b.balanceInUSD - a.balanceInUSD;
        })[0];
    }
    
    /**
     * Format token amount for display
     * 
     * @param {BigInt} amount - Amount in smallest units
     * @param {number} decimals - Token decimals
     * @param {number} maxDecimals - Maximum decimals to show (default: token decimals)
     * @returns {string} Formatted amount
     */
    static formatTokenAmount(amount, decimals, maxDecimals = null) {
        const amountInToken = Number(amount) / Math.pow(10, decimals);
        const displayDecimals = maxDecimals !== null ? Math.min(maxDecimals, decimals) : decimals;
        return amountInToken.toFixed(displayDecimals);
    }
    
    /**
     * Format USD amount for display
     * 
     * @param {number} amount - Amount in USD
     * @returns {string} Formatted USD amount
     */
    static formatUSD(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
}

export default PaymentCalculator;
