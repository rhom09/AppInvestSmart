import NodeCache from 'node-cache'

// TTL padrão de 5 minutos (300 segundos)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 })

export const cacheService = {
    get<T>(key: string): T | undefined {
        return cache.get<T>(key)
    },

    set<T>(key: string, value: T, ttl?: number): boolean {
        return cache.set(key, value, ttl ?? 300)
    },

    async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
        const cached = this.get<T>(key)
        if (cached !== undefined) {
            console.log(`[CACHE] Hit: ${key}`)
            return cached
        }

        console.log(`[CACHE] Miss: ${key}. Buscando novos dados...`)
        const value = await fetchFn()
        this.set(key, value, ttl)
        return value
    },

    del(key: string): number {
        return cache.del(key)
    },

    flush(): void {
        cache.flushAll()
    }
}
