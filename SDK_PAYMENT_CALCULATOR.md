# PaymentCalculator - Platform-Agnostic Payment Logic

**Added:** October 26, 2025  
**Version:** v1.3.0  
**Status:** ✅ Production Ready

---

## Overview

`PaymentCalculator` is a utility class that encapsulates all payment calculation logic in a platform-agnostic way. This ensures **consistent payment calculations** across all platform integrations (WooCommerce, Shopify, etc.).

---

## Why This Exists

### ❌ Before (Duplicated Logic):

Each platform integration calculated payments independently:

```javascript
// WooCommerce had this logic
const requiredAmount = usdAmount / price;
const requiredSmallestUnit = BigInt(Math.ceil(requiredAmount * Math.pow(10, decimals)));
const requiredWithBuffer = requiredSmallestUnit + (requiredSmallestUnit / 10n);

// Shopify would duplicate the same logic
const requiredAmount = usdAmount / price;
const requiredSmallestUnit = BigInt(Math.ceil(requiredAmount * Math.pow(10, decimals)));
// ... etc
```

**Problems:**
- Code duplication across platforms
- Bug fixes needed in multiple places
- Inconsistent behavior risk
- Hard to test

---

### ✅ After (SDK Handles It):

```javascript
import { PaymentCalculator } from '@yogabuild/pybara-sdk';

// Both WooCommerce and Shopify use the same SDK function
const calculations = PaymentCalculator.calculateAllTokens(
    usdAmount,
    prices,
    tokenConfig,
    balances
);
```

**Benefits:**
- ✅ Single source of truth
- ✅ Fix once, works everywhere
- ✅ Consistent across platforms
- ✅ Easy to test
- ✅ Platform code stays thin

---

## API Reference

### `calculatePayment()`

Calculate payment details for a single token.

```javascript
const payment = PaymentCalculator.calculatePayment(
    100,              // USD amount
    'ICP',            // Token symbol
    3.14,             // Current price
    8,                // Decimals
    1000000n,         // Minimum (in smallest units)
    5000000000n       // User balance (optional)
);

// Returns:
{
    token: 'ICP',
    price: 3.14,
    decimals: 8,
    requiredAmount: 3184713375n,          // BigInt
    requiredWithBuffer: 3503184712n,      // +10% buffer
    requiredInToken: 31.847133757,        // Human-readable
    minimum: 1000000n,
    minimumInToken: 0.01,
    minimumInUSD: 0.0314,
    isBelowMinimum: false,
    userBalance: 5000000000n,
    balanceInToken: 50,
    balanceInUSD: 157,
    hasSufficientBalance: true,
    isPayable: true
}
```

---

### `calculateAllTokens()`

Calculate payment details for all supported tokens.

```javascript
const priceData = {
    'ICP': 3.14,
    'ckBTC': 110000,
    'ckETH': 4000,
    'ckUSDC': 1.0,
    'ckUSDT': 1.0
};

const tokenConfig = {
    supported_tokens: ['ICP', 'ckBTC', 'ckETH', 'ckUSDC', 'ckUSDT'],
    decimals: {
        'ICP': 8,
        'ckBTC': 8,
        'ckETH': 18,
        'ckUSDC': 6,
        'ckUSDT': 6
    },
    minimums: {
        'ICP': 1000000,
        'ckBTC': 1000,
        'ckETH': 1000000000000,
        'ckUSDC': 100000,
        'ckUSDT': 100000
    }
};

const balances = {
    'ICP': 5000000000n,
    'ckBTC': 0n,
    'ckETH': 2000000000000000000n
};

const calculations = PaymentCalculator.calculateAllTokens(
    100,          // USD amount
    priceData,
    tokenConfig,
    balances
);

// Returns array of payment calculations, one per token
```

---

### `findBestToken()`

Find the most suitable token for payment.

```javascript
const bestToken = PaymentCalculator.findBestToken(calculations);

// Returns the calculation object for the best token
// Priority:
// 1. Has sufficient balance
// 2. Not below minimum
// 3. Highest balance in USD
```

---

### `formatTokenAmount()`

Format token amounts for display.

```javascript
const formatted = PaymentCalculator.formatTokenAmount(
    3184713375n,  // Amount in smallest units
    8,            // Decimals
    6             // Max decimals to display (optional)
);
// Returns: "31.847134"
```

---

### `formatUSD()`

Format USD amounts.

```javascript
const formatted = PaymentCalculator.formatUSD(157.5);
// Returns: "$157.50"
```

---

## Usage in Platform Integrations

### WooCommerce Example

```javascript
import { PaymentCalculator } from '@yogabuild/pybara-sdk';

// Fetch data from backend
const pricesArray = await gateway.getTokenPrices();
const tokenConfig = await gateway.getTokenConfig();
const balances = await fetchUserBalances();

// Convert to maps
const prices = {};
pricesArray.forEach(p => prices[p.token] = p.price);

// Calculate for all tokens
const calculations = PaymentCalculator.calculateAllTokens(
    orderTotalUSD,
    prices,
    tokenConfig,
    balances
);

// Add platform-specific display info
const tokenData = calculations.map(calc => ({
    // SDK calculation results
    ...calc,
    
    // WooCommerce-specific display
    icon: `${pluginUrl}assets/logos/${calc.token.toLowerCase()}.svg`,
    displayName: getWooDisplayName(calc.token)
}));
```

---

### Shopify Example (Future)

```javascript
import { PaymentCalculator } from '@yogabuild/pybara-sdk';

// Same SDK function, different platform
const calculations = PaymentCalculator.calculateAllTokens(
    cartTotal,
    prices,
    tokenConfig,
    balances
);

// Add Shopify-specific display info
const tokenOptions = calculations.map(calc => ({
    ...calc,
    icon: getShopifyAssetUrl(calc.token),
    displayName: getShopifyDisplayName(calc.token)
}));
```

---

## Buffer Calculation (10%)

The calculator adds a **10% buffer** to the required amount:

```javascript
const requiredWithBuffer = requiredSmallestUnit + (requiredSmallestUnit / 10n);
```

**Why?**
- Platform fee: ~1%
- Transfer fees: 3x (user + merchant + platform)
- Price fluctuations during payment
- Safety margin

**10% is conservative** and ensures payments don't fail due to small discrepancies.

---

## Error Handling

If calculation fails for a token (invalid price, etc.), the function returns an error state:

```javascript
{
    token: 'ICP',
    error: 'Invalid price for ICP: 0',
    isPayable: false,
    isBelowMinimum: true,
    hasSufficientBalance: false
}
```

Platform code should check for `calc.error` and handle gracefully.

---

## Testing

```javascript
import { PaymentCalculator } from '@yogabuild/pybara-sdk';

// Test calculation
const calc = PaymentCalculator.calculatePayment(
    100, 'ICP', 3.14, 8, 1000000n, 5000000000n
);

assert(calc.isPayable === true);
assert(calc.hasSufficientBalance === true);
assert(calc.isBelowMinimum === false);
```

---

## Benefits for Pybara

### Single Source of Truth
- All payment logic in one place
- Fix bugs once, works everywhere
- Easy to audit and test

### Platform Agnostic
- WooCommerce uses it
- Shopify will use it
- Any future platform uses it
- Consistent behavior guaranteed

### Thin Platform Integrations
- Platform code focuses on UI/UX
- Business logic stays in SDK
- Easier to maintain

### Professional Architecture
- Separation of concerns
- Testable business logic
- Scalable design

---

## Related Files

**SDK:**
- `src/utils/payment-calculator.js` - Implementation
- `src/index.js` - Export

**WooCommerce:**
- `build-tools/src/frontend/modules/checkout.js` - Usage

**Documentation:**
- `SDK_PAYMENT_CALCULATOR.md` - This file
- `README.md` - Updated with calculator docs

---

**Result:** Clean, reusable, platform-agnostic payment calculations! 🎯
