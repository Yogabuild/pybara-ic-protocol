# Changelog

All notable changes to this project will be documented in this file.

---

## [2.5.0] - 2025-10-29

### Added
- **Wallet Control System** - SDK now filters `enabledWallets` against `DEFAULT_ENABLED_WALLETS` at runtime
- Platform requests validated: only SDK-approved wallets enabled
- Ensures platform-agnostic consistency (WooCommerce, Shopify, etc.)

### Changed
- **NFID disabled by default** - `DEFAULT_ENABLED_WALLETS` now `['oisy', 'plug']`
- Reason: deprecated `@nfid/embed` SDK, broken II login, migration requires 20-30 hours

### Documentation
- Added "Wallet Activation & Control" section to README
- Explains double-layer system (SDK authority + platform preferences)

---

## [2.4.0] - 2025-10-28

### Fixed
- **CRITICAL: Plug Wallet ICRC-1 Support** - Plug's `requestTransfer()` is ICP-only
- Updated `PlugWalletAdapter` to use `window.ic.plug.agent` for direct ICRC-1 calls
- Now supports ckBTC, ckETH, ckUSDC, ckUSDT via `createLedgerActor()` + `icrc1_transfer()`
- Updated `getBalance()` to use ICRC-1 queries instead of `requestBalance()`

### Documentation
- Added wallet implementation details and token support table to README

---

## [2.2.0] - 2025-10-26

### Added
- **PaymentCalculator** - Platform-agnostic payment calculation utility
- Methods: `calculatePayment()`, `calculateAllTokens()`, `findBestToken()`, formatters
- Documentation in `SDK_PAYMENT_CALCULATOR.md`

### Fixed
- NFIDWalletAdapter import paths

---

## [2.1.0] - 2025-10-26

### Changed
- Flattened wallet structure, consolidated utilities to `/utils`
- Renamed: `WalletAdapter` → `BaseWalletAdapter`, `WalletManager` → `_WalletManager`
- Split `currency.js` → `currency-logic.js` + `currency-formatter.js`
- Removed duplicate `formatCurrency()` function
- Complete README rewrite

---

## [1.2.0] - 2025-10-20

### Added
- Currency conversion utilities and multi-currency formatting
- Order minimum validation across currencies

---

## [1.0.0] - 2025-10-18

### Added
- Initial stable release with core `PybaraAgent` class
- Wallet adapters: Oisy, Plug, NFID
- Payment lifecycle, balance checking, price caching
