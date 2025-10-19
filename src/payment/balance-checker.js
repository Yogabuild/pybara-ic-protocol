/**
 * Balance Checker Module
 * 
 * Checks user's token balance before initiating payment
 * Uses direct ledger query (no wallet authorization needed)
 */

import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

/**
 * Token decimal places for formatting
 */
const TOKEN_DECIMALS = {
  'ICP': 8,
  'ckBTC': 8,
  'ckETH': 18,
  'ckUSDC': 6,
  'ckUSDT': 6
};

/**
 * ICRC-1 Ledger IDL Factory (minimal - just balance query)
 */
const ledgerIdlFactory = ({ IDL }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8))
  });
  
  return IDL.Service({
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query'])
  });
};

/**
 * Check user's balance for a specific token
 * 
 * @param {string} userPrincipal - User's principal ID
 * @param {string} ledgerCanisterId - ICRC-1 ledger canister ID
 * @param {boolean} isMainnet - True for IC mainnet, false for local
 * @returns {Promise<bigint>} Balance in smallest unit
 */
export async function checkBalance(userPrincipal, ledgerCanisterId, isMainnet = true) {
  try {
    // Create agent
    const host = isMainnet ? 'https://ic0.app' : 'http://localhost:4943';
    const agent = new HttpAgent({ host });
    
    // Local development only
    if (!isMainnet) {
      await agent.fetchRootKey();
    }
    
    // Create ledger actor
    const ledger = Actor.createActor(ledgerIdlFactory, {
      agent,
      canisterId: ledgerCanisterId
    });
    
    // Query balance
    const balance = await ledger.icrc1_balance_of({
      owner: Principal.fromText(userPrincipal),
      subaccount: [] // Default subaccount
    });
    
    return balance;
    
  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
    throw error;
  }
}

/**
 * Format balance for display
 * 
 * @param {bigint} balance - Balance in smallest unit
 * @param {string} token - Token symbol
 * @returns {string} Formatted balance (e.g., "1.234567 ckUSDC")
 */
export function formatBalance(balance, token) {
  const decimals = TOKEN_DECIMALS[token] || 8;
  const formatted = Number(balance) / Math.pow(10, decimals);
  return `${formatted.toFixed(decimals)} ${token}`;
}

/**
 * Check if user has sufficient balance for payment
 * 
 * @param {string} userPrincipal - User's principal ID
 * @param {string} ledgerCanisterId - ICRC-1 ledger canister ID
 * @param {bigint|string|number} requiredAmount - Amount needed in smallest unit
 * @param {string} token - Token symbol (for logging)
 * @param {boolean} isMainnet - Network selection
 * @returns {Promise<{sufficient: boolean, balance: bigint, shortfall?: bigint}>}
 */
export async function checkSufficientBalance(
  userPrincipal,
  ledgerCanisterId,
  requiredAmount,
  token,
  isMainnet = true
) {
  const required = BigInt(requiredAmount);
  
  try {
    const balance = await checkBalance(userPrincipal, ledgerCanisterId, isMainnet);
    const sufficient = balance >= required;
    
    if (sufficient) {
      return {
        sufficient: true,
        balance
      };
    } else {
      const shortfall = required - balance;
      return {
        sufficient: false,
        balance,
        shortfall
      };
    }
    
  } catch (error) {
    // Return "sufficient" on error to not block payment
    // Wallet will show proper error if truly insufficient
    return {
      sufficient: true,
      balance: 0n,
      error: error.message
    };
  }
}

/**
 * Generate user-friendly insufficient balance error message
 * 
 * @param {bigint} balance - Current balance
 * @param {bigint} required - Required amount
 * @param {string} token - Token symbol
 * @returns {string} Error message
 */
export function generateInsufficientFundsMessage(balance, required, token) {
  const shortfall = required - balance;
  
  return `Insufficient ${token} balance.

You have: ${formatBalance(balance, token)}
You need: ${formatBalance(required, token)}
Shortfall: ${formatBalance(shortfall, token)}

Please add funds to your wallet and try again.`;
}

/**
 * Check balances for multiple tokens in parallel
 * 
 * @param {string} userPrincipal - User's principal ID
 * @param {Object} ledgerIds - Map of token -> ledgerCanisterId
 * @param {boolean} isMainnet - Network selection
 * @returns {Promise<Array<{token: string, balance: bigint}>>}
 */
export async function checkMultipleBalances(userPrincipal, ledgerIds, isMainnet = true) {
  console.log(`💰 Checking balances for: ${Object.keys(ledgerIds).join(', ')}`);
  
  const startTime = performance.now();
  
  const results = await Promise.allSettled(
    Object.entries(ledgerIds).map(async ([token, ledgerId]) => {
      const balance = await checkBalance(userPrincipal, ledgerId, isMainnet);
      return { token, balance };
    })
  );
  
  const elapsed = performance.now() - startTime;
  
  const balances = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
  
  const errors = results
    .filter(r => r.status === 'rejected')
    .map((r, i) => ({ token: Object.keys(ledgerIds)[i], error: r.reason }));
  
  console.log(`✅ Balances fetched in ${elapsed.toFixed(0)}ms`);
  balances.forEach(({ token, balance }) => {
    console.log(`   ${token}: ${formatBalance(balance, token)}`);
  });
  
  if (errors.length > 0) {
    console.warn('⚠️ Some balances failed:', errors);
  }
  
  return balances;
}

