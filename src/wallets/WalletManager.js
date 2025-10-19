/**
 * Wallet Manager
 * 
 * Orchestrates multiple wallet adapters and provides a unified interface
 * for connecting, transferring, and managing wallet state.
 */

export class WalletManager {
    constructor() {
        this.wallets = new Map();
        this.activeWallet = null;
        this.listeners = new Map();
    }

    /**
     * Register a wallet adapter
     * @param {WalletAdapter} adapter - Wallet adapter instance
     */
    registerWallet(adapter) {
        if (!adapter.type) {
            throw new Error('Wallet adapter must have a type');
        }
        
        this.wallets.set(adapter.type, adapter);
        console.log(`✅ Registered wallet: ${adapter.name} (${adapter.type})`);
    }

    /**
     * Get all registered wallets
     * @returns {Array<WalletAdapter>}
     */
    getAllWallets() {
        return Array.from(this.wallets.values());
    }

    /**
     * Get all available (installed) wallets
     * @returns {Array<WalletAdapter>}
     */
    getAvailableWallets() {
        return this.getAllWallets().filter(wallet => wallet.isAvailable());
    }

    /**
     * Get wallet info for UI
     * @returns {Array<Object>}
     */
    getWalletsInfo() {
        return this.getAllWallets().map(wallet => wallet.getInfo());
    }

    /**
     * Get specific wallet by type
     * @param {string} type - Wallet type ('oisy', 'plug', etc)
     * @returns {WalletAdapter|null}
     */
    getWallet(type) {
        return this.wallets.get(type) || null;
    }

    /**
     * Set custom icons for wallets
     * @param {Object} icons - Map of wallet type to icon URL/emoji
     * @example setWalletIcons({ oisy: '/assets/oisy.svg', plug: '/assets/plug.svg' })
     */
    setWalletIcons(icons) {
        for (const [walletType, iconUrl] of Object.entries(icons)) {
            const wallet = this.getWallet(walletType);
            if (wallet) {
                wallet.icon = iconUrl;
                console.log(`✅ Updated ${wallet.name} icon: ${iconUrl}`);
            }
        }
    }

    /**
     * Get currently active wallet
     * @returns {WalletAdapter|null}
     */
    getActiveWallet() {
        return this.activeWallet;
    }

    /**
     * Connect to a specific wallet
     * @param {string} type - Wallet type
     * @returns {Promise<string>} Principal ID
     * @throws {Error} If wallet not found, unavailable, or connection fails
     */
    async connect(type) {
        const wallet = this.getWallet(type);
        
        if (!wallet) {
            throw new Error(`Wallet not found: ${type}`);
        }
        
        if (!wallet.isAvailable()) {
            throw new Error(`${wallet.name} is not installed. Get it at: ${wallet.website}`);
        }
        
        try {
            const principal = await wallet.connect();
            this.activeWallet = wallet;
            
            this.emit('connected', { wallet: wallet.type, principal });
            
            return principal;
            
        } catch (error) {
            console.error(`❌ Failed to connect to ${wallet.name}:`, error);
            this.emit('error', { wallet: wallet.type, error });
            throw error;
        }
    }

    /**
     * Disconnect from active wallet
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (!this.activeWallet) {
            console.warn('⚠️ No wallet connected');
            return;
        }

        const walletName = this.activeWallet.name;
        console.log(`🔌 Disconnecting from ${walletName}...`);
        
        try {
            await this.activeWallet.disconnect();
            const walletType = this.activeWallet.type;
            this.activeWallet = null;
            
            console.log(`✅ Disconnected from ${walletName}`);
            this.emit('disconnected', { wallet: walletType });
            
        } catch (error) {
            console.error(`❌ Failed to disconnect from ${walletName}:`, error);
            throw error;
        }
    }

    /**
     * Execute transfer using active wallet
     * @param {Object} params - Transfer parameters
     * @returns {Promise<number>} Block index
     * @throws {Error} If no wallet connected or transfer fails
     */
    async transfer(params) {
        if (!this.activeWallet) {
            throw new Error('No wallet connected');
        }
        
        try {
            const blockIndex = await this.activeWallet.transfer(params);
            
            this.emit('transfer', { 
                wallet: this.activeWallet.type, 
                blockIndex,
                params 
            });
            
            return blockIndex;
            
        } catch (error) {
            console.error(`❌ Transfer failed:`, error);
            this.emit('error', { 
                wallet: this.activeWallet.type, 
                error,
                action: 'transfer'
            });
            throw error;
        }
    }

    /**
     * Get balance using active wallet
     * @param {string} ledgerCanisterId
     * @param {string} token
     * @returns {Promise<bigint>}
     */
    async getBalance(ledgerCanisterId, token) {
        if (!this.activeWallet) {
            throw new Error('No wallet connected');
        }

        return await this.activeWallet.getBalance(ledgerCanisterId, token);
    }

    /**
     * Get current principal
     * @returns {string|null}
     */
    getPrincipal() {
        return this.activeWallet?.getPrincipal() || null;
    }

    /**
     * Check if any wallet is connected
     * @returns {boolean}
     */
    isConnected() {
        return this.activeWallet?.isConnected() || false;
    }

    /**
     * Get active wallet type
     * @returns {string|null}
     */
    getActiveWalletType() {
        return this.activeWallet?.type || null;
    }

    /**
     * Event listener management
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${event} listener:`, error);
            }
        });
    }
}

