/**
 * Oisy Wallet Adapter
 * 
 * Integrates Oisy Wallet (@dfinity/oisy-wallet-signer) with the WalletAdapter interface.
 * Oisy is a payment-native wallet with strong ICRC-1 support.
 */

import { IcrcWallet } from '@dfinity/oisy-wallet-signer/icrc-wallet';
import { Principal } from '@dfinity/principal';
import { WalletAdapter } from './BaseWalletAdapter.js';

export class OisyWalletAdapter extends WalletAdapter {
    constructor(isMainnet = true, debug = false) {
        super();
        
        // Wallet metadata
        this.type = 'oisy';
        this.name = 'Oisy Wallet';
        this.icon = '🦦';  // Platforms can override with custom logo
        this.website = 'https://oisy.com';
        
        // Configuration
        this.isMainnet = isMainnet;
        this.host = isMainnet ? 'https://ic0.app' : 'http://127.0.0.1:4943';
        this.debug = debug;
        
        // Internal state
        this.signer = null;
    }

    /**
     * Check if Oisy is available (always true for web-based wallet)
     * Oisy doesn't require installation - it opens in a popup
     */
    isAvailable() {
        // Oisy is web-based, always available
        return typeof window !== 'undefined';
    }

    /**
     * Connect to Oisy wallet
     * Opens popup for user to connect their Oisy wallet
     */
    async connect() {
        try {
            // Connect to Oisy (opens popup)
            this.signer = await IcrcWallet.connect({
                url: 'https://oisy.com/sign',
                host: this.host,
                connectionOptions: {
                    timeoutInMilliseconds: 60000, // 60 seconds
                    pollingIntervalInMilliseconds: 500
                }
            });
            
            // Get accounts from wallet (Oisy SDK pattern)
            const accounts = await this.signer.accounts();
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found in Oisy wallet');
            }
            
            // Extract principal from first account
            this.principal = accounts[0].owner;
            this.connected = true;
            
            // Disconnect popup (we reconnect for each transfer - Oisy pattern)
            await this.signer.disconnect();
            this.signer = null; // Clear signer, will reconnect for transfers
            
            return this.principal;
            
        } catch (error) {
            if (this.debug) {
                console.error('❌ Failed to connect to Oisy:', error);
            }
            
            // Handle specific errors
            if (error.message?.includes('timeout')) {
                throw this.createError('Connection timeout. Please try again.');
            }
            if (error.message?.includes('canceled') || error.message?.includes('cancelled')) {
                throw this.createError('Connection cancelled by user.');
            }
            
            throw this.createError(`Connection failed: ${error.message}`);
        }
    }

    /**
     * Disconnect from Oisy wallet
     */
    async disconnect() {
        if (this.signer) {
            try {
                await this.signer.disconnect();
            } catch (error) {
                // Silent - disconnect errors are non-critical
            }
        }
        
        this.signer = null;
        this.principal = null;
        this.connected = false;
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
            // Reconnect to Oisy for transfer (Oisy pattern - reconnect per transaction)
            this.signer = await IcrcWallet.connect({
                url: 'https://oisy.com/sign',
                host: this.host,
                connectionOptions: {
                    timeoutInMilliseconds: 60000,
                    pollingIntervalInMilliseconds: 500
                }
            });
            
            // Build ICRC-1 transfer parameters
            const transferParams = {
                to: {
                    owner: Principal.fromText(to),
                    subaccount: [] // Empty array = default subaccount
                },
                amount: BigInt(amount)
            };
            
            // Execute transfer via Oisy
            const blockIndex = await this.signer.transfer({
                params: transferParams,
                owner: this.principal,
                ledgerCanisterId: ledgerCanisterId
            });
            
            // Disconnect popup after transfer
            await this.signer.disconnect();
            this.signer = null;
            
            // Normalize return value (blockIndex can be BigInt or number)
            return Number(blockIndex);
            
        } catch (error) {
            // Cleanup signer on error
            if (this.signer) {
                try {
                    await this.signer.disconnect();
                } catch (e) {}
                this.signer = null;
            }
            
            // Classify error for better user messages
            const isCancellation = error.message?.includes('canceled') || 
                                 error.message?.includes('cancelled') ||
                                 error.message?.includes('rejected');
            
            if (isCancellation) {
                // User intentionally cancelled - this is not an error
                throw this.createError('Transfer cancelled by user');
            }
            
            if (error.message?.includes('insufficient')) {
                if (this.debug) {
                    console.error('❌ Oisy transfer failed:', error);
                }
                throw this.createError(`Insufficient ${token} balance`);
            }
            
            if (this.debug) {
                console.error('❌ Oisy transfer failed:', error);
            }
            throw this.createError(`Transfer failed: ${error.message}`);
        }
    }

    /**
     * Get balance for a token
     * Note: Oisy doesn't have a direct balance API, we'd need to query the ledger
     */
    async getBalance(ledgerCanisterId, token) {
        if (!this.signer) {
            throw this.createError('Not connected. Call connect() first.');
        }

        // TODO: Implement balance query via agent
        // For now, return 0 (balance check happens in balance-checker.js)
        return 0n;
    }

    /**
     * Get additional Oisy-specific info
     */
    getSignerInfo() {
        return {
            hasSigner: this.signer !== null,
            network: this.isMainnet ? 'mainnet' : 'local',
            host: this.host
        };
    }
}

