/**
 * Candid IDL Interface for Pybara Payment Gateway Canister
 * 
 * Defines the service interface for interacting with the backend canister
 * including payment lifecycle, price oracle, and token configuration methods.
 */

export const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({
    'err' : IDL.Text,
    'ok' : IDL.Record({ 'tx_id' : IDL.Nat, 'verified' : IDL.Bool, 'payment_id' : IDL.Nat }),
  });
  
  const ConfirmPaymentResult = IDL.Variant({
    'err' : IDL.Text,
    'ok' : IDL.Record({ 'merchant_tx' : IDL.Nat, 'platform_tx' : IDL.Nat }),
  });
  
  const Payment = IDL.Record({
    'status' : IDL.Text,
    'token' : IDL.Text,
    'merchant_tx_id' : IDL.Opt(IDL.Nat),
    'platform_tx_id' : IDL.Opt(IDL.Nat),
    'recipient' : IDL.Principal,
    'order_id' : IDL.Nat,
    'site_url' : IDL.Text,
    'usd_amount' : IDL.Float64,
    'expected_amount' : IDL.Nat,
    'merchant_amount' : IDL.Nat,
    'platform_amount' : IDL.Nat,
    'received_amount' : IDL.Opt(IDL.Nat),
  });
  
  const Result = IDL.Variant({ 'err' : IDL.Text, 'ok' : IDL.Null });
  
  // Price Oracle types
  const PaymentCalculation = IDL.Record({
    'usd_amount' : IDL.Float64,
    'token_amount' : IDL.Nat,
    'token' : IDL.Text,
    'price_used' : IDL.Float64,
    'decimals' : IDL.Nat,
  });
  
  const Result_2 = IDL.Variant({
    'err' : IDL.Text,
    'ok' : PaymentCalculation,
  });
  
  const TokenConfig = IDL.Record({
    'supported_tokens' : IDL.Vec(IDL.Text),
    'minimums' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
    'decimals' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
  });
  
  const PlatformStats = IDL.Record({
    'total_payments' : IDL.Nat,
    'confirmed_payments' : IDL.Nat,
    'total_fees_by_token' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
  });
  
  return IDL.Service({
    // Payment lifecycle methods (explicit naming)
    'create_payment_record' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Text, IDL.Text, IDL.Float64, IDL.Text, IDL.Principal, IDL.Opt(IDL.Principal), IDL.Opt(IDL.Text)],
        [
          IDL.Record({
            'status' : IDL.Text,
            'error' : IDL.Opt(IDL.Text),
            'payment_url' : IDL.Opt(IDL.Text),
            'expected_amount' : IDL.Opt(IDL.Nat),
            'price_used' : IDL.Opt(IDL.Float64),
            'payment_id' : IDL.Opt(IDL.Nat),
          }),
        ],
        [],
      ),
    'verify_and_record_customer_payment' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Nat, IDL.Text, IDL.Principal, IDL.Nat, IDL.Nat], [Result_1], []),
    'execute_payout_to_merchant' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat), IDL.Opt(IDL.Text), IDL.Opt(IDL.Principal)], [ConfirmPaymentResult], []),
    
    // Backwards compatibility aliases (deprecated)
    'init_payment' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Text, IDL.Text, IDL.Float64, IDL.Text, IDL.Principal, IDL.Opt(IDL.Principal), IDL.Opt(IDL.Text)],
        [
          IDL.Record({
            'status' : IDL.Text,
            'error' : IDL.Opt(IDL.Text),
            'payment_url' : IDL.Opt(IDL.Text),
            'expected_amount' : IDL.Opt(IDL.Nat),
            'price_used' : IDL.Opt(IDL.Float64),
            'payment_id' : IDL.Opt(IDL.Nat),
          }),
        ],
        [],
      ),
    'record_payment' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Nat, IDL.Text, IDL.Principal, IDL.Nat, IDL.Nat], [Result_1], []),
    'confirm_payment' : IDL.Func([IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat), IDL.Opt(IDL.Text), IDL.Opt(IDL.Principal)], [ConfirmPaymentResult], []),
    
    // Query methods
    'get_payment' : IDL.Func([IDL.Nat], [IDL.Opt(Payment)], ['query']),
    'get_payment_by_order' : IDL.Func([IDL.Nat, IDL.Text, IDL.Principal], [IDL.Opt(Payment)], ['query']),
    
    // Price oracle methods
    'are_prices_stale' : IDL.Func([], [IDL.Bool], ['query']),
    'get_minimum_order_amount' : IDL.Func([IDL.Text], [IDL.Nat], ['query']),
    'refund_payment' : IDL.Func([IDL.Nat, IDL.Nat, IDL.Text], [Result], []),
    
    // Price Oracle methods
    'update_prices' : IDL.Func([], [Result], []),
    'get_token_prices' : IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Float64))], ['query']),
    'get_token_price' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Float64)], ['query']),
    'calculate_payment_amount' : IDL.Func([IDL.Float64, IDL.Text], [Result_2], ['query']),
    'get_token_config' : IDL.Func([], [TokenConfig], ['query']),
    
    // Platform statistics
    'get_platform_stats' : IDL.Func([], [PlatformStats], ['query']),
  });
};

