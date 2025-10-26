# @yogabuild/pybara-sdk

[![npm version](https://img.shields.io/npm/v/@yogabuild/pybara-sdk.svg)](https://www.npmjs.com/package/@yogabuild/pybara-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

**JavaScript SDK for Pybara crypto payment gateway.** Platform-agnostic Internet Computer integration for e-commerce.

**Supports:** ICP, ckBTC, ckETH, ckUSDC, ckUSDT  
**Wallets:** Oisy, Plug, NFID

---

## Installation

```bash
npm install @yogabuild/pybara-sdk
```

---

## Quick Start

```javascript
import { PybaraAgent } from '@yogabuild/pybara-sdk';

// Initialize agent
const agent = new PybaraAgent({
  canisterId: 'zvgwv-zyaaa-aaaac-qchaq-cai',
  host: 'https://icp-api.io',
  debug: false
});

// Connect wallet
await agent.connectWallet('oisy');

// Calculate payment amount
const calc = await agent.calculateAmount(49.99, 'ckBTC');
console.log('Expected amount:', calc.expected_amount);
console.log('Price used:', calc.price_used);

// Send customer payment to Pybara Core
const blockIndex = await agent.sendCustomerPaymentToPybaraCore(
  calc.expected_amount,
  'zvgwv-zyaaa-aaaac-qchaq-cai',
  'ckBTC'
);

// Create payment record
const payment = await agent.createPaymentRecord({
  orderId: 12345,
  siteUrl: 'https://mystore.com',
  siteName: 'My Store',
  platform: 'woocommerce',
  usdAmount: 49.99,
  token: 'ckBTC',
  merchantPrincipal: 'merchant-principal-id',
  userPrincipal: agent.walletManager.getPrincipal(),
  wallet: 'Oisy'
});

// Verify customer payment on-chain
await agent.verifyAndRecordCustomerPayment(
  payment.payment_id,
  12345,
  'https://mystore.com',
  'merchant-principal-id',
  blockIndex,
  calc.expected_amount
);

// Execute payout to merchant (99% merchant, 1% platform fee)
await agent.executePayoutToMerchant(
  payment.payment_id,
  12345,
  'https://mystore.com',
  'merchant-principal-id'
);
```

---

## API Reference

### Core Agent

```javascript
import { PybaraAgent } from '@yogabuild/pybara-sdk';

const agent = new PybaraAgent(config);

// Wallet
await agent.connectWallet('oisy');  // or 'plug', 'nfid'
await agent.disconnectWallet();
agent.isWalletConnected();
agent.walletManager.getPrincipal();

// Payment Lifecycle
await agent.calculateAmount(usdAmount, token);
await agent.sendCustomerPaymentToPybaraCore(amountE8s, pybaraCorePrincipal, token);
await agent.createPaymentRecord(params);
await agent.verifyAndRecordCustomerPayment(paymentId, orderId, siteUrl, merchantPrincipal, txId, receivedAmount);
await agent.executePayoutToMerchant(paymentId, orderId, siteUrl, merchantPrincipal);

// Query
await agent.getPayment(paymentId);
await agent.getPaymentByOrder(orderId, siteUrl, merchantPrincipal);
await agent.getTokenPrices();
await agent.getTokenConfig();

// Balance Checking
await agent.getAvailableTokens();
await agent.getBalance(token);
await agent.checkTokenBalance(token, requiredAmount);
await agent.checkAllBalances(['ICP', 'ckBTC']);

// Pricing
await agent.getTokenPrice(token);
await agent.getMinimumAmount(token);
```

### Payment Calculator (Platform-Agnostic)

All payment math in one place - used by WooCommerce, Shopify, and future platforms.

```javascript
import { PaymentCalculator } from '@yogabuild/pybara-sdk';

// Calculate for all tokens (checks minimums, balances, etc.)
const calculations = PaymentCalculator.calculateAllTokens(
  usdAmount,       // Order total
  priceData,       // From getTokenPrices()
  tokenConfig,     // From getTokenConfig()
  balances         // User's token balances
);

// Each calculation includes:
// - requiredAmount (BigInt)
// - isPayable (boolean)
// - hasSufficientBalance
// - isBelowMinimum
// - and more...

// Find best token
const bestToken = PaymentCalculator.findBestToken(calculations);

// Format for display
PaymentCalculator.formatTokenAmount(amount, decimals);
PaymentCalculator.formatUSD(usdAmount);
```

**Why it exists:** Ensures all platforms use identical payment logic - no duplication, fix once works everywhere.

### Wallet Adapters

```javascript
import { 
  WalletManager,
  OisyWalletAdapter,
  PlugWalletAdapter,
  NFIDWalletAdapter 
} from '@yogabuild/pybara-sdk';

const manager = new WalletManager();
manager.registerWallet(new OisyWalletAdapter());
manager.registerWallet(new PlugWalletAdapter());
manager.registerWallet(new NFIDWalletAdapter());

await manager.connect('oisy');
const principal = manager.getPrincipal();
await manager.disconnect();
```

### Currency Utilities

```javascript
import {
  convertMinimumToUSD,
  convertUSDToCurrency,
  checkOrderMeetsMinimum,
  formatTokenBalance,
  getTokenDecimals,
  CurrencyFormatter
} from '@yogabuild/pybara-sdk';

// Convert minimum from smallest units to USD
const minUSD = convertMinimumToUSD(1000000, 'ckUSDC', 1.00);

// Convert USD to target currency
const eurAmount = convertUSDToCurrency(10.00, 'EUR', 0.92);

// Format currency
const formatter = new CurrencyFormatter('en-US', 'USD');
const formatted = formatter.format(49.99, 'EUR'); // "€49.99"

// Check order minimum
const check = checkOrderMeetsMinimum(
  50.00,      // order total
  1000000,    // minimum in smallest units
  'ckUSDC',   // token
  1.00,       // token price
  'EUR',      // order currency
  0.92        // exchange rate
);

// Format token balance
const formatted = formatTokenBalance(50000000n, 'ckBTC', 8);
// Returns: "0.5"

// Get token decimals
const decimals = getTokenDecimals('ckBTC'); // 8
```

### Balance Checking

```javascript
import { 
  checkBalance,
  checkSufficientBalance,
  formatBalance,
  checkMultipleBalances 
} from '@yogabuild/pybara-sdk';

// Check single balance
const balance = await checkBalance(principal, 'ckBTC', ledgerCanisterId);

// Check if sufficient
const result = await checkSufficientBalance(
  principal,
  'ckBTC',
  BigInt(50000000),
  ledgerCanisterId
);

// Format balance
const formatted = formatBalance(BigInt(50000000), 'ckBTC');
// Returns: "0.50000000 ckBTC"

// Check multiple tokens
const balances = await checkMultipleBalances(principal, ['ICP', 'ckBTC']);
```

### Price Caching

```javascript
import { PriceCache } from '@yogabuild/pybara-sdk';

const cache = new PriceCache(agent);

// Start background updates
cache.start();

// Get cached prices
const prices = await cache.getPrices();

// Stop updates
cache.stop();
```

### Configuration

```javascript
import {
  BACKEND_CANISTER_ID,
  IC_HOSTS,
  LEDGER_CANISTERS,
  SUPPORTED_TOKENS,
  SUPPORTED_WALLETS,
  TOKEN_DECIMALS,
  createConfig
} from '@yogabuild/pybara-sdk';

// Use defaults
const config = createConfig();

// Or customize
const customConfig = createConfig({
  canisterId: 'your-canister-id',
  host: IC_HOSTS.mainnet,
  debug: true
});
```

---

## Package Structure

```
@yogabuild/pybara-sdk/
├── src/
│   ├── core/
│   │   ├── PybaraAgent.js        # Main payment agent
│   │   ├── canister-idl.js       # Candid interface (IDL)
│   │   └── config.js             # Configuration & defaults
│   │
│   ├── wallets/
│   │   ├── _WalletManager.js     # Wallet orchestrator
│   │   ├── BaseWalletAdapter.js  # Base adapter class
│   │   ├── OisyWalletAdapter.js  # Oisy integration
│   │   ├── PlugWalletAdapter.js  # Plug integration
│   │   └── NFIDWalletAdapter.js  # NFID integration
│   │
│   ├── utils/
│   │   ├── balance-checker.js    # Token balance queries
│   │   ├── currency-formatter.js # Currency display
│   │   ├── currency-logic.js     # Currency calculations
│   │   ├── ledger-actor.js       # Ledger actor creation
│   │   ├── ledger-config.js      # Ledger configuration
│   │   └── price-cache.js        # Token price caching
│   │
│   └── index.js                  # Public API exports
│
├── dist/                         # Compiled bundles
│   └── pybara-sdk.js             # Full bundle
│
└── package.json
```

---

## Configuration Options

```javascript
const config = {
  // Required
  canisterId: 'zvgwv-zyaaa-aaaac-qchaq-cai',  // Pybara backend
  host: 'https://icp-api.io',                 // IC network
  
  // Optional
  isMainnet: true,
  tokens: ['ICP', 'ckBTC', 'ckETH', 'ckUSDC', 'ckUSDT'],
  wallets: ['oisy', 'plug', 'nfid'],
  icrc1IndexingDelay: 8000,           // 8 seconds
  walletApprovalTimeout: 300000,      // 5 minutes
  backendConfirmationTimeout: 60000,  // 1 minute
  maxRetryAttempts: 3,
  retryDelay: 2000,                   // 2 seconds
  debug: false
};
```

---

## Security

- ✅ No private keys stored
- ✅ All transfers initiated by user wallets
- ✅ On-chain transaction verification
- ✅ HTTPS only
- ✅ No sensitive data logged

---

## License

MIT - See [LICENSE](./LICENSE)

---

## Status

**Version:** 2.1.0  
**Stability:** Production-ready  
**License:** MIT

---

**Built by [Yogabuild](https://github.com/yogabuild) | ICP Dev House**
