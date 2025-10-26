# Pybara SDK v2.0.0 - Complete Refactor (Breaking Changes)

**Release Date:** October 25, 2025  
**Version:** 2.0.0  
**Type:** BREAKING CHANGES - Complete refactor for clarity

---

## 🔥 **Why v2.0.0?**

We removed ALL backwards compatibility and confusing legacy names. Everything is now **crystal clear** before production launch.

**Philosophy:** Clear code now = No regrets in production

---

## ⚠️ **BREAKING CHANGES**

### Old Functions REMOVED (No Aliases)

| ❌ Removed | ✅ Use Instead |
|-----------|---------------|
| `executePayment()` | `sendCustomerPaymentToPybaraCore()` |
| `initPayment()` | `createPaymentRecord()` |
| `recordPayment()` | `verifyAndRecordCustomerPayment()` |
| `confirmPayment()` | `executePayoutToMerchant()` |

**No @deprecated aliases. Clean break.**

---

## 📝 **New Function Names (Final)**

### 1. `sendCustomerPaymentToPybaraCore(amountE8s, pybaraCorePrincipal, token)`
**What it does:** Customer wallet → Pybara Core (payment gateway)  
**Log:** `💳 Customer paying: 0.00007347 ckBTC to Pybara Core...`  
**Returns:** `{ blockIndex }`

```javascript
const result = await gateway.sendCustomerPaymentToPybaraCore(
    BigInt(7347),
    'zvgwv-zyaaa-aaaac-qchaq-cai',
    'ckBTC'
);
// result.blockIndex = 3210555
```

---

### 2. `createPaymentRecord(params)`
**What it does:** Creates database entry with status "pending"  
**Log:** `✅ Payment record created in database`  
**Returns:** `{ payment_id, expected_amount, price_usd }`

```javascript
const result = await gateway.createPaymentRecord({
    orderId: 360,
    siteUrl: 'https://mystore.com',
    siteName: 'My Store',
    platform: 'woocommerce',
    usdAmount: 8.14,
    token: 'ckBTC',
    merchantPrincipal: 'dc5fu-...',
    userPrincipal: 'wqhzg-...',
    wallet: 'Oisy'
});
// result.payment_id = 79
```

---

### 3. `verifyAndRecordCustomerPayment(paymentId, orderId, siteUrl, merchantPrincipal, txId, receivedAmount)`
**What it does:** Verifies block exists on-chain, tokens in Pybara Core  
**Log:** `🔍 Verifying customer payment on blockchain...`  
**Returns:** `{ tx_id, verified, payment_id }`

```javascript
const result = await gateway.verifyAndRecordCustomerPayment(
    79,                    // payment_id
    360,                   // order_id
    'https://mystore.com', // site_url
    'dc5fu-...',          // merchant_principal
    3210555,              // block_index
    BigInt(7347)          // expected_amount
);
// result.verified = true
```

---

### 4. `executePayoutToMerchant(paymentId, orderId, siteUrl, merchantPrincipalText)`
**What it does:** Pybara Core → Merchant (99%) + Platform (1%)  
**Log:** `💸 Pybara Core executing payout: 99% to merchant, 1% platform fee`  
**Returns:** `{ merchant_tx_id, platform_tx_id }`

```javascript
const result = await gateway.executePayoutToMerchant(
    79,                    // payment_id
    360,                   // order_id
    'https://mystore.com', // site_url
    'dc5fu-...'           // merchant_principal
);
// result.merchant_tx_id = 3210556
// result.platform_tx_id = 3210557
```

---

## 📊 **Complete Payment Flow**

```javascript
// 1. Calculate amount
const calc = await gateway.calculateAmount(8.14, 'ckBTC');
// calc.expected_amount = '7347'

// 2. Customer pays Pybara Core
const transfer = await gateway.sendCustomerPaymentToPybaraCore(
    BigInt(calc.expected_amount),
    pybaraCoreId,
    'ckBTC'
);
// transfer.blockIndex = 3210555

// 3. Create payment record
const payment = await gateway.createPaymentRecord({
    orderId: 360,
    usdAmount: 8.14,
    token: 'ckBTC',
    // ... other params
});
// payment.payment_id = 79
// Status: "pending"

// 4. Verify customer payment
const verify = await gateway.verifyAndRecordCustomerPayment(
    payment.payment_id,
    orderId,
    siteUrl,
    merchantPrincipal,
    transfer.blockIndex,
    BigInt(calc.expected_amount)
);
// verify.verified = true
// Status: "recorded"

// 5. Execute payout
const payout = await gateway.executePayoutToMerchant(
    payment.payment_id,
    orderId,
    siteUrl,
    merchantPrincipal
);
// payout.merchant_tx_id = 3210556
// payout.platform_tx_id = 3210557
// Status: "confirmed"
```

---

## 📝 **Log Output (Debug Mode)**

```
💳 Customer paying: 0.00007347 ckBTC to Pybara Core zvgwv-zyaaa-aaaac-qchaq-cai
✅ Customer payment sent to Pybara Core (Block: 3210555)

✅ Payment record created in database
   Payment ID: 79
   Status: pending
   Expected amount: 7347
   Price used: 111228.006297426

🔍 Verifying customer payment on blockchain (Block: 3210555)...
   Payment ID: 79
   Expected amount: 7347
✅ Customer payment verified on blockchain
   Tokens confirmed in Pybara Core
   Payment status: recorded

💸 Pybara Core executing payout: 99% to merchant, 1% platform fee
   Payment ID: 79
   Merchant: dc5fu-5fpyx-kcfoo-75kgp-gsoeg-zpwac-kvhez-pmo3x-4scel-bv5y6-xae
✅ Merchant payout complete (Block: 3210556)
✅ Platform fee complete (Block: 3210557)
✅ Payment flow complete
```

---

## 🚀 **Migration Guide**

### Step 1: Update SDK
```bash
npm install @yogabuild/pybara-sdk@2.0.0
```

### Step 2: Find & Replace
```javascript
// OLD → NEW
executePayment → sendCustomerPaymentToPybaraCore
initPayment → createPaymentRecord
recordPayment → verifyAndRecordCustomerPayment
confirmPayment → executePayoutToMerchant
```

### Step 3: Update Flow
Add the verification step between create and payout:

```javascript
// OLD (missing verification):
const payment = await gateway.initPayment({...});
await gateway.confirmPayment(payment.payment_id, ...);

// NEW (explicit verification):
const payment = await gateway.createPaymentRecord({...});
await gateway.verifyAndRecordCustomerPayment(payment.payment_id, ...);
await gateway.executePayoutToMerchant(payment.payment_id, ...);
```

---

## 🎯 **What's Better**

### Before (v1.x):
```javascript
// Confusing - what's being executed?
await gateway.executePayment(amount, recipient, token);

// Ambiguous - initialize what?
await gateway.initPayment(params);

// Unclear - record what where?
await gateway.recordPayment(paymentId, ...);

// Vague - confirm what?
await gateway.confirmPayment(paymentId, ...);
```

### After (v2.0):
```javascript
// Crystal clear - customer → Pybara Core
await gateway.sendCustomerPaymentToPybaraCore(amount, pybaraCore, token);

// Explicit - create database record
await gateway.createPaymentRecord(params);

// Clear - verify on-chain
await gateway.verifyAndRecordCustomerPayment(paymentId, ...);

// Precise - Pybara Core → merchant
await gateway.executePayoutToMerchant(paymentId, ...);
```

---

## ✅ **No Legacy Baggage**

- ❌ No @deprecated functions
- ❌ No backwards compatibility
- ❌ No confusing aliases
- ✅ Clean, explicit names only
- ✅ Clear logs everywhere
- ✅ Easy to understand flow

---

## 📦 **What's Included**

### SDK (v2.0.0)
- ✅ 4 renamed functions (old ones REMOVED)
- ✅ Explicit logging at every step
- ✅ Clear error messages
- ✅ Debug mode shows all details
- ✅ No confusing legacy code

### WooCommerce Plugin
- ✅ Updated to use new SDK
- ✅ All function calls updated
- ✅ Added explicit verification step
- ✅ Clear progress messages

### Documentation
- ✅ This migration guide
- ✅ NAMING_UPDATE_V1.4.0.md (historical)
- ✅ Updated README

---

## 🎓 **Learning Curve = Zero**

New developers can read the code and instantly understand:

```javascript
sendCustomerPaymentToPybaraCore()   // Customer pays Pybara Core
createPaymentRecord()               // Database entry
verifyAndRecordCustomerPayment()    // Check on-chain
executePayoutToMerchant()          // Send to merchant
```

No ambiguity. No confusion. No legacy cruft.

---

## 🔒 **Production Ready**

This is the final naming before production launch. No more refactors needed.

**Everything is crystal clear:**
- ✅ Function names explain exactly what they do
- ✅ Logs show exactly what's happening
- ✅ Errors clearly indicate where failures occur
- ✅ Flow is obvious from the code
- ✅ Zero technical debt

---

## 📞 **Support**

Questions about migration? Check:
- This document for breaking changes
- README.md for usage examples
- Debug logs for troubleshooting

---

**Version:** 2.0.0  
**Published:** October 25, 2025  
**Type:** BREAKING CHANGES  
**Backwards Compatible:** ❌ NO (intentional)  
**Production Ready:** ✅ YES
