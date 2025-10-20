# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2025-10-20

### Added
- 🌍 `convertMinimumToUSD(minAmount, token, tokenPrice)` - Convert smallest units → USD
- 💱 `convertUSDToCurrency(usdAmount, targetCurrency, exchangeRate)` - Convert USD → any currency
- 🎨 `formatCurrency(amount, currencyCode, locale)` - Format with locale (160+ currencies via Intl)
- ✅ `checkOrderMeetsMinimum(orderTotal, minAmount, token, ...)` - Validate order totals across currencies
- 🔢 `formatTokenBalance(balance, token, maxDecimals)` - Format token balances properly
- 📐 `getTokenDecimals(token)` - Get decimal places for tokens
- 📁 New `src/utils/currency.js` module with all currency utilities
- 🌏 Direct imports available for all currency functions
- 📝 [RELEASE_NOTES_v1.2.0.md](RELEASE_NOTES_v1.2.0.md) with comprehensive examples

### Fixed
- 🐛 USD minimum display bug in WooCommerce (was showing millions)
- 🐛 Currency conversion logic strengthened for all currencies

### Changed
- 📦 Bundle size: 63.6KB ESM (was 57.8KB), 30.8KB CJS (was 29.3KB)
- 📚 Updated README with currency utilities section
- 🏗️ WooCommerce refactored to use protocol utilities

### Why
Global e-commerce readiness. These utilities enable multi-currency support for Chinese (CNY), European (EUR), and all global markets. Essential for ic-checkout standalone component and reduces duplication across platforms.

---

## [1.1.0] - 2025-10-19

### Added
- ✨ `getAvailableTokens()` - Get list of supported tokens from backend
- ✨ `getBalance(token)` - Query user balance for specific token (requires connected wallet)
- ✨ `getTokenPrice(token, currency?)` - Fetch current token price (defaults to USD)
- ✨ `getMinimumAmount(token, currency?)` - Get minimum order amount for token
- 📚 Comprehensive [HELPER_METHODS.md](docs/HELPER_METHODS.md) documentation
- 📝 [RELEASE_NOTES_v1.1.0.md](RELEASE_NOTES_v1.1.0.md) with migration guide

### Changed
- 📦 Bundle size: 57.8KB ESM (was 53KB), 29.3KB CJS (was 27KB)
- 📚 Updated README with helper methods section
- 📊 Updated STATUS.md with v1.1.0 milestones

### Why
These methods simplify building checkout UIs and token pickers by providing clean, high-level APIs for common operations. Created specifically to support pybara-ic-checkout integration.

---

## [1.0.0] - 2025-10-18

### Added
- 🎉 Initial stable release
- ✅ Core `PybaraAgent` class for IC canister communication
- ✅ Wallet adapters: Oisy, Plug, NFID
- ✅ Payment lifecycle: `initPayment()`, `recordPayment()`, `confirmPayment()`
- ✅ Balance checking for all ICRC-1 tokens
- ✅ Price caching and token configuration
- ✅ Error handling and retry logic
- ✅ TypeScript definitions
- ✅ ESM and CJS bundles
- 📚 Complete documentation

### Integrations
- ✅ WooCommerce plugin (production-ready)
- 🔄 Shopify app (in progress)

---

## [0.1.0] - 2025-10-17

### Added
- 🚧 Initial extraction from pybara-woocommerce
- ✅ Platform-agnostic codebase
- ✅ Basic wallet support
- ✅ Payment flow implementation

### Changed
- 📦 Separated from WooCommerce-specific code
- 🧹 Removed 18 files of duplicated IC code
- 🗑️ Removed 4 unused dependencies

---

**Legend:**
- ✨ New feature
- 🐛 Bug fix
- 🔄 Change
- 🗑️ Deprecated
- 💥 Breaking change
- 🔒 Security
- 📚 Documentation
- 📦 Build/package

