# WooCommerce Integration

**Status**: ✅ **Production Ready** (October 18, 2025)

The `@pybara/ic-protocol` package is fully integrated into the Pybara WooCommerce plugin.

---

## 📦 Installation

```bash
cd pybara-woocommerce/build-tools
npm install @pybara/ic-protocol
```

---

## 🔧 Usage Example

### Basic Setup

```javascript
import { PybaraAgent } from '@pybara/ic-protocol';

const agent = new PybaraAgent({
    canisterId: 'your-canister-id',
    isMainnet: true,
    debug: false,
    
    // Optional: Custom wallet icons
    walletIcons: {
        oisy: '/assets/logos/oisy.svg',
        plug: '/assets/logos/plug.svg'
    }
});

await agent.init();
```

### Connect Wallet

```javascript
// Connect to Oisy Wallet
await agent.connectWallet('oisy');

// Get user's principal
const principal = agent.getPrincipal();
```

### Payment Flow

```javascript
// 1. Initialize payment
const payment = await agent.initPayment({
    orderId: 123,
    usdAmount: 49.99,
    token: 'ckBTC',
    platform: 'WooCommerce',
    siteUrl: 'https://example.com',
    siteName: 'My Store',
    merchantPrincipal: 'merchant-principal-id'
});

// 2. Execute transfer
await agent.executeTransfer(
    payment.payment_id,
    payment.expected_amount,
    payment.token
);

// 3. Confirm payment
const result = await agent.confirmPayment(
    payment.payment_id,
    orderId,
    siteUrl,
    merchantPrincipal
);
```

---

## 🎯 Key Features Used

- ✅ Multi-wallet support (Oisy, Plug, NFID)
- ✅ Automatic price caching
- ✅ Balance checking
- ✅ Dynamic minimum amounts
- ✅ Retry logic for network resilience
- ✅ Custom wallet icons

---

## 📊 Results

**Before**:
- 18 files (196KB) of IC protocol code in WooCommerce

**After**:
- 1 dependency: `@pybara/ic-protocol`
- Zero duplicated IC code
- Same functionality, cleaner codebase

---

## 🔗 Resources

- [Main Package README](../../README.md)
- [WooCommerce Plugin Repository](https://github.com/pybara/pybara-woocommerce)

