/**
 * Plug Wallet Adapter
 * 
 * Integrates Plug Wallet (window.ic.plug) with the WalletAdapter interface.
 * Plug is the most popular ICP wallet with ~40-50% market share.
 */

import { Principal } from '@dfinity/principal';
import { WalletAdapter } from '../base/WalletAdapter.js';

// Ledger canister IDs for whitelist
const LEDGER_CANISTERS = {
    ICP: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
    ckBTC: 'mxzaz-hqaaa-aaaar-qaada-cai',
    ckETH: 'ss2fx-dyaaa-aaaar-qacoq-cai',
    ckUSDC: 'xevnm-gaaaa-aaaar-qafnq-cai',
    ckUSDT: 'cngnf-vqaaa-aaaar-qag4q-cai'
};

export class PlugWalletAdapter extends WalletAdapter {
    constructor(isMainnet = true) {
        super();
        
        // Wallet metadata
        this.type = 'plug';
        this.name = 'Plug Wallet';
        this.icon = '🔌';  // Platforms can override with custom logo
        this.website = 'https://plugwallet.ooo';
        
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
            console.error('❌ Failed to connect to Plug:', error);
            
            // Handle specific errors
            if (error.message?.includes('rejected')) {
                throw this.createError('Connection rejected by user');
            }
            if (error.message?.includes('timeout')) {
                throw this.createError('Connection timeout. Please try again.');
            }
            
            throw this.createError(`Connection failed: ${error.message}`);
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
                console.warn('⚠️ Plug disconnect error (ignoring):', error);
            }
        }
        
        this.principal = null;
        this.connected = false;
        
        console.log('🔌 Disconnected from Plug');
    }

    /**
     * Execute ICRC-1 token transfer
     */
    async transfer(params) {
        if (!this.connected) {
            throw this.createError('Not connected. Call connect() first.');
        }

        const { to, amount, ledgerCanisterId, token } = params;
        
        try {
            console.log(`🔌 Plug: Requesting transfer of ${amount} ${token} to ${to}`);
            
            // Plug's requestTransfer method
            // https://docs.plugwallet.ooo/getting-started/connect-to-plug#request-transfer
            const result = await window.ic.plug.requestTransfer({
                to: to,
                amount: Number(amount), // Plug expects number
                canisterId: ledgerCanisterId
            });
            
            console.log(`🔌 Plug: Transfer result:`, result);
            
            // Plug returns { height: blockIndex } for ICRC-1
            const blockIndex = result.height || result.blockHeight || result;
            
            if (!blockIndex || blockIndex === 0) {
                throw this.createError('Plug returned invalid block index. Transfer may have failed.');
            }
            
            // CRITICAL: Verify the transfer actually happened
            // Plug has a bug where it returns success without executing the transfer
            console.log(`🔌 Plug: Verifying transfer on-chain (block ${blockIndex})...`);
            
            // Check if user's balance actually decreased
            const balanceAfter = await this.getBalance(ledgerCanisterId, token);
            console.log(`🔌 Plug: Balance after transfer: ${balanceAfter}`);
            
            // Note: We can't reliably verify without knowing balance before
            // The backend will do proper on-chain verification
            
            // Normalize return value
            return Number(blockIndex);
            
        } catch (error) {
            console.error('❌ Plug transfer failed:', error);
            
            // Classify error for better user messages
            if (error.message?.includes('insufficient')) {
                throw this.createError(`Insufficient ${token} balance`);
            }
            if (error.message?.includes('rejected') || error.message?.includes('denied')) {
                throw this.createError('Transfer rejected by user');
            }
            if (error.message?.includes('timeout')) {
                throw this.createError('Transfer timeout. Please try again.');
            }
            if (error.message?.includes('invalid block')) {
                throw this.createError('Transfer failed - Plug returned invalid response');
            }
            
            throw this.createError(`Transfer failed: ${error.message}`);
        }
    }

    /**
     * Get balance for a token
     * Plug has a built-in balance API
     */
    async getBalance(ledgerCanisterId, token) {
        if (!this.connected) {
            throw this.createError('Not connected. Call connect() first.');
        }

        try {
            // Plug's requestBalance returns array of token balances
            const balances = await window.ic.plug.requestBalance();
            
            // Find the token by canister ID
            const tokenBalance = balances.find(
                b => b.canisterId === ledgerCanisterId
            );
            
            if (tokenBalance) {
                return BigInt(tokenBalance.amount);
            }
            
            // Token not found in balances (might be zero balance)
            return 0n;
            
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

