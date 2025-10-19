# 🦫 @yogabuild/pybara-ic-protocol

**Shared Internet Computer protocol integration for Pybara payment gateway**

Platform-agnostic JavaScript library for integrating crypto payments into any e-commerce platform.

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
npm install @yogabuild/pybara-ic-protocol
```

---

## 🚀 Quick Start

### **1. Initialize IC Agent**

```javascript
import { PybaraAgent } from '@yogabuild/pybara-ic-protocol';

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
import { WalletManager } from '@yogabuild/pybara-ic-protocol/wallets';

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
import { PaymentExecutor } from '@yogabuild/pybara-ic-protocol';

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
import { PybaraAgent } from '@yogabuild/pybara-ic-protocol';

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
import { PybaraAgent } from '@yogabuild/pybara-ic-protocol';

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

### **Wallet Module**

```javascript
import { 
  WalletManager,
  OisyWalletAdapter,
  PlugWalletAdapter,
} from '@yogabuild/pybara-ic-protocol/wallets';

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
} from '@yogabuild/pybara-ic-protocol/payment';

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
} from '@yogabuild/pybara-ic-protocol/ui';

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
import { PybaraAgent, WalletManager } from '@yogabuild/pybara-ic-protocol';

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
import { PybaraAgent, WalletManager } from '@yogabuild/pybara-ic-protocol';
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
import { PybaraAgent, WalletManager } from '@yogabuild/pybara-ic-protocol';

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
import { PybaraAgent, config } from '@yogabuild/pybara-ic-protocol';

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
@yogabuild/pybara-ic-protocol/
├── src/
│   ├── core/
│   │   ├── canister-idl.js       # Candid interface
│   │   ├── ic-agent.js           # IC communication
│   │   └── payment-config.js     # Configuration
│   │
│   ├── wallets/
│   │   ├── base/
│   │   │   └── WalletAdapter.js
│   │   ├── oisy/
│   │   │   └── OisyWalletAdapter.js
│   │   ├── plug/
│   │   │   └── PlugWalletAdapter.js
│   │   ├── nfid/
│   │   │   └── NFIDWalletAdapter.js
│   │   ├── stoic/
│   │   │   └── StoicWalletAdapter.js
│   │   ├── bitfinity/
│   │   │   └── BitfinityWalletAdapter.js
│   │   └── WalletManager.js
│   │
│   ├── payment/
│   │   ├── balance-checker.js
│   │   ├── price-cache.js
│   │   ├── minimum-checker.js
│   │   └── payment-executor.js
│   │
│   ├── ui/
│   │   ├── WalletSelector.js
│   │   ├── PaymentProgress.js
│   │   └── TokenPicker.js
│   │
│   └── utils/
│       ├── currency-formatter.js
│       ├── ledger-config.js
│       └── error-handler.js
│
├── dist/                         # Compiled bundles
│   ├── pybara-ic-protocol.js     # Full bundle
│   ├── pybara-wallets.js         # Wallets only
│   └── pybara-ui.js              # UI only
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

## 📄 License

MIT - See [LICENSE](./LICENSE)

---

## 🌟 Status

**Version**: 1.1.0  
**Used By**: WooCommerce, Shopify, ic-checkout  
**Stability**: Production-ready

**What's New in v1.1.0:**
- ✨ Added `getAvailableTokens()` - Get list of supported tokens
- ✨ Added `getBalance(token)` - Query user balance for specific token
- ✨ Added `getTokenPrice(token)` - Fetch current token price
- ✨ Added `getMinimumAmount(token)` - Get minimum order amount
- 🎯 Perfect for building checkout UIs and token pickers  

---

**Built with 🦫 by Pybara**

