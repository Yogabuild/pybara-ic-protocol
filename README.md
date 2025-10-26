# 🦫 @yogabuild/pybara-sdk

[![npm version](https://img.shields.io/npm/v/@yogabuild/pybara-sdk.svg)](https://www.npmjs.com/package/@yogabuild/pybara-sdk)
[![npm downloads](https://img.shields.io/npm/dm/@yogabuild/pybara-sdk.svg)](https://www.npmjs.com/package/@yogabuild/pybara-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

**JavaScript SDK for Pybara payment gateway.** Connects to Pybara's Internet Computer backend to handle crypto payments for WooCommerce, Shopify, and custom integrations.

**📦 npm:** https://www.npmjs.com/package/@yogabuild/pybara-sdk

---

## 🎯 Purpose

This package contains all the **platform-agnostic** code for Pybara's Internet Computer integration:

- ✅ IC Canister communication
- ✅ Wallet adapters (Oisy, Plug, NFID, Stoic, Bitfinity)
- ✅ Payment lifecycle management
- ✅ Token balance checking
- ✅ Price fetching & caching
- ✅ UI components (vanilla JS)

**Used by:**
- `pybara-woocommerce` (PHP/WordPress)
- `pybara-shopify` (Node.js/Remix)
- `pybara-magento` (PHP)
- `pybara-prestashop` (PHP)
- Future integrations...

---

## 📦 Installation

```bash
npm install @yogabuild/pybara-sdk
```

---

## 🚀 Quick Start

### **1. Initialize IC Agent**

```javascript
import { PybaraAgent } from '@yogabuild/pybara-sdk';

const agent = new PybaraAgent({
  canisterId: 'zvgwv-zyaaa-aaaac-qchaq-cai', // Pybara backend canister
  host: 'https://ic0.app', // Mainnet
  
  // Optional: Customize wallet icons (defaults to emoji)
  walletIcons: {
    oisy: '/assets/logos/oisy.svg',
    plug: '/assets/logos/plug.svg'
    // nfid: will use default emoji '🔐'
  }
});

// Initialize a payment
const result = await agent.initPayment({
  orderId: 12345,
  siteUrl: 'https://mystore.com',
  siteName: 'My Store',
  platform: 'Shopify', // or 'WooCommerce', 'Magento', etc.
  usdAmount: 49.99,
  token: 'ckBTC',
  merchantPrincipal: 'xxxxx-xxxxx-xxxxx-xxxxx-cai',
  userPrincipal: 'yyyyy-yyyyy-yyyyy-yyyyy-cai', // optional
  wallet: 'Oisy', // optional
});

console.log('Payment ID:', result.paymentId);
console.log('Expected Amount:', result.expectedAmount);
console.log('Price Used:', result.priceUsed);
```

### **2. Connect Wallet**

```javascript
import { WalletManager } from '@yogabuild/pybara-sdk/wallets';

const walletManager = new WalletManager();

// Connect to Oisy
await walletManager.connect('oisy');

// Get user's principal
const principal = walletManager.getPrincipal();

// Check token balance
const balance = await walletManager.getBalance('ckBTC');
```

### **3. Execute Payment**

```javascript
import { PaymentExecutor } from '@yogabuild/pybara-sdk';

const executor = new PaymentExecutor(agent, walletManager);

// Execute full payment flow
const result = await executor.executePayment({
  orderId: 12345,
  siteUrl: 'https://mystore.com',
  siteName: 'My Store',
  platform: 'Shopify',
  usdAmount: 49.99,
  token: 'ckBTC',
  merchantPrincipal: 'xxxxx-xxxxx-xxxxx-xxxxx-cai',
});

console.log('Merchant TX:', result.merchantTxId);
console.log('Platform TX:', result.platformTxId);
```

---

## 📚 API Reference

### **Core Module**

```javascript
import { PybaraAgent } from '@yogabuild/pybara-sdk';

// Initialize agent
const agent = new PybaraAgent(config);

// Payment lifecycle
await agent.initPayment(params);
await agent.recordPayment(params);
await agent.confirmPayment(params);
await agent.getPaymentByOrder(params);

// Utilities
await agent.getTokenPrices();
await agent.getMinimumOrderAmounts();

// 🆕 Helper methods (for UI/checkout)
await agent.getAvailableTokens();        // Get list of supported tokens
await agent.getBalance(token);           // Get user's balance for token
await agent.getTokenPrice(token);        // Get current price for token
await agent.getMinimumAmount(token);     // Get minimum order amount
```

### **Helper Methods** (New!)

These methods make it easy to build checkout UIs and token pickers.

```javascript
import { PybaraAgent } from '@yogabuild/pybara-sdk';

const agent = new PybaraAgent(config);

// 1. Get list of available tokens
const tokens = await agent.getAvailableTokens();
// Returns: ['ICP', 'ckBTC', 'ckETH', 'ckUSDC', 'ckUSDT']

// 2. Get user's balance for a token (requires connected wallet)
await agent.connectWallet('oisy');
const balance = await agent.getBalance('ckBTC');
// Returns: { raw: 50000000n, formatted: '0.50000000 ckBTC' }

// 3. Get current token price
const price = await agent.getTokenPrice('ckBTC');
// Returns: 98234.56 (USD)

// 4. Get minimum order amount
const minimum = await agent.getMinimumAmount('ckBTC');
// Returns: { usd: 5.00, token: '0.00005090 ckBTC' }
```

**Perfect for building:**
- Token pickers (show available tokens with balances)
- Order validation (check minimums)
- Price displays (show real-time prices)
- Balance checks (before initiating payment)

### **Currency & Conversion Helpers** (v1.2.0+)

These methods handle currency conversion and formatting for global e-commerce.

```javascript
import { PybaraAgent } from '@yogabuild/pybara-sdk';

const agent = new PybaraAgent(config);

// 1. Convert minimum from smallest units to USD
const minUSD = await agent.convertMinimumToUSD(1000000, 'ckUSDC', 1.00);
// Returns: 1.00 (USD)

// 2. Convert USD to target currency
const eurAmount = agent.convertUSDToCurrency(10.00, 'EUR', 0.92);
// Returns: 9.20

// 3. Format currency for display
const formatted = agent.formatCurrency(10.50, 'EUR', 'de-DE');
// Returns: "10,50 €"

// With Chinese Yuan
const formatted = agent.formatCurrency(100, 'CNY', 'zh-CN');
// Returns: "¥100.00"

// 4. Check if order meets minimum
const check = await agent.checkOrderMeetsMinimum(
  50.00,      // order total
  1000000,    // minimum in smallest units
  'ckUSDC',   // token
  1.00,       // token price (USD)
  'EUR',      // order currency
  0.92        // exchange rate (USD to EUR)
);
// Returns: { meetsMinimum: true, minUSD: 1.00, minConverted: 0.92, shortfall: 0 }

// 5. Format token balance
const formatted = agent.formatTokenBalance(50000000n, 'ckBTC', 8);
// Returns: "0.50000000"

// 6. Get token decimals
const decimals = agent.getTokenDecimals('ckBTC');
// Returns: 8
```

**Direct imports available:**
```javascript
import { 
  convertMinimumToUSD, 
  convertUSDToCurrency,
  formatCurrency,
  checkOrderMeetsMinimum 
} from '@yogabuild/pybara-sdk';

// Use functions directly without agent instance
const minUSD = convertMinimumToUSD(1000000, 'ckUSDC', 1.00);
const formatted = formatCurrency(10.50, 'EUR', 'de-DE');
```

**Perfect for:**
- Multi-currency e-commerce (WooCommerce, Shopify, etc.)
- Standalone checkout components
- Minimum order validation across currencies
- Global localization (supports 160+ currencies via `Intl.NumberFormat`)

### **Wallet Module**

```javascript
import { 
  WalletManager,
  OisyWalletAdapter,
  PlugWalletAdapter,
} from '@yogabuild/pybara-sdk/wallets';

// Create wallet manager
const manager = new WalletManager();

// Connect wallet
await manager.connect('oisy'); // or 'plug', 'stoic', 'nfid', 'bitfinity'

// Get connected wallet info
const principal = manager.getPrincipal();
const accountId = manager.getAccountId();

// Check balances
const balance = await manager.getBalance('ICP');
const allBalances = await manager.getAllBalances(['ICP', 'ckBTC', 'ckETH']);

// Execute transfer
const txId = await manager.transfer({
  to: 'recipient-principal',
  amount: 100000000n, // 1 ICP (8 decimals)
  token: 'ICP',
});
```

### **Payment Module**

```javascript
import { 
  BalanceChecker,
  PriceCache,
  MinimumChecker,
} from '@yogabuild/pybara-sdk/payment';

// Check if user has sufficient balance
const checker = new BalanceChecker(walletManager);
const hasBalance = await checker.checkSufficient('ckBTC', 50000000n);

// Fetch and cache token prices
const cache = new PriceCache(agent);
const prices = await cache.getPrices(['ICP', 'ckBTC', 'ckETH']);

// Check minimum order amounts
const minimumChecker = new MinimumChecker(agent);
const meetsMinimum = await minimumChecker.check('ICP', 49.99);
```

### **UI Module** (Vanilla JS Components)

```javascript
import { 
  WalletSelector,
  PaymentProgress,
  TokenPicker,
} from '@yogabuild/pybara-sdk/ui';

// Render wallet selector
const selector = new WalletSelector({
  container: document.getElementById('wallet-container'),
  wallets: ['oisy', 'plug', 'nfid'],
  onConnect: (wallet) => console.log('Connected:', wallet),
});

// Show payment progress
const progress = new PaymentProgress({
  container: document.getElementById('progress-container'),
});

progress.update(1, 'Initializing payment...');
progress.update(2, 'Connecting wallet...');
progress.update(3, 'Sending payment...');
progress.complete('Payment successful!');
```

---

## 🌍 Platform Integration Examples

### **WooCommerce (PHP + JavaScript)**

```javascript
// woocommerce-pybara/assets/js/checkout.js
import { PybaraAgent, WalletManager } from '@yogabuild/pybara-sdk';

const agent = new PybaraAgent({ /* config */ });
const wallets = new WalletManager();

// Hook into WooCommerce checkout
jQuery(document.body).on('checkout_place_order_wc_pybara', async function() {
  await wallets.connect('oisy');
  const result = await agent.initPayment({
    platform: 'WooCommerce',
    // ... other params from PHP
  });
  // ... continue payment flow
});
```

### **Shopify (Node.js + React)**

```typescript
// pybara-shopify/extensions/checkout/Checkout.tsx
import { PybaraAgent, WalletManager } from '@yogabuild/pybara-sdk';
import { useEffect, useState } from 'react';

export function PybaraCheckout() {
  const [agent] = useState(() => new PybaraAgent({ /* config */ }));
  const [wallets] = useState(() => new WalletManager());

  const handlePayment = async () => {
    await wallets.connect('plug');
    const result = await agent.initPayment({
      platform: 'Shopify',
      // ... other params from Shopify
    });
    // ... continue payment flow
  };

  return <button onClick={handlePayment}>Pay with Crypto</button>;
}
```

### **Magento (PHP + JavaScript)**

```javascript
// pybara-magento/view/frontend/web/js/view/payment/method-renderer/pybara.js
import { PybaraAgent, WalletManager } from '@yogabuild/pybara-sdk';

define(['uiComponent'], function(Component) {
  return Component.extend({
    async placeOrder() {
      const agent = new PybaraAgent({ /* config */ });
      const wallets = new WalletManager();
      
      await wallets.connect('oisy');
      const result = await agent.initPayment({
        platform: 'Magento',
        // ... other params
      });
      // ... continue payment flow
    }
  });
});
```

---

## 🔧 Configuration

### **Default Configuration**

```javascript
const config = {
  canisterId: 'zvgwv-zyaaa-aaaac-qchaq-cai', // Pybara backend
  host: 'https://ic0.app',                   // Mainnet
  
  // Optional overrides
  tokens: ['ICP', 'ckBTC', 'ckETH', 'ckUSDC', 'ckUSDT'],
  wallets: ['oisy', 'plug', 'stoic', 'nfid', 'bitfinity'],
  
  // Price cache (15 minutes)
  priceCacheDuration: 15 * 60 * 1000,
  
  // ICRC-1 indexing delay (8 seconds)
  icrc1IndexingDelay: 8000,
  
  // Debug mode
  debug: false,
};
```

### **Custom Configuration**

```javascript
import { PybaraAgent, config } from '@yogabuild/pybara-sdk';

// Override defaults
config.debug = true;
config.priceCacheDuration = 10 * 60 * 1000; // 10 minutes

const agent = new PybaraAgent({
  canisterId: config.canisterId,
  host: config.host,
});
```

---

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests (requires IC replica)
npm run test:integration

# E2E tests (requires wallet extensions)
npm run test:e2e
```

---

## 📁 Package Structure

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
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔐 Security

- ✅ No private keys stored
- ✅ All transfers initiated by user wallets
- ✅ On-chain transaction verification
- ✅ HTTPS only
- ✅ No sensitive data logged

---

## 🦫 Contributing

This is a core Pybara package. Changes here affect **all** platform integrations.

**Before making changes:**
1. Test with WooCommerce
2. Test with Shopify
3. Update version number
4. Document breaking changes

---

## 🌐 Community

- X: [@pybara_hq](https://twitter.com/pybara_hq)
- Email: contact@pybara.com

---

## 📄 License

MIT - See [LICENSE](./LICENSE)

---

## 🌟 Status

**Version**: 1.2.0  
**Used By**: WooCommerce, Shopify, ic-checkout  
**Stability**: Production-ready

**What's New in v1.2.0:**
- 🌍 Added `convertMinimumToUSD()` - Convert minimums from smallest units to USD
- 💱 Added `convertUSDToCurrency()` - Convert USD to any currency
- 🎨 Added `formatCurrency()` - Format amounts with proper locale (supports 160+ currencies)
- ✅ Added `checkOrderMeetsMinimum()` - Validate order totals across currencies
- 🔢 Added `formatTokenBalance()` - Format token balances with proper decimals
- 🎯 Ready for global e-commerce (CNY, EUR, GBP, etc.)

**What's New in v1.1.0:**
- ✨ Added `getAvailableTokens()` - Get list of supported tokens
- ✨ Added `getBalance(token)` - Query user balance for specific token
- ✨ Added `getTokenPrice(token)` - Fetch current token price
- ✨ Added `getMinimumAmount(token)` - Get minimum order amount
- 🎯 Perfect for building checkout UIs and token pickers  

---

**Built with 🦫 by Pybara**

