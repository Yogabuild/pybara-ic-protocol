/**
 * Base Wallet Adapter Interface
 * 
 * All wallet implementations must extend this class and implement all methods.
 * This provides a consistent interface for the payment gateway regardless of wallet.
 */

export class WalletAdapter {
    constructor() {
        if (this.constructor === WalletAdapter) {
            throw new Error('WalletAdapter is abstract and cannot be instantiated directly');
        }
        
        // Wallet metadata (must be set by child class)
        this.type = null;        // 'oisy', 'plug', 'stoic'
        this.name = null;        // 'Oisy Wallet', 'Plug Wallet'
        this.icon = null;        // '🦦', '🔌'
        this.website = null;     // 'https://oisy.com'
        
        // Connection state
        this.principal = null;
        this.connected = false;
    }

    /**
     * Check if wallet is available (installed/accessible)
     * @returns {boolean}
     */
    isAvailable() {
        throw new Error('isAvailable() must be implemented by child class');
    }

    /**
     * Connect to wallet and request permission
     * @returns {Promise<string>} Principal ID as string
     * @throws {Error} If connection fails or user rejects
     */
    async connect() {
        throw new Error('connect() must be implemented by child class');
    }

    /**
     * Disconnect from wallet
     * @returns {Promise<void>}
     */
    async disconnect() {
        throw new Error('disconnect() must be implemented by child class');
    }

    /**
     * Execute a token transfer
     * @param {Object} params
     * @param {string} params.to - Recipient principal
     * @param {string|bigint} params.amount - Amount in smallest unit (e8s)
     * @param {string} params.ledgerCanisterId - Ledger canister ID
     * @param {string} params.token - Token symbol (ICP, ckBTC, etc)
     * @returns {Promise<number>} Block index
     * @throws {Error} If transfer fails
     */
    async transfer(params) {
        throw new Error('transfer() must be implemented by child class');
    }

    /**
     * Get balance for a specific token
     * @param {string} ledgerCanisterId - Ledger canister ID
     * @param {string} token - Token symbol
     * @returns {Promise<bigint>} Balance in smallest unit
     */
    async getBalance(ledgerCanisterId, token) {
        throw new Error('getBalance() must be implemented by child class');
    }

    /**
     * Get current principal ID
     * @returns {string|null} Principal as string, or null if not connected
     */
    getPrincipal() {
        return this.principal;
    }

    /**
     * Check if wallet is currently connected
     * @returns {boolean}
     */
    isConnected() {
        return this.connected && this.principal !== null;
    }

    /**
     * Get wallet metadata
     * @returns {Object} Wallet info
     */
    getInfo() {
        return {
            type: this.type,
            name: this.name,
            icon: this.icon,
            website: this.website,
            available: this.isAvailable(),
            connected: this.isConnected()
        };
    }

    /**
     * Format error message with wallet context
     * @param {string} message - Error message
     * @returns {Error}
     */
    createError(message) {
        return new Error(`[${this.name}] ${message}`);
    }
}

