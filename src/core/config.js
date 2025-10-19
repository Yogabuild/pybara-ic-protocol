/**
 * =============================================================================
 * Pybara IC Protocol - Core Configuration
 * =============================================================================
 * 
 * Platform-agnostic configuration for IC protocol integration.
 * Platforms can override these defaults as needed.
 * 
 * Last updated: October 18, 2025
 */

// =============================================================================
// 🏗️ INTERNET COMPUTER
// =============================================================================

/**
 * Pybara backend canister ID (mainnet)
 */
export const BACKEND_CANISTER_ID = 'zvgwv-zyaaa-aaaac-qchaq-cai';

/**
 * IC network hosts
 */
export const IC_HOSTS = {
  mainnet: 'https://icp-api.io',
  local: 'http://localhost:4943'
};

// =============================================================================
// 🔗 LEDGER CANISTER IDS
// =============================================================================

/**
 * Mainnet ledger canister IDs for each supported token.
 * Used to generate transaction verification URLs.
 * 
 * ⚠️ DO NOT CHANGE unless ledger canisters are migrated.
 */
export const LEDGER_CANISTERS = {
  'ICP': 'ryjl3-tyaaa-aaaaa-aaaba-cai',
  'ckBTC': 'mxzaz-hqaaa-aaaar-qaada-cai',
  'ckETH': 'ss2fx-dyaaa-aaaar-qacoq-cai',
  'ckUSDC': 'xevnm-gaaaa-aaaar-qafnq-cai',
  'ckUSDT': 'cngnf-vqaaa-aaaar-qag4q-cai'
};

// =============================================================================
// ⏱️ TRANSACTION INDEXING
// =============================================================================

/**
 * Expected blockchain indexing delay for ICRC-1 transactions (in milliseconds).
 * 
 * Why 8 seconds?
 * - ICRC-1 transactions typically take 5-10 seconds to be indexed
 * - 8 seconds is a conservative middle ground
 * - Better to show link slightly late than show "not found" error
 */
export const ICRC1_INDEXING_DELAY = 8000;  // 8 seconds

// =============================================================================
// 🔐 SECURITY & PERFORMANCE
// =============================================================================

/**
 * Maximum time to wait for wallet approval (in milliseconds)
 * Prevents infinite waiting if user closes wallet popup
 */
export const WALLET_APPROVAL_TIMEOUT = 300000;  // 5 minutes

/**
 * Maximum time to wait for backend confirmation (in milliseconds)
 * Prevents hanging if backend is slow/unresponsive
 */
export const BACKEND_CONFIRMATION_TIMEOUT = 60000;  // 1 minute

/**
 * Retry attempts for failed network requests
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Delay between retry attempts (in milliseconds)
 */
export const RETRY_DELAY = 2000;  // 2 seconds

// =============================================================================
// 📊 SUPPORTED TOKENS & WALLETS
// =============================================================================

/**
 * Supported tokens
 */
export const SUPPORTED_TOKENS = ['ICP', 'ckBTC', 'ckETH', 'ckUSDC', 'ckUSDT'];

/**
 * Supported wallets
 */
export const SUPPORTED_WALLETS = ['oisy', 'plug', 'stoic', 'nfid', 'bitfinity'];

// =============================================================================
// 💵 TOKEN DECIMALS
// =============================================================================

/**
 * Token decimals (for formatting)
 */
export const TOKEN_DECIMALS = {
  'ICP': 8,
  'ckBTC': 8,
  'ckETH': 18,
  'ckUSDC': 6,
  'ckUSDT': 6
};

// =============================================================================
// 🎯 DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default configuration object
 * Platforms can extend/override these values
 */
export const DEFAULT_CONFIG = {
  canisterId: BACKEND_CANISTER_ID,
  host: IC_HOSTS.mainnet,
  isMainnet: true,
  tokens: SUPPORTED_TOKENS,
  wallets: SUPPORTED_WALLETS,
  icrc1IndexingDelay: ICRC1_INDEXING_DELAY,
  walletApprovalTimeout: WALLET_APPROVAL_TIMEOUT,
  backendConfirmationTimeout: BACKEND_CONFIRMATION_TIMEOUT,
  maxRetryAttempts: MAX_RETRY_ATTEMPTS,
  retryDelay: RETRY_DELAY,
  debug: false
};

// =============================================================================
// 🧩 CONFIGURATION BUILDER
// =============================================================================

/**
 * Merge user config with defaults
 * @param {Object} userConfig - User-provided configuration
 * @returns {Object} - Merged configuration
 */
export function createConfig(userConfig = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig
  };
}

