# Changelog

All notable changes to this project will be documented in this file.

---

## [2.2.0] - 2025-10-26

### Added
- **PaymentCalculator** - Platform-agnostic payment calculation utility
  - `calculatePayment()` - Calculate payment for single token
  - `calculateAllTokens()` - Calculate for all supported tokens
  - `findBestToken()` - Find optimal token for user
  - `formatTokenAmount()` / `formatUSD()` - Display formatters
- Full documentation in `SDK_PAYMENT_CALCULATOR.md`

### Fixed
- NFIDWalletAdapter import paths (wrong relative path)

### Why This Matters
- WooCommerce and Shopify now share identical payment calculation logic
- No code duplication between platforms
- Single source of truth for payment math
- Platform integrations stay thin (just UI layer)

---

## [2.1.0] - 2025-10-26

### Changed
- Flattened wallet structure - removed nested folders
- Consolidated payment utilities to `/utils`
- Renamed `WalletAdapter` → `BaseWalletAdapter`
- Renamed `WalletManager` → `_WalletManager`
- Split `currency.js` → `currency-logic.js` and `currency-formatter.js`
- Removed duplicate `formatCurrency()` function
- Complete README rewrite - now accurate and minimal
- Cleaned up root documentation

---

## [1.2.0] - 2025-10-20

### Added
- Currency conversion utilities (`convertMinimumToUSD`, `convertUSDToCurrency`)
- Multi-currency formatting support
- Order minimum validation across currencies

---

## [1.0.0] - 2025-10-18

### Added
- Initial stable release
- Core `PybaraAgent` class
- Wallet adapters: Oisy, Plug, NFID
- Payment lifecycle methods
- Balance checking
- Price caching

