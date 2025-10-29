/**
 * Pybara IC Protocol - Core Configuration
 * Platform-agnostic configuration for IC protocol integration.
 * Last updated: October 18, 2025
 */

// 🏗️ INTERNET COMPUTER ========================================================

// Pybara backend canister ID (mainnet)
export const BACKEND_CANISTER_ID = 'zvgwv-zyaaa-aaaac-qchaq-cai';

// IC network hosts
export const IC_HOSTS = {
  mainnet: 'https://icp-api.io',
  local: 'http://localhost:4943'
};

// 🔗 LEDGER CANISTER IDS =======================================================

// Mainnet ledger canister IDs for each supported token
// Used to generate transaction verification URLs
// ⚠️ DO NOT CHANGE unless ledger canisters are migrated
export const LEDGER_CANISTERS = {
  'ICP': 'ryjl3-tyaaa-aaaaa-aaaba-cai',
  'ckBTC': 'mxzaz-hqaaa-aaaar-qaada-cai',
  'ckETH': 'ss2fx-dyaaa-aaaar-qacoq-cai',
  'ckUSDC': 'xevnm-gaaaa-aaaar-qafnq-cai',
  'ckUSDT': 'cngnf-vqaaa-aaaar-qag4q-cai'
};

// ⏱️ TRANSACTION INDEXING ======================================================

// Expected blockchain indexing delay for ICRC-1 transactions (in milliseconds)
// NOTE: On-chain verification is currently a placeholder (not implemented for ICRC-1)
// Reduced to 1 second to improve UX while verification is being built
export const ICRC1_INDEXING_DELAY = 1000;  // 1 second

// 🔐 SECURITY & PERFORMANCE ====================================================

// Maximum time to wait for wallet approval (in ms). Prevents infinite waiting if user closes wallet popup.
export const WALLET_APPROVAL_TIMEOUT = 300000;  // 5 minutes

// Maximum time to wait for backend confirmation (in ms). Prevents hanging if backend is slow/unresponsive.
export const BACKEND_CONFIRMATION_TIMEOUT = 60000;  // 1 minute

// Retry attempts for failed network requests
export const MAX_RETRY_ATTEMPTS = 3;

// Delay between retry attempts (in milliseconds)
export const RETRY_DELAY = 2000;  // 2 seconds

// 💰 PAYMENT CALCULATION =======================================================

// Payment buffer percentage (for price fluctuation protection)
// Applied to balance checks and payment calculations to handle price volatility
// Example: 10 = 10% buffer
// 
// Why needed?
// - User sees "Send 0.5 ckBTC" at current price
// - User connects wallet and approves (takes 10-30 seconds)
// - Price moves 2%: now needs 0.51 ckBTC
// - Without buffer: Payment fails with "insufficient balance"
// - With 10% buffer: User pre-checked to have 0.55 ckBTC available
// 
// Recommendation:
// - Volatile assets (ckBTC, ckETH): 10% (default)
// - Stablecoins only (ckUSDC, ckUSDT): 2-5%
// - High-frequency trading: 15-20%
export const PAYMENT_BUFFER_PERCENT = 10;

// 📊 SUPPORTED TOKENS & WALLETS ================================================

// Supported tokens
export const SUPPORTED_TOKENS = ['ICP', 'ckBTC', 'ckETH', 'ckUSDC', 'ckUSDT'];

// Supported wallets (available for registration)
export const SUPPORTED_WALLETS = ['oisy', 'plug', 'stoic', 'nfid', 'bitfinity'];

// Default enabled wallets (platforms can override)
// NFID disabled: Vanilla SDK has poor UX and broken II login (as of Oct 2025)
export const DEFAULT_ENABLED_WALLETS = ['oisy', 'plug'];

// 💵 TOKEN DECIMALS ============================================================

// Token decimals (for formatting)
export const TOKEN_DECIMALS = {
  'ICP': 8,
  'ckBTC': 8,
  'ckETH': 18,
  'ckUSDC': 6,
  'ckUSDT': 6
};

// 🎯 DEFAULT CONFIGURATION =====================================================

// Default configuration object. Platforms can extend/override these values.
export const DEFAULT_CONFIG = {
  canisterId: BACKEND_CANISTER_ID,
  host: IC_HOSTS.mainnet,
  isMainnet: true,
  tokens: SUPPORTED_TOKENS,
  wallets: SUPPORTED_WALLETS,
  enabledWallets: DEFAULT_ENABLED_WALLETS,  // Platform-agnostic wallet activation
  icrc1IndexingDelay: ICRC1_INDEXING_DELAY,
  walletApprovalTimeout: WALLET_APPROVAL_TIMEOUT,
  backendConfirmationTimeout: BACKEND_CONFIRMATION_TIMEOUT,
  maxRetryAttempts: MAX_RETRY_ATTEMPTS,
  retryDelay: RETRY_DELAY,
  paymentBufferPercent: PAYMENT_BUFFER_PERCENT,
  debug: false
};

// 🧩 CONFIGURATION BUILDER =====================================================

// Merge user config with defaults
export function createConfig(userConfig = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig
  };
}

