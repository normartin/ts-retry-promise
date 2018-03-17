# ts-promise-cache #

Cache for promises. 
Does not suffer from thundering herds problem (aka [cache stampede](https://en.wikipedia.org/wiki/Cache_stampede)).


```typescript
// constructor takes a loader that loads missing entries
// loader: (key: string) => Promise<T>
const cache = new PromiseCache<string>((key: string) => Promise.resolve("value"));

const value = await cache.get("key");

expect(value).to.eq("value");


// second cosntructor argument is an optional config
interface CacheConfig<T> {
    checkInterval: number | "NEVER"; // when to check for expired entries (ms)
    ttl: number; // time to live after last access
    onReject: (error: Error, key: string, loader: () => Promise<T>) => Promise<T>; // what to to with rejected promises
}

const cacheWithDeaultConfig = new PromiseCache<string>(
    (key: string) => Promise.resolve("value"),
    {
        checkInterval: 30000,
        onReject: (error: Error, key: string, loader: () => Promise<string>) => Promise.reject(error),
        ttl: -1,
    },
);

```
