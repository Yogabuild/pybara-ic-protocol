# Helper Methods Guide

**Added in v1.1.0 (October 19, 2025)**

Four new helper methods to simplify building checkout UIs and token pickers.

---

## Overview

These methods wrap existing canister calls with a cleaner, more intuitive API:

| Method | Purpose | Requires Wallet |
|--------|---------|-----------------|
| `getAvailableTokens()` | Get list of supported tokens | ❌ No |
| `getBalance(token)` | Query user's balance | ✅ Yes |
| `getTokenPrice(token)` | Fetch current price | ❌ No |
| `getMinimumAmount(token)` | Get minimum order amount | ❌ No |

---

## Usage Examples

### 1. Get Available Tokens

```javascript
import { PybaraAgent } from '@pybara/ic-protocol';

const agent = new PybaraAgent({
  canisterId: 'zvgwv-zyaaa-aaaac-qchaq-cai',
  host: 'https://ic0.app'
});

// Get list of supported tokens
const tokens = await agent.getAvailableTokens();
console.log(tokens);
// ['ICP', 'ckBTC', 'ckETH', 'ckUSDC', 'ckUSDT']
```

**Use Case**: Build token picker UI

---

### 2. Get User Balance

```javascript
// Connect wallet first
await agent.connectWallet('oisy');

// Get balance for a specific token
const balance = await agent.getBalance('ckBTC');
console.log(balance);
// {
//   raw: 50000000n,           // Raw balance in smallest units
//   formatted: '0.50000000 ckBTC'  // Human-readable
// }
```

**Use Case**: Show user's balance in token picker

---

### 3. Get Token Price

```javascript
// Fetch current price
const price = await agent.getTokenPrice('ckBTC', 'USD');
console.log(price);
// 98234.56

// Calculate order total in tokens
const usdAmount = 49.99;
const tokenAmount = usdAmount / price;
console.log(`${usdAmount} USD = ${tokenAmount} ckBTC`);
```

**Use Case**: Show real-time price conversions

---

### 4. Get Minimum Order Amount

```javascript
// Get minimum for a token
const minimum = await agent.getMinimumAmount('ckBTC', 'USD');
console.log(minimum);
// {
//   usd: 5.00,                      // Minimum in USD
//   token: '0.00005090 ckBTC'       // Minimum in token units
// }

// Validate order amount
const orderAmount = 3.50;
if (orderAmount < minimum.usd) {
  console.warn(`Order amount too low. Minimum: $${minimum.usd}`);
}
```

**Use Case**: Validate order amounts, show minimums in UI

---

## Complete Example: Token Picker

```javascript
import { PybaraAgent } from '@pybara/ic-protocol';

async function buildTokenPicker() {
  const agent = new PybaraAgent({
    canisterId: 'zvgwv-zyaaa-aaaac-qchaq-cai',
    host: 'https://ic0.app'
  });

  // Step 1: Connect wallet
  await agent.connectWallet('oisy');

  // Step 2: Get available tokens
  const tokens = await agent.getAvailableTokens();

  // Step 3: Fetch data for each token (parallel)
  const tokenData = await Promise.all(
    tokens.map(async (token) => {
      const [balance, price, minimum] = await Promise.all([
        agent.getBalance(token),
        agent.getTokenPrice(token),
        agent.getMinimumAmount(token)
      ]);

      return {
        symbol: token,
        balance: balance.formatted,
        price: `$${price.toFixed(2)}`,
        minimum: `$${minimum.usd.toFixed(2)}`,
        hasEnough: Number(balance.raw) > 0
      };
    })
  );

  // Step 4: Render UI
  tokenData.forEach(token => {
    console.log(`
      ${token.symbol}
      Balance: ${token.balance}
      Price: ${token.price}
      Minimum: ${token.minimum}
      ${token.hasEnough ? '✅ Available' : '❌ Insufficient'}
    `);
  });
}

buildTokenPicker();
```

**Output**:
```
ICP
Balance: 10.50000000 ICP
Price: $12.34
Minimum: $5.00
✅ Available

ckBTC
Balance: 0.00050000 ckBTC
Price: $98234.56
Minimum: $5.00
✅ Available

ckETH
Balance: 0.000000000000000000 ckETH
Price: $3456.78
Minimum: $5.00
❌ Insufficient

...
```

---

## Error Handling

```javascript
try {
  // This requires a connected wallet
  const balance = await agent.getBalance('ckBTC');
  console.log(balance);
} catch (error) {
  if (error.message.includes('No wallet connected')) {
    console.error('Please connect a wallet first');
  } else {
    console.error('Failed to fetch balance:', error);
  }
}
```

---

## Performance

All methods cache their results for efficiency:

- **getAvailableTokens()**: Cached by backend (rarely changes)
- **getBalance()**: Direct ledger query (real-time)
- **getTokenPrice()**: Backend caches for 15 minutes
- **getMinimumAmount()**: Cached by backend (rarely changes)

**Tip**: Fetch balances for multiple tokens in parallel using `Promise.all()` for better performance.

---

## API Reference

### `getAvailableTokens()`

```typescript
async getAvailableTokens(): Promise<string[]>
```

**Returns**: Array of token symbols (e.g., `['ICP', 'ckBTC', 'ckETH']`)

**Throws**: Falls back to hardcoded list if canister unavailable

---

### `getBalance(token)`

```typescript
async getBalance(token: string): Promise<{
  raw: bigint,
  formatted: string
}>
```

**Parameters**:
- `token` - Token symbol (e.g., 'ckBTC')

**Returns**:
- `raw` - Balance in smallest units (e.g., `50000000n` = 0.5 ckBTC)
- `formatted` - Human-readable balance (e.g., `"0.50000000 ckBTC"`)

**Requires**: Connected wallet

**Throws**: 
- `'No wallet connected'` if no wallet connected
- Network errors if ledger query fails

---

### `getTokenPrice(token, currency)`

```typescript
async getTokenPrice(token: string, currency?: string): Promise<number>
```

**Parameters**:
- `token` - Token symbol (e.g., 'ckBTC')
- `currency` - Currency (default: 'USD', only USD supported currently)

**Returns**: Price in USD (e.g., `98234.56`)

**Throws**: 
- `'Price not available for token'` if token not found
- `'Only USD currency is currently supported'` if non-USD requested

---

### `getMinimumAmount(token, currency)`

```typescript
async getMinimumAmount(token: string, currency?: string): Promise<{
  usd: number,
  token: string
}>
```

**Parameters**:
- `token` - Token symbol (e.g., 'ckBTC')
- `currency` - Currency (default: 'USD', only USD supported currently)

**Returns**:
- `usd` - Minimum amount in USD (e.g., `5.00`)
- `token` - Minimum amount in token units (e.g., `"0.00005090 ckBTC"`)

**Throws**: 
- `'Minimum not configured for token'` if token not found
- `'Only USD currency is currently supported'` if non-USD requested

---

## Migration from v1.0.0

If you were using low-level methods before, here's how to migrate:

### Before (v1.0.0)

```javascript
// Get tokens
const config = await agent.getTokenConfig();
const tokens = config.supported_tokens;

// Get balance
const principal = agent.getPrincipal();
const ledgerId = getLedgerCanisterId('ckBTC');
const balance = await checkBalance(principal, ledgerId, true);

// Get price
const prices = await agent.getTokenPrices();
const ckBtcPrice = prices.find(p => p.token === 'ckBTC').price;

// Get minimum
const config = await agent.getTokenConfig();
const minimumE8s = config.minimums['ckBTC'];
const price = await agent.getTokenPrice('ckBTC');
const minimumUsd = (Number(minimumE8s) / 100000000) * price;
```

### After (v1.1.0+)

```javascript
// Get tokens
const tokens = await agent.getAvailableTokens();

// Get balance
const balance = await agent.getBalance('ckBTC');

// Get price
const price = await agent.getTokenPrice('ckBTC');

// Get minimum
const minimum = await agent.getMinimumAmount('ckBTC');
```

**Much cleaner!** 🎉

---

## Use Cases

### ✅ Perfect For:
- Token picker UIs
- Balance displays
- Order validation
- Price conversion displays
- Minimum amount warnings
- Checkout flows

### ❌ Not For:
- Direct ledger transfers (use `executePayment()`)
- Payment initialization (use `initPayment()`)
- Payment confirmation (use `confirmPayment()`)

---

**Built with 🦫 by Pybara**

