/**
 * NFID Wallet Adapter
 * 
 * Integrates NFID wallet for ICP payments.
 * NFID offers easy onboarding with email/Google login.
 * 
 * Features:
 * - Email-based authentication (no extension required)
 * - Google/Apple sign-in
 * - ICRC-1 token support
 * - Updated authentication endpoint (Oct 2025)
 * 
 * Note: Using @dfinity/auth-client temporarily.
 * Full slide-computer/signer migration pending (requires custom identity implementation).
 */

import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { WalletAdapter } from './BaseWalletAdapter.js';
import { getLedgerCanisterId } from '../utils/ledger-config.js';
import { createLedgerActor } from '../utils/ledger-actor.js';

export class NFIDWalletAdapter extends WalletAdapter {
    constructor(debug = false) {
        super();
        this.debug = debug;
        
        // Set wallet metadata
        this.type = 'nfid';
        this.name = 'NFID Wallet';
        this.icon = '🔐';  // Platforms can override with custom logo
        this.website = 'https://nfid.one';
        
        this.authClient = null;
        this.agent = null;
        this.identity = null;
        
        // Updated NFID authentication endpoint (Oct 2025)
        this.identityProvider = 'https://nfid.one';
        
        // Network configuration
        this.host = 'https://ic0.app';
    }

    /**
     * Check if NFID is available
     * NFID doesn't require an extension - it works via web authentication
     */
    isAvailable() {
        return true; // Always available (web-based, no extension needed)
    }

    /**
     * Connect to NFID wallet
     * Opens NFID's authentication page
     */
    async connect() {
        try {
            // Create auth client if not exists
            if (!this.authClient) {
                this.authClient = await AuthClient.create();
            }

            // Check if already authenticated
            const isAuthenticated = await this.authClient.isAuthenticated();
            
            if (isAuthenticated) {
                // Already logged in, get identity
                this.identity = this.authClient.getIdentity();
                this.principal = this.identity.getPrincipal().toText();
                this.connected = true;
                
                // Create agent with existing identity
                this.agent = await HttpAgent.create({
                    identity: this.identity,
                    host: this.host
                });
                
                if (this.debug) {
                    console.log('✅ Already connected to NFID');
                    console.log('   Principal:', this.principal);
                }
                
                return this.principal;
            }

            // Not authenticated, open NFID login
            return new Promise((resolve, reject) => {
                this.authClient.login({
                    identityProvider: this.identityProvider,
                    maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
                    onSuccess: async () => {
                        try {
                            // Get identity after successful login
                            this.identity = this.authClient.getIdentity();
                            this.principal = this.identity.getPrincipal().toText();
                            this.connected = true;
                            
                            // Create agent with authenticated identity
                            this.agent = await HttpAgent.create({
                                identity: this.identity,
                                host: this.host
                            });
                            
                            if (this.debug) {
                                console.log('✅ Connected to NFID');
                                console.log('   Principal:', this.principal);
                            }
                            
                            resolve(this.principal);
                        } catch (error) {
                            if (this.debug) {
                                console.error('❌ Failed to initialize after NFID login:', error);
                            }
                            reject(this.createError(`Initialization failed: ${error.message}`));
                        }
                    },
                    onError: (error) => {
                        if (this.debug) {
                            console.error('❌ NFID login failed:', error);
                        }
                        reject(this.createError(`Login failed: ${error}`));
                    }
                });
            });
            
        } catch (error) {
            if (this.debug) {
                console.error('❌ Failed to connect to NFID:', error);
            }
            
            // Handle specific errors
            if (error.message?.includes('rejected')) {
                throw this.createError('Login rejected by user');
            }
            if (error.message?.includes('timeout')) {
                throw this.createError('Login timeout. Please try again.');
            }
            
            throw this.createError(`Connection failed: ${error.message}`);
        }
    }

    /**
     * Disconnect from NFID wallet
     */
    async disconnect() {
        if (this.authClient && this.connected) {
            try {
                await this.authClient.logout();
            } catch (error) {
                // Silent - logout errors are non-critical
            }
        }
        
        this.authClient = null;
        this.agent = null;
        this.identity = null;
        this.principal = null;
        this.connected = false;
    }

    /**
     * Execute ICRC-1 token transfer
     */
    async transfer(params) {
        if (!this.connected || !this.agent) {
            throw this.createError('Not connected to NFID wallet');
        }

        const { to, amount, ledgerCanisterId } = params;

        try {
            // Create ledger actor with NFID's agent
            const ledger = createLedgerActor(ledgerCanisterId, this.agent);

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

            // Execute transfer
            const result = await ledger.icrc1_transfer(transferParams);

            // Check result
            if (result.Err) {
                const errorType = Object.keys(result.Err)[0];
                const errorValue = result.Err[errorType];
                throw this.createError(`Transfer failed: ${errorType} - ${JSON.stringify(errorValue)}`);
            }

            const blockIndex = result.Ok;

            return Number(blockIndex);
            
        } catch (error) {
            if (this.debug) {
                console.error('❌ NFID transfer failed:', error);
            }
            
            // Handle specific errors
            if (error.message?.includes('InsufficientFunds')) {
                throw this.createError('Insufficient balance for transfer');
            }
            if (error.message?.includes('rejected')) {
                throw this.createError('Transfer rejected by user');
            }
            
            throw this.createError(`Transfer failed: ${error.message}`);
        }
    }

    /**
     * Get balance for a specific token
     */
    async getBalance(ledgerCanisterId, tokenSymbol) {
        if (!this.connected || !this.principal || !this.agent) {
            return 0n;
        }

        try {
            // Create ledger actor
            const ledger = createLedgerActor(ledgerCanisterId, this.agent);

            // Query balance
            const account = {
                owner: Principal.fromText(this.principal),
                subaccount: [] // Default subaccount
            };

            const balance = await ledger.icrc1_balance_of(account);

            return balance;
            
        } catch (error) {
            if (this.debug) {
                console.warn('⚠️ NFID balance query failed:', error);
            }
            return 0n; // Return 0 on error (non-fatal)
        }
    }

    /**
     * Check if NFID is currently connected
     */
    async isConnected() {
        if (!this.authClient) {
            return false;
        }
        
        try {
            return await this.authClient.isAuthenticated();
        } catch {
            return false;
        }
    }

    /**
     * Get additional NFID-specific info
     */
    getNFIDInfo() {
        return {
            walletType: 'NFID',
            description: 'Email-based ICP wallet with Google/Apple login',
            features: ['Email onboarding', 'No extension needed', 'Social login', 'Delegation auth'],
            website: 'https://nfid.one'
        };
    }
}

