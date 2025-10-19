/**
 * Price Cache Manager
 * 
 * Automatically fetches and caches token prices to reduce latency during checkout.
 * Platform-agnostic version.
 */

export class PriceCache {
    constructor(agent) {
        this.agent = agent;
        this.prices = null;
        this.tokenConfig = null;
        this.lastUpdate = 0;
        this.updateInterval = null;
        this.CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
        this.debug = agent.debug || false;
    }

    /**
     * Start background price updates
     */
    start() {
        if (this.updateInterval) {
            if (this.debug) {
                console.log('⚠️ Price cache already running');
            }
            return;
        }

        if (this.debug) {
            console.log('🔄 Starting background price cache (updates every 15 minutes)');
        }
        
        // Fetch immediately
        this.update();
        
        // Then every 15 minutes
        this.updateInterval = setInterval(() => {
            this.update();
        }, this.CACHE_DURATION);
    }

    /**
     * Stop background updates
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            if (this.debug) {
                console.log('⏹️ Price cache stopped');
            }
        }
    }

    /**
     * Fetch latest prices and token config from canister
     */
    async update() {
        const timestamp = new Date().toLocaleTimeString();
        try {
            if (this.debug) {
                console.log(`💰 [${timestamp}] Fetching token prices from canister...`);
            }
            const startTime = performance.now();
            
            // Fetch both prices and config in parallel
            const [prices, tokenConfig] = await Promise.all([
                this.agent.getTokenPrices(),
                this.agent.getTokenConfig()
            ]);
            
            this.prices = prices;
            this.tokenConfig = tokenConfig;
            this.lastUpdate = Date.now();
            
            if (this.debug) {
                const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
                const priceList = prices
                    .filter(p => p && p.price !== undefined)
                    .map(p => `${p.token}: $${p.price.toFixed(2)}`)
                    .join(', ');
                
                console.log(`✅ [${timestamp}] Prices cached in ${elapsed}s`);
                if (priceList) {
                    console.log(`   ${priceList}`);
                }
            }
            
        } catch (error) {
            console.error(`❌ [${timestamp}] Failed to update price cache:`, error);
            // Keep old cache if update fails
        }
    }

    /**
     * Get cached prices (instant)
     */
    getPrices() {
        return this.prices;
    }

    /**
     * Get cached token config (instant)
     */
    getTokenConfig() {
        return this.tokenConfig;
    }

    /**
     * Get price for specific token (instant)
     */
    getPrice(token) {
        if (!this.prices) return null;
        const priceObj = this.prices.find(p => p.token === token);
        return priceObj ? priceObj.price : null;
    }

    /**
     * Check if cache is fresh (< 15 minutes old)
     */
    isFresh() {
        return this.prices && (Date.now() - this.lastUpdate) < this.CACHE_DURATION;
    }

    /**
     * Get cache age in seconds
     */
    getAge() {
        if (!this.lastUpdate) return null;
        return Math.floor((Date.now() - this.lastUpdate) / 1000);
    }

    /**
     * Force refresh (useful for debugging)
     */
    async refresh() {
        if (this.debug) {
            console.log('🔄 Forcing price cache refresh...');
        }
        await this.update();
    }
}

/**
 * Helper: Create and start price cache for an agent
 */
export function startPriceCache(agent) {
    const cache = new PriceCache(agent);
    cache.start();
    return cache;
}

