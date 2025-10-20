/**
 * Pybara Payment Agent
 * 
 * Core IC protocol integration for Pybara payment gateway.
 * Handles all communication with the Pybara backend canister.
 * 
 * Platform-agnostic - works with any e-commerce system.
 */

import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { WalletManager } from '../wallets/WalletManager.js';
import { OisyWalletAdapter } from '../wallets/oisy/OisyWalletAdapter.js';
import { PlugWalletAdapter } from '../wallets/plug/PlugWalletAdapter.js';
import { NFIDWalletAdapter } from '../wallets/nfid/NFIDWalletAdapter.js';
import { getLedgerCanisterId, LEDGER_IDS } from '../utils/ledger-config.js';
import { checkBalance, checkSufficientBalance, checkMultipleBalances, formatBalance } from '../payment/balance-checker.js';
import { idlFactory } from './canister-idl.js';
import { createConfig } from './config.js';
import * as CurrencyUtils from '../utils/currency.js';

export class PybaraAgent {
  constructor(config = {}) {
    // Merge with defaults
    const fullConfig = createConfig(config);
    
    this.canisterId = fullConfig.canisterId;
    this.isMainnet = fullConfig.isMainnet;
    this.host = fullConfig.host;
    this.agent = null;
    this.actor = null;
    this.debug = fullConfig.debug;
    this.walletIcons = fullConfig.walletIcons || {}; // Custom wallet icon URLs
    
    // Initialize wallet system
    this.walletManager = new WalletManager();
    
    // Register wallet adapters
    this.walletManager.registerWallet(new OisyWalletAdapter(this.isMainnet));
    this.walletManager.registerWallet(new PlugWalletAdapter(this.isMainnet));
    this.walletManager.registerWallet(new NFIDWalletAdapter());
    
    // Apply custom icons if provided
    if (Object.keys(this.walletIcons).length > 0) {
      this.walletManager.setWalletIcons(this.walletIcons);
    }
    
    if (this.debug) {
      console.log('🦫 Pybara Payment Agent initialized');
      console.log('   Canister:', this.canisterId);
      console.log('   Network:', this.isMainnet ? 'mainnet' : 'local');
      console.log('   Supported wallets:', this.walletManager.getAllWallets().map(w => w.name).join(', '));
    }
  }

  /**
   * Initialize the agent (create IC agent and actor)
   */
  async init() {
    this.agent = await HttpAgent.create({ host: this.host });
    
    if (!this.isMainnet) {
      await this.agent.fetchRootKey();
    }

    this.actor = Actor.createActor(idlFactory, {
      agent: this.agent,
      canisterId: this.canisterId,
    });
    
    if (this.debug) {
      console.log('✅ Agent initialized');
    }
  }

  /**
   * Get available wallets (installed/accessible)
   */
  getAvailableWallets() {
    return this.walletManager.getWalletsInfo().filter(w => w.available);
  }

  /**
   * Get all wallets (for UI display)
   */
  getAllWallets() {
    return this.walletManager.getWalletsInfo();
  }

  /**
   * Get currently connected wallet type
   */
  getConnectedWalletType() {
    return this.walletManager.getActiveWalletType();
  }

  /**
   * Connect to a specific wallet
   * @param {string} walletType - 'oisy', 'plug', 'nfid'
   * @returns {Promise<string>} Principal ID
   */
  async connectWallet(walletType = 'oisy') {
    try {
      const principal = await this.walletManager.connect(walletType);
      
      // Create agent/actor if not already created
      if (!this.agent) {
        await this.init();
      }
      
      if (this.debug) {
        console.log(`✅ Connected: ${walletType.charAt(0).toUpperCase() + walletType.slice(1)} (${principal})`);
      }
      
      return principal;
      
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from current wallet
   */
  async disconnectWallet() {
    await this.walletManager.disconnect();
    if (this.debug) {
      console.log('👋 Wallet disconnected');
    }
  }

  /**
   * Check if user has a wallet connected
   */
  isWalletConnected() {
    return this.walletManager.isConnected();
  }

  /**
   * Get current user's principal
   */
  getPrincipal() {
    return this.walletManager.getPrincipal();
  }

  /**
   * Execute payment via connected wallet
   * This is the main payment execution method
   */
  async executePayment(amountE8s, recipientPrincipal, token) {
    if (!this.isWalletConnected()) {
      throw new Error('No wallet connected. Please connect a wallet first.');
    }

    const principal = this.getPrincipal();
    const ledgerCanisterId = getLedgerCanisterId(token);
    
    if (this.debug) {
      console.log(`💳 Sending ${formatBalance(amountE8s, token)} to ${recipientPrincipal}...`);
    }
    
    // Check balance
    const balanceCheck = await checkSufficientBalance(
      principal,
      ledgerCanisterId,
      amountE8s,
      token,
      this.isMainnet
    );
    
    if (!balanceCheck.sufficient && !balanceCheck.error) {
      throw new Error(`Insufficient ${token} balance`);
    }
    
    // Execute transfer
    const blockIndex = await this.walletManager.transfer({
      to: recipientPrincipal,
      amount: amountE8s,
      ledgerCanisterId: ledgerCanisterId,
      token: token
    });
    
    if (this.debug) {
      console.log(`✅ Transfer complete (Block: ${blockIndex})`);
    }
    
    return { blockIndex };
  }

  /**
   * Initialize payment on canister (fetch price & calculate amount)
   * 
   * @param {Object} params - Payment parameters
   * @param {number} params.orderId - Order ID
   * @param {string} params.siteUrl - Site URL
   * @param {string} params.siteName - Site name (e.g., "My Store")
   * @param {string} params.platform - Platform identifier (e.g., "WooCommerce", "Shopify")
   * @param {number} params.usdAmount - Amount in USD
   * @param {string} params.token - Token symbol (ICP, ckBTC, etc)
   * @param {string|Principal} params.merchantPrincipal - Merchant's principal
   * @param {string|Principal} [params.userPrincipal] - User's principal (optional)
   * @param {string} [params.wallet] - Wallet name (optional, e.g., "Oisy", "Plug")
   */
  async initPayment(params) {
    if (!this.actor) {
      await this.init();
    }

    try {
      const {
        orderId,
        siteUrl,
        siteName,
        platform,
        usdAmount,
        token,
        merchantPrincipal,
        userPrincipal,
        wallet
      } = params;

      // Convert principals to Principal objects if they're strings
      const merchantPrincipalObj = typeof merchantPrincipal === 'string' 
        ? Principal.fromText(merchantPrincipal) 
        : merchantPrincipal;
      
      const senderPrincipal = userPrincipal 
        ? (typeof userPrincipal === 'string' ? Principal.fromText(userPrincipal) : userPrincipal)
        : null;
      
      const result = await this.actor.init_payment(
        BigInt(orderId),
        siteUrl,
        siteName,
        platform,
        parseFloat(usdAmount),
        token,
        merchantPrincipalObj,
        senderPrincipal ? [senderPrincipal] : [],  // Optional array format for Candid
        wallet ? [wallet] : []  // Optional array format for Candid
      );

      // Handle both old format (status/expected_amount) and new format (ok/err)
      if (result.ok) {
        // New format: Result<PaymentInit, Text>
        const payment = result.ok;
        if (this.debug) {
          console.log('✅ Payment initialized');
          console.log('   Expected amount:', payment.expected_amount.toString());
          console.log('   Price used:', payment.price_usd);
        }
        
        return {
          payment_id: Number(payment.payment_id),
          expected_amount: payment.expected_amount.toString(),
          price_usd: payment.price_usd,
          merchant_principal: payment.merchant_principal
        };
      } else if (result.status === 'success' && result.expected_amount && result.expected_amount.length > 0) {
        // Format: {status, expected_amount, error, payment_url, price_used, payment_id?}
        const hasPaymentId = result.payment_id && result.payment_id.length > 0;
        if (this.debug) {
          console.log(`✅ Payment initialized${hasPaymentId ? ' (v2)' : ' (v1)'}`);
          console.log('   Expected amount:', result.expected_amount[0].toString());
          console.log('   Price used:', result.price_used[0]);
          if (hasPaymentId) {
            console.log('   Payment ID:', result.payment_id[0].toString());
          }
        }
        
        return {
          payment_id: hasPaymentId ? Number(result.payment_id[0]) : Number(orderId),
          expected_amount: result.expected_amount[0].toString(),
          price_usd: result.price_used[0],
          merchant_principal: merchantPrincipalObj.toText()
        };
      } else {
        console.error('❌ Canister returned error:', result.err || result.error);
        console.error('   Full result:', result);
        throw new Error(result.err || (result.error && result.error[0]) || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('❌ Init payment failed:', error);
      throw error;
    }
  }

  /**
   * Record payment on canister (after successful transfer)
   * @param {number} paymentId - Optional payment ID for direct lookup (preferred)
   * @param {number} orderId - Order ID (fallback if paymentId not provided)
   * @param {string} siteUrl - Site URL (fallback if paymentId not provided)
   * @param {string|Principal} merchantPrincipal - Merchant principal (fallback if paymentId not provided)
   * @param {number} txId - Transaction ID (block index)
   * @param {bigint} receivedAmount - Amount received in smallest units
   */
  async recordPayment(paymentId, orderId, siteUrl, merchantPrincipal, txId, receivedAmount) {
    if (!this.actor) {
      await this.init();
    }

    try {
      console.log('🔍 [PybaraAgent] recordPayment called with:', {
        paymentId,
        orderId,
        siteUrl,
        merchantPrincipal,
        txId,
        receivedAmount,
        types: {
          paymentId: typeof paymentId,
          orderId: typeof orderId,
          siteUrl: typeof siteUrl,
          merchantPrincipal: typeof merchantPrincipal,
          txId: typeof txId,
          receivedAmount: typeof receivedAmount
        }
      });
      
      console.log('🔍 Converting merchantPrincipal to Principal object...');
      const merchantPrincipalObj = typeof merchantPrincipal === 'string' 
        ? Principal.fromText(merchantPrincipal) 
        : merchantPrincipal;
      console.log('✅ Merchant principal converted:', merchantPrincipalObj.toText());

      const result = await this.actor.record_payment(
        paymentId ? [BigInt(paymentId)] : [],  // Optional payment_id
        BigInt(orderId),
        siteUrl,
        merchantPrincipalObj,
        BigInt(txId),
        BigInt(receivedAmount)
      );

      if (result.ok) {
        return {
          tx_id: Number(result.ok.tx_id),
          verified: result.ok.verified,
          payment_id: result.ok.payment_id ? Number(result.ok.payment_id) : undefined
        };
      } else {
        throw new Error(result.err || 'Failed to record payment');
      }
    } catch (error) {
      console.error('❌ Record payment failed:', error);
      throw error;
    }
  }

  /**
   * Confirm payment and execute dual transfer (99% merchant + 1% platform)
   * Called after user sends tokens to canister
   */
  async confirmPayment(paymentId, orderId, siteUrl, merchantPrincipalText) {
    if (!this.actor) {
      await this.init();
    }

    try {
      const merchantPrincipal = Principal.fromText(merchantPrincipalText);

      // v2 backend: confirm_payment(payment_id?, order_id?, site_url?, merchant?)
      // Prefer payment_id if available (more reliable), fallback to composite key
      const result = await this.actor.confirm_payment(
        paymentId ? [BigInt(paymentId)] : [],
        orderId ? [BigInt(orderId)] : [],
        siteUrl ? [siteUrl] : [],
        merchantPrincipal ? [merchantPrincipal] : []
      );

      if (result.ok) {
        if (this.debug) {
          console.log(`✅ Payment complete (Merchant: ${result.ok.merchant_tx}, Platform: ${result.ok.platform_tx})`);
        }
        return {
          merchant_tx_id: Number(result.ok.merchant_tx),
          platform_tx_id: Number(result.ok.platform_tx)
        };
      } else {
        throw new Error(result.err || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('❌ Confirm payment failed:', error);
      throw error;
    }
  }

  /**
   * Get payment status from canister
   */
  async getPayment(paymentId) {
    if (!this.actor) {
      await this.init();
    }

    try {
      const result = await this.actor.get_payment(BigInt(paymentId));
      return result.length > 0 ? result[0] : null;  // Candid Opt returns array
    } catch (error) {
      console.error('❌ Get payment failed:', error);
      throw error;
    }
  }

  /**
   * Get payment by order details
   */
  async getPaymentByOrder(orderId, siteUrl, merchantPrincipal) {
    if (!this.actor) {
      await this.init();
    }

    try {
      const merchant = Principal.fromText(merchantPrincipal);
      const result = await this.actor.get_payment_by_order(
        BigInt(orderId),
        siteUrl,
        merchant
      );
      return result.length > 0 ? result[0] : null;  // Candid Opt returns array
    } catch (error) {
      console.error('❌ Get payment by order failed:', error);
      throw error;
    }
  }

  /**
   * Get token prices from canister
   */
  async getTokenPrices() {
    if (!this.actor) {
      await this.init();
    }

    try {
      const prices = await this.actor.get_token_prices();
      // Backend returns [(Text, Float)] which becomes [[token, price], ...] in JS
      return prices.map(([token, price]) => ({
        token,
        price
      }));
    } catch (error) {
      console.error('❌ Get token prices failed:', error);
      throw error;
    }
  }

  /**
   * Get token configuration (decimals, minimums, etc.)
   */
  async getTokenConfig() {
    if (!this.actor) {
      await this.init();
    }

    try {
      const config = await this.actor.get_token_config();
      
      // Convert arrays to more convenient format
      const decimalsMap = {};
      const minimumsMap = {};
      
      config.decimals.forEach(([token, decimals]) => {
        decimalsMap[token] = Number(decimals);
      });
      
      config.minimums.forEach(([token, minimum]) => {
        minimumsMap[token] = minimum.toString();
      });
      
      return {
        supported_tokens: config.supported_tokens,
        decimals: decimalsMap,
        minimums: minimumsMap
      };
    } catch (error) {
      console.error('❌ Get token config failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to wallet events
   */
  onWalletEvent(event, callback) {
    this.walletManager.on(event, callback);
  }

  /**
   * Check user's balance for all enabled tokens (parallel)
   * Returns balances in smallest units with formatted display
   * 
   * @param {string[]} enabledTokens - Array of token symbols to check (e.g., ['ICP', 'ckBTC'])
   * @returns {Promise<Object>} - Map of token -> {balance: bigint, formatted: string}
   */
  async checkAllBalances(enabledTokens = null) {
    const principal = this.walletManager.getPrincipal();
    if (!principal) {
      throw new Error('No wallet connected');
    }

    // Use all tokens if not specified
    const tokensToCheck = enabledTokens || Object.keys(LEDGER_IDS);
    
    // Build ledger IDs map for tokens to check
    const ledgerIdsToCheck = {};
    tokensToCheck.forEach(token => {
      ledgerIdsToCheck[token] = LEDGER_IDS[token];
    });
    
    try {
      const balances = await checkMultipleBalances(
        principal,
        ledgerIdsToCheck,
        this.isMainnet
      );

      // Convert to convenient format
      const result = {};
      balances.forEach(({ token, balance }) => {
        result[token] = {
          balance: balance,
          formatted: formatBalance(balance, token)
        };
      });

      return result;
    } catch (error) {
      console.error('Balance check failed:', error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient balance for a specific token amount
   * 
   * @param {string} token - Token symbol
   * @param {bigint|string|number} requiredAmount - Amount needed in smallest units
   * @returns {Promise<{sufficient: boolean, balance: bigint, shortfall?: bigint}>}
   */
  async checkTokenBalance(token, requiredAmount) {
    const principal = this.walletManager.getPrincipal();
    if (!principal) {
      throw new Error('No wallet connected');
    }

    const ledgerId = getLedgerCanisterId(token);
    
    return await checkSufficientBalance(
      principal,
      ledgerId,
      requiredAmount,
      token,
      this.isMainnet
    );
  }

  // =============================================================================
  // 🆕 HELPER METHODS (for ic-checkout and other UIs)
  // =============================================================================

  /**
   * Get list of available tokens
   * 
   * @returns {Promise<string[]>} Array of supported token symbols (e.g., ['ICP', 'ckBTC', 'ckETH'])
   */
  async getAvailableTokens() {
    if (!this.actor) {
      await this.init();
    }

    try {
      const config = await this.getTokenConfig();
      return config.supported_tokens;
    } catch (error) {
      console.error('❌ Get available tokens failed:', error);
      // Fallback to config if canister call fails
      return Object.keys(LEDGER_IDS);
    }
  }

  /**
   * Get user's balance for a specific token
   * Returns balance in both raw (smallest units) and formatted display
   * 
   * @param {string} token - Token symbol (e.g., 'ckBTC')
   * @returns {Promise<{raw: bigint, formatted: string}>}
   */
  async getBalance(token) {
    const principal = this.walletManager.getPrincipal();
    if (!principal) {
      throw new Error('No wallet connected');
    }

    const ledgerId = getLedgerCanisterId(token);
    
    try {
      const balance = await checkBalance(principal, ledgerId, this.isMainnet);
      
      return {
        raw: balance,
        formatted: formatBalance(balance, token)
      };
    } catch (error) {
      console.error(`❌ Get balance for ${token} failed:`, error);
      throw error;
    }
  }

  /**
   * Get current price for a specific token
   * 
   * @param {string} token - Token symbol (e.g., 'ckBTC')
   * @param {string} [currency='USD'] - Currency (currently only 'USD' supported)
   * @returns {Promise<number>} Price in USD
   */
  async getTokenPrice(token, currency = 'USD') {
    if (currency !== 'USD') {
      throw new Error('Only USD currency is currently supported');
    }

    if (!this.actor) {
      await this.init();
    }

    try {
      const prices = await this.getTokenPrices();
      const tokenPrice = prices.find(p => p.token === token);
      
      if (!tokenPrice) {
        throw new Error(`Price not available for token: ${token}`);
      }
      
      return tokenPrice.price;
    } catch (error) {
      console.error(`❌ Get price for ${token} failed:`, error);
      throw error;
    }
  }

  /**
   * Get minimum order amount for a specific token
   * Returns minimum in both USD and token amount
   * 
   * @param {string} token - Token symbol (e.g., 'ckBTC')
   * @param {string} [currency='USD'] - Currency (currently only 'USD' supported)
   * @returns {Promise<{usd: number, token: string}>}
   */
  async getMinimumAmount(token, currency = 'USD') {
    if (currency !== 'USD') {
      throw new Error('Only USD currency is currently supported');
    }

    if (!this.actor) {
      await this.init();
    }

    try {
      const config = await this.getTokenConfig();
      const minimumE8s = config.minimums[token];
      
      if (!minimumE8s) {
        throw new Error(`Minimum not configured for token: ${token}`);
      }
      
      // Get token price to convert to USD
      const price = await this.getTokenPrice(token, currency);
      
      // Convert minimum from smallest units to standard units
      const decimals = config.decimals[token] || 8;
      const minimumTokens = Number(minimumE8s) / Math.pow(10, decimals);
      
      // Calculate USD equivalent
      const minimumUsd = minimumTokens * price;
      
      return {
        usd: minimumUsd,
        token: formatBalance(BigInt(minimumE8s), token)
      };
    } catch (error) {
      console.error(`❌ Get minimum amount for ${token} failed:`, error);
      throw error;
    }
  }

  // ================================================================================
  // Currency & Conversion Helpers (v1.2.0+)
  // ================================================================================

  /**
   * Convert minimum amount from smallest units to USD
   * @param {number|bigint} minAmount - Minimum in smallest units
   * @param {string} token - Token symbol (ICP, ckBTC, etc.)
   * @param {number} tokenPrice - Current token price in USD (optional, will fetch if not provided)
   * @returns {Promise<number>} Minimum amount in USD
   */
  async convertMinimumToUSD(minAmount, token, tokenPrice = null) {
    const price = tokenPrice || await this.getTokenPrice(token);
    return CurrencyUtils.convertMinimumToUSD(minAmount, token, price);
  }

  /**
   * Convert USD amount to target currency
   * @param {number} usdAmount - Amount in USD
   * @param {string} targetCurrency - Target currency code (EUR, GBP, CNY, etc.)
   * @param {number} exchangeRate - Exchange rate from USD to target
   * @returns {number} Amount in target currency
   */
  convertUSDToCurrency(usdAmount, targetCurrency, exchangeRate = 1.0) {
    return CurrencyUtils.convertUSDToCurrency(usdAmount, targetCurrency, exchangeRate);
  }

  /**
   * Format amount as currency using Intl.NumberFormat
   * @param {number} amount - Amount to format
   * @param {string} currencyCode - ISO currency code (USD, EUR, GBP, CNY, etc.)
   * @param {string} locale - Locale for formatting (auto-detected if not provided)
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currencyCode = 'USD', locale = null) {
    return CurrencyUtils.formatCurrency(amount, currencyCode, locale);
  }

  /**
   * Check if order total meets minimum requirement for a token
   * @param {number} orderTotal - Order total in display currency
   * @param {number|bigint} minAmount - Minimum in smallest units
   * @param {string} token - Token symbol
   * @param {number} tokenPrice - Current token price in USD (optional, will fetch if not provided)
   * @param {string} orderCurrency - Order currency code (USD, EUR, etc.)
   * @param {number} exchangeRate - Exchange rate from USD to order currency
   * @returns {Promise<object>} Result with meetsMinimum, minConverted, shortfall
   */
  async checkOrderMeetsMinimum(
    orderTotal,
    minAmount,
    token,
    tokenPrice = null,
    orderCurrency = 'USD',
    exchangeRate = 1.0
  ) {
    const price = tokenPrice || await this.getTokenPrice(token);
    return CurrencyUtils.checkOrderMeetsMinimum(
      orderTotal,
      minAmount,
      token,
      price,
      orderCurrency,
      exchangeRate
    );
  }

  /**
   * Format token balance from smallest units to human-readable
   * @param {bigint|number|string} balance - Balance in smallest units
   * @param {string} token - Token symbol
   * @param {number} maxDecimals - Maximum decimal places to show
   * @returns {string} Formatted balance
   */
  formatTokenBalance(balance, token, maxDecimals = null) {
    return CurrencyUtils.formatTokenBalance(balance, token, maxDecimals);
  }

  /**
   * Get token decimal places
   * @param {string} token - Token symbol
   * @returns {number} Number of decimals
   */
  getTokenDecimals(token) {
    return CurrencyUtils.getTokenDecimals(token);
  }
}

