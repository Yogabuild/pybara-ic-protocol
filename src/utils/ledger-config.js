/**
 * Ledger Configuration Module
 * 
 * Maps tokens to their official IC ledger canister IDs
 */

import { LEDGER_CANISTERS } from '../core/config.js';

/**
 * Official IC Ledger Canister IDs
 * Re-export from config for backward compatibility
 */
export const LEDGER_IDS = LEDGER_CANISTERS;

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

