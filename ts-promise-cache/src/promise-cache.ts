import {setInterval} from "timers";

export interface CacheConfig<T> {
    checkInterval: number | "NEVER";
    ttl: number;
    onReject: (error: Error, key: string, loader: (key: string) => Promise<T>) => Promise<T>;
}

const defaultConfig: CacheConfig<any> = {
    checkInterval: 30000,
    onReject: (error) => Promise.reject(error),
    ttl: -1,
};

class CacheEntry<T> {
    public lastAccess: number = Date.now();

    constructor(public v: T) {

    }

    public get value(): T {
        this.lastAccess = Date.now();
        return this.v;
    }
}

export class PromiseCache<T> {

    private cache: Map<string, CacheEntry<Promise<T>>> = new Map<string, CacheEntry<Promise<T>>>();
    private readonly config: CacheConfig<T>;

    constructor(private readonly loader: (key: string) => Promise<T>, c?: Partial<CacheConfig<T>>) {
        this.config = Object.assign({}, defaultConfig, c);

        if (this.config.checkInterval !== "NEVER") {
            const interval = setInterval(() => this.cleanUp(), this.config.checkInterval);
            interval.unref();
        }
    }

    public get(key: string): Promise<T> {
        const found = this.cache.get(key);

        if (!found) {
            const loaded = this.loader(key).catch((error) => {
                const fallback = this.config.onReject(error, key, this.loader);
                this.cache.set(key, new CacheEntry<Promise<T>>(fallback));
                return fallback;
            });

            const entry = new CacheEntry<Promise<T>>(loaded);
            this.cache.set(key, entry);

            return loaded;
        } else {
            return found.value;
        }
    }

    private cleanUp() {
        const now = Date.now();

        // workaround as for(const it of this.cache.entries()) does not work
        Array.from(this.cache.entries()).forEach((it) => {
            const [key, entry] = it;
            if ((entry.lastAccess + this.config.ttl) < now) {
                this.cache.delete(key);
            }
        });
    }
}
