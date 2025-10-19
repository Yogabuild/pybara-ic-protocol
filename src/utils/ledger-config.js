/**
 * Ledger Configuration Module
 * 
 * Maps tokens to their official IC ledger canister IDs
 */

/**
 * Official IC Ledger Canister IDs
 */
export const LEDGER_IDS = {
  'ICP': 'ryjl3-tyaaa-aaaaa-aaaba-cai',
  'ckBTC': 'mxzaz-hqaaa-aaaar-qaada-cai',
  'ckETH': 'ss2fx-dyaaa-aaaar-qacoq-cai',
  'ckUSDC': 'xevnm-gaaaa-aaaar-qafnq-cai',
  'ckUSDT': 'cngnf-vqaaa-aaaar-qag4q-cai'
};

/**
 * Get ledger canister ID for a token
 * 
 * @param {string} token - Token symbol (e.g., 'ICP', 'ckBTC')
 * @returns {string} - Ledger canister ID
 */
export function getLedgerCanisterId(token) {
  const ledgerId = LEDGER_IDS[token];
  
  if (!ledgerId) {
    console.warn(`⚠️ Unknown token: ${token}, defaulting to ICP ledger`);
    return LEDGER_IDS['ICP'];
  }
  
  return ledgerId;
}

/**
 * Get all supported tokens
 * 
 * @returns {string[]} - Array of supported token symbols
 */
export function getSupportedTokens() {
  return Object.keys(LEDGER_IDS);
}

/**
 * Check if a token is supported
 * 
 * @param {string} token - Token symbol to check
 * @returns {boolean} - True if supported
 */
export function isTokenSupported(token) {
  return token in LEDGER_IDS;
}

