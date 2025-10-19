/**
 * Ledger Actor Creator
 * 
 * Creates ICRC-1 ledger actors for interacting with token canisters
 */

import { Actor } from '@dfinity/agent';

/**
 * ICRC-1 Ledger Interface (simplified for transfers and balance checks)
 */
const icrc1Interface = ({ IDL }) => {
    const Subaccount = IDL.Vec(IDL.Nat8);
    const Account = IDL.Record({
        'owner': IDL.Principal,
        'subaccount': IDL.Opt(Subaccount)
    });
    
    const TransferArg = IDL.Record({
        'to': Account,
        'fee': IDL.Opt(IDL.Nat),
        'memo': IDL.Opt(IDL.Vec(IDL.Nat8)),
        'from_subaccount': IDL.Opt(Subaccount),
        'created_at_time': IDL.Opt(IDL.Nat64),
        'amount': IDL.Nat
    });
    
    const TransferError = IDL.Variant({
        'GenericError': IDL.Record({
            'message': IDL.Text,
            'error_code': IDL.Nat
        }),
        'TemporarilyUnavailable': IDL.Null,
        'BadBurn': IDL.Record({ 'min_burn_amount': IDL.Nat }),
        'Duplicate': IDL.Record({ 'duplicate_of': IDL.Nat }),
        'BadFee': IDL.Record({ 'expected_fee': IDL.Nat }),
        'CreatedInFuture': IDL.Record({ 'ledger_time': IDL.Nat64 }),
        'TooOld': IDL.Null,
        'InsufficientFunds': IDL.Record({ 'balance': IDL.Nat })
    });
    
    const TransferResult = IDL.Variant({
        'Ok': IDL.Nat,
        'Err': TransferError
    });
    
    return IDL.Service({
        'icrc1_balance_of': IDL.Func([Account], [IDL.Nat], ['query']),
        'icrc1_transfer': IDL.Func([TransferArg], [TransferResult], [])
    });
};

/**
 * Create a ledger actor for a specific canister
 * @param {string} canisterId - Ledger canister ID
 * @param {HttpAgent} agent - Authenticated agent
 * @returns {Actor} Ledger actor instance
 */
export function createLedgerActor(canisterId, agent) {
    return Actor.createActor(icrc1Interface, {
        agent,
        canisterId
    });
}

