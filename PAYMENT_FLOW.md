# Pybara Payment Flow

**Current Version:** SDK v2.2.0 / Backend v2.1+

---

## 🔄 Complete Payment Flow

### Step 1: Initialize Payment
```javascript
const calculation = await gateway.createPaymentRecord(
  orderId,
  siteUrl,
  siteName,
  usdAmount,
  token,
  merchantPrincipal,
  walletPrincipal
);
```

**Returns:** Payment ID, expected token amount, price used

---

### Step 2: Customer Sends Tokens
Customer uses their wallet (Oisy, Plug, NFID, etc.) to send tokens to Pybara Core canister.

**Result:** Blockchain transaction with block index

---

### Step 3: Verify & Auto-Execute Payout
```javascript
const result = await gateway.verifyAndRecordCustomerPayment(
  paymentId,
  orderId,
  siteUrl,
  merchantPrincipal,
  blockIndex,
  receivedAmount
);
```

**What happens internally:**
1. ✅ Verifies payment on-chain
2. ✅ Records payment as "recorded"
3. ✅ **Auto-executes payout:**
   - 99% → Merchant
   - 1% → Platform fee
4. ✅ Updates status to "confirmed"

**Returns:** Transaction verified, payment complete!

---

## ⚡ Total Time

**~4-5 seconds** for complete payment:
- On-chain verification: ~2s
- Automatic payout: ~2-3s

---

## 🎯 Key Points

- **2 canister calls only** (initialize + verify)
- **Payout is automatic** - no separate call needed
- **99% merchant / 1% platform** split executed automatically
- **Payment is confirmed** when `verifyAndRecordCustomerPayment` returns

---

## 🔐 Security

- Payout is executed **internally by backend** after verification
- No public access to payout function
- Merchant receives funds **automatically and immediately**

---

**Last Updated:** October 26, 2025
