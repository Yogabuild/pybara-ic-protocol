/**
 * Plug Wallet Adapter
 * 
 * Integrates Plug Wallet (window.ic.plug) with the WalletAdapter interface.
 * Plug is the most popular ICP wallet with ~40-50% market share.
 */

import { Principal } from '@dfinity/principal';
import { WalletAdapter } from './BaseWalletAdapter.js';
import { createLedgerActor } from '../utils/ledger-actor.js';

// Ledger canister IDs for whitelist
const LEDGER_CANISTERS = {
    ICP: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
    ckBTC: 'mxzaz-hqaaa-aaaar-qaada-cai',
    ckETH: 'ss2fx-dyaaa-aaaar-qacoq-cai',
    ckUSDC: 'xevnm-gaaaa-aaaar-qafnq-cai',
    ckUSDT: 'cngnf-vqaaa-aaaar-qag4q-cai'
};

export class PlugWalletAdapter extends WalletAdapter {
    constructor(isMainnet = true, debug = false) {
        super();
        
        // Wallet metadata
        this.type = 'plug';
        this.name = 'Plug Wallet';
        this.icon = '🔌';  // Platforms can override with custom logo
        this.website = 'https://plugwallet.ooo';
        this.debug = debug;
        
        // Configuration
        this.isMainnet = isMainnet;
        this.host = isMainnet ? 'https://ic0.app' : 'http://127.0.0.1:4943';
        
        // Whitelist all our ledger canisters
        this.whitelist = Object.values(LEDGER_CANISTERS);
    }

    /**
     * Check if Plug is installed
     * Plug injects window.ic.plug when extension is installed
     */
    isAvailable() {
        return typeof window !== 'undefined' && 
               window.ic !== undefined && 
               window.ic.plug !== undefined;
    }

    /**
     * Connect to Plug wallet
     * Opens Plug's connection dialog
     */
    async connect() {
        if (!this.isAvailable()) {
            throw this.createError(
                'Plug Wallet not installed. ' +
                'Get it at: https://plugwallet.ooo'
            );
        }
        
        try {
            // Request connection with whitelist
            const connected = await window.ic.plug.requestConnect({
                whitelist: this.whitelist,
                host: this.host
            });
            
            if (!connected) {
                throw this.createError('Connection rejected by user');
            }
            
            // Get principal
            const principal = await window.ic.plug.agent.getPrincipal();
            this.principal = principal.toText();
            this.connected = true;
            
            return this.principal;
            
        } catch (error) {
            // Check if user cancelled/rejected
            const errorMsg = error.message || String(error);
            const isCancellation = !error.message || 
                                   errorMsg.includes('rejected') ||
                                   errorMsg.includes('cancelled') ||
                                   errorMsg.includes('denied') ||
                                   errorMsg === 'undefined';
            
            if (isCancellation) {
                // User rejected - don't log as error
                if (this.debug) {
                    console.log('ℹ️ Plug connection cancelled by user');
                }
                throw this.createError('Connection rejected by user');
            }
            
            // Actual error - log it
            if (this.debug) {
                console.error('❌ Failed to connect to Plug:', error);
            }
            
            if (errorMsg.includes('timeout')) {
                throw this.createError('Connection timeout. Please try again.');
            }
            
            throw this.createError(`Connection failed: ${errorMsg}`);
        }
    }

    /**
     * Disconnect from Plug wallet
     */
    async disconnect() {
        if (this.isAvailable() && this.connected) {
            try {
                await window.ic.plug.disconnect();
            } catch (error) {
                // Silent - disconnect errors are non-critical
            }
        }
        
        this.principal = null;
        this.connected = false;
    }

    /**
     * Execute ICRC-1 token transfer
     * Uses Plug's agent for direct ICRC-1 calls (requestTransfer is ICP-only)
     */
    async transfer(params) {
        if (!this.connected) {
            throw this.createError('Not connected. Call connect() first.');
        }

        const { to, amount, ledgerCanisterId, token } = params;
        
        try {
            // Get Plug's agent to make direct ICRC-1 calls
            // NOTE: requestTransfer() only works for ICP, so we use the agent directly
            const agent = window.ic.plug.agent;
            
            if (!agent) {
                throw this.createError('Plug agent not available. Please reconnect.');
            }
            
            if (this.debug) {
                console.log(`🔌 Plug: Initiating ${token} transfer via agent...`);
                console.log(`   To: ${to}`);
                console.log(`   Amount: ${amount}`);
                console.log(`   Ledger: ${ledgerCanisterId}`);
            }
            
            // Create ledger actor using Plug's agent
            const ledger = createLedgerActor(ledgerCanisterId, agent);
            
            // Build ICRC-1 transfer parameters
            const transferParams = {
                to: {
                    owner: Principal.fromText(to),
                    subaccount: [] // Empty array = default subaccount
                },
                amount: BigInt(amount),
                fee: [], // Let ledger calculate fee
                memo: [], // Optional
                from_subaccount: [], // Default subaccount
                created_at_time: [] // Let ledger timestamp
            };
            
            // Execute transfer via ICRC-1
            const result = await ledger.icrc1_transfer(transferParams);
            
            // Check result
            if (result.Err) {
                const errorType = Object.keys(result.Err)[0];
                const errorValue = result.Err[errorType];
                
                if (this.debug) {
                    console.error('❌ Plug transfer error:', errorType, errorValue);
                }
                
                // Handle specific ICRC-1 errors
                if (errorType === 'InsufficientFunds') {
                    throw this.createError(`Insufficient ${token} balance`);
                }
                if (errorType === 'BadFee') {
                    throw this.createError(`Incorrect fee. Expected: ${errorValue.expected_fee}`);
                }
                if (errorType === 'TemporarilyUnavailable') {
                    throw this.createError('Ledger temporarily unavailable. Please try again.');
                }
                
                throw this.createError(`Transfer failed: ${errorType}`);
            }
            
            const blockIndex = result.Ok;
            
            if (this.debug) {
                console.log(`✅ Plug transfer successful: Block ${blockIndex}`);
            }
            
            return Number(blockIndex);
            
        } catch (error) {
            if (this.debug) {
                console.error('❌ Plug transfer failed:', error);
            }
            
            // Classify error for better user messages
            if (error.message?.includes('InsufficientFunds') || error.message?.includes('Insufficient')) {
                throw this.createError(`Insufficient ${token} balance`);
            }
            if (error.message?.includes('rejected') || error.message?.includes('denied')) {
                throw this.createError('Transfer rejected by user');
            }
            if (error.message?.includes('timeout')) {
                throw this.createError('Transfer timeout. Please try again.');
            }
            
            throw this.createError(`Transfer failed: ${error.message}`);
        }
    }

    /**
     * Get balance for a token
     * Uses agent for direct ICRC-1 balance query
     */
    async getBalance(ledgerCanisterId, token) {
        if (!this.connected) {
            throw this.createError('Not connected. Call connect() first.');
        }

        try {
            const agent = window.ic.plug.agent;
            
            if (!agent) {
                console.warn('⚠️ Plug agent not available for balance query');
                return 0n;
            }
            
            // Create ledger actor
            const ledger = createLedgerActor(ledgerCanisterId, agent);
            
            // Query balance via ICRC-1
            const account = {
                owner: Principal.fromText(this.principal),
                subaccount: [] // Default subaccount
            };
            
            const balance = await ledger.icrc1_balance_of(account);
            
            return balance;
            
        } catch (error) {
            console.warn('⚠️ Plug balance query failed:', error);
            return 0n; // Return 0 on error (non-fatal)
        }
    }

    /**
     * Check if Plug is currently connected
     * Plug has its own isConnected method
     */
    isConnected() {
        if (!this.isAvailable()) {
            return false;
        }
        
        // Just check our connection state
        // Plug's isConnected() tries to fetch from localhost which fails on mainnet
        return this.connected;
    }

    /**
     * Get additional Plug-specific info
     */
    getPlugInfo() {
        if (!this.isAvailable()) {
            return { installed: false };
        }

        return {
            installed: true,
            connected: this.isConnected(),
            network: this.isMainnet ? 'mainnet' : 'local',
            host: this.host,
            whitelistCount: this.whitelist.length
        };
    }
}

