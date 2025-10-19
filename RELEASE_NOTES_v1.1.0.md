# Release Notes - v1.1.0

**Release Date:** October 19, 2025  
**Type:** Minor version (new features, no breaking changes)

---

## 🎉 What's New

### Helper Methods for Checkout UIs

Added 4 new convenience methods to `PybaraAgent` class to simplify building checkout UIs and token pickers:

#### 1. `getAvailableTokens()`
Get list of supported tokens from backend canister.

```javascript
const tokens = await agent.getAvailableTokens();
// Returns: ['ICP', 'ckBTC', 'ckETH', 'ckUSDC', 'ckUSDT']
```

**Use Case:** Build dynamic token pickers

---

#### 2. `getBalance(token)`
Query user's balance for a specific token.

```javascript
await agent.connectWallet('oisy');
const balance = await agent.getBalance('ckBTC');
// Returns: { raw: 50000000n, formatted: '0.50000000 ckBTC' }
```

**Use Case:** Show balances in token picker UI

---

#### 3. `getTokenPrice(token, currency?)`
Fetch current price for a token.

```javascript
const price = await agent.getTokenPrice('ckBTC', 'USD');
// Returns: 98234.56
```

**Use Case:** Real-time price displays

---

#### 4. `getMinimumAmount(token, currency?)`
Get minimum order amount for a token.

```javascript
const minimum = await agent.getMinimumAmount('ckBTC', 'USD');
// Returns: { usd: 5.00, token: '0.00005090 ckBTC' }
```

**Use Case:** Order validation, show minimums

---

## 📦 Package Stats

| Metric | Value |
|--------|-------|
| **ESM Bundle** | 57.8KB (was 53KB in v1.0.0) |
| **CJS Bundle** | 29.3KB (was 27KB in v1.0.0) |
| **Gzipped ESM** | 12.6KB |
| **Gzipped CJS** | 8.4KB |

**Bundle size increase:** +4.8KB ESM, +2.3KB CJS  
**Reason:** New helper methods with error handling and formatting

---

## 📚 Documentation

- ✅ Updated README with helper methods section
- ✅ Created comprehensive [HELPER_METHODS.md](docs/HELPER_METHODS.md) guide
- ✅ Updated STATUS.md with v1.1.0 info
- ✅ Added usage examples and migration guide

---

## 🔄 Migration from v1.0.0

**No breaking changes!** All existing code continues to work.

If you were using low-level methods, consider switching to the new helpers:

### Before (v1.0.0)
```javascript
const config = await agent.getTokenConfig();
const tokens = config.supported_tokens;

const prices = await agent.getTokenPrices();
const ckBtcPrice = prices.find(p => p.token === 'ckBTC').price;
```

### After (v1.1.0)
```javascript
const tokens = await agent.getAvailableTokens();
const price = await agent.getTokenPrice('ckBTC');
```

---

## ✅ Tested With

- ✅ Build successful (Vite)
- ✅ ESM and CJS bundles generated
- ✅ No linter errors
- ✅ Methods exported correctly in dist files
- ✅ Backward compatible with v1.0.0

---

## 🎯 Why This Release?

These helper methods were added specifically to support **pybara-ic-checkout**, the universal checkout UI component. They make it much easier to:

1. Build token pickers with real-time data
2. Display user balances
3. Validate order amounts against minimums
4. Show live price conversions

**Result:** Simpler integration, less boilerplate, cleaner code.

---

## 📦 Installation

```bash
npm install @pybara/ic-protocol@1.1.0
```

Or update your package.json:

```json
{
  "dependencies": {
    "@pybara/ic-protocol": "^1.1.0"
  }
}
```

---

## 🔗 Links

- [README](README.md) - Full API documentation
- [HELPER_METHODS.md](docs/HELPER_METHODS.md) - Complete guide with examples
- [STATUS.md](STATUS.md) - Current status and milestones
- [GitHub Issues](https://github.com/pybara/pybara-ic-protocol/issues) - Report bugs

---

## 🙏 Acknowledgments

Special thanks to the Pybara team for identifying the need for these convenience methods while building ic-checkout.

---

**Built with 🦫 by Pybara**

