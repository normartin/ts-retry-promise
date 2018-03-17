import {setInterval} from "timers";

export interface CacheConfig<T> {
    // how often to check for expired entries (default: "NEVER")
    checkInterval: number | "NEVER";
    // time to live after last access (default: "FOREVER")
    ttl: number | "FOREVER";
    // fallback for rejected promises (default: (error) => Promise.reject(error))
    onReject: (error: Error, key: string, loader: (key: string) => Promise<T>) => Promise<T>;
    // remove rejected promises? (default: true)
    removeRejected: boolean;
}

const defaultConfig: CacheConfig<any> = {
    checkInterval: "NEVER",
    onReject: (error) => Promise.reject(error),
    removeRejected: true,
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

        if (this.config.checkInterval !== "NEVER" && this.config.ttl !== "FOREVER") {
            const interval = setInterval(() => this.cleanUp(), this.config.checkInterval);
            interval.unref();
        }
    }

    public get(key: string): Promise<T> {
        const found = this.cache.get(key);

        if (found) {
            return found.value;
        } else {
            const loaded = this.loader(key)
                .catch((error) => this.handleReject(error, key));

            this.cache.set(key, new CacheEntry<Promise<T>>(loaded));
            return loaded;
        }
    }

    private cleanUp() {
        const now = Date.now();

        // workaround as for(const it of this.cache.entries()) does not work
        Array.from(this.cache.entries()).forEach((it) => {
            const [key, entry] = it;
            if ((entry.lastAccess + (this.config.ttl as number)) < now) {
                this.cache.delete(key);
            }
        });
    }

    private handleReject(error: Error, key: string): Promise<T> {
        const fallback = this.config.onReject(error, key, this.loader);
        if (this.config.removeRejected) {
            this.cache.delete(key);
        } else {
            this.cache.set(key, new CacheEntry<Promise<T>>(fallback));
        }
        return fallback;
    }
}
