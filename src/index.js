/**
 * @pybara/ic-protocol
 * 
 * Shared Internet Computer protocol integration for Pybara payment gateway
 * Platform-agnostic JavaScript library for integrating crypto payments
 */

// Core exports
export { PybaraAgent } from './core/PybaraAgent.js';
export { idlFactory } from './core/canister-idl.js';
export {
    BACKEND_CANISTER_ID,
    IC_HOSTS,
    LEDGER_CANISTERS,
    ICRC1_INDEXING_DELAY,
    WALLET_APPROVAL_TIMEOUT,
    BACKEND_CONFIRMATION_TIMEOUT,
    MAX_RETRY_ATTEMPTS,
    RETRY_DELAY,
    SUPPORTED_TOKENS,
    SUPPORTED_WALLETS,
    TOKEN_DECIMALS,
    DEFAULT_CONFIG,
    createConfig
} from './core/config.js';

// Wallet exports
export { WalletManager } from './wallets/_WalletManager.js';
export { WalletAdapter } from './wallets/BaseWalletAdapter.js';
export { OisyWalletAdapter } from './wallets/OisyWalletAdapter.js';
export { PlugWalletAdapter } from './wallets/PlugWalletAdapter.js';
export { NFIDWalletAdapter } from './wallets/NFIDWalletAdapter.js';

// Payment utilities
export {
    checkBalance,
    formatBalance,
    checkSufficientBalance,
    generateInsufficientFundsMessage,
    checkMultipleBalances
} from './utils/balance-checker.js';
export { PriceCache, startPriceCache } from './utils/price-cache.js';

// Utilities
export {
    LEDGER_IDS,
    getLedgerCanisterId,
    getSupportedTokens,
    isTokenSupported
} from './utils/ledger-config.js';
export { createLedgerActor } from './utils/ledger-actor.js';
export { CurrencyFormatter, createFormatter } from './utils/currency-formatter.js';

// Currency utilities (v1.2.0+)
export {
    convertMinimumToUSD,
    convertUSDToCurrency,
    checkOrderMeetsMinimum,
    formatTokenBalance,
    getTokenDecimals
} from './utils/currency-logic.js';

/**
 * Default export - Main PybaraAgent class
 */
export { PybaraAgent as default } from './core/PybaraAgent.js';

