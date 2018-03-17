# ts-promise-cache #

Cache for promises. 
Does not suffer from thundering herds problem (aka [cache stampede](https://en.wikipedia.org/wiki/Cache_stampede)).

## Usage ##
The constructor takes a loader that loads missing entries.

_loader: (key: string) => Promise<T>_

```typescript
const cache = new PromiseCache<string>((key: string) => Promise.resolve("value"));

const value = await cache.get("key");

expect(value).to.eq("value");
```

## Config ##
The second constructor argument is an optional config,
```typescript
interface CacheConfig<T> {
    checkInterval: number | "NEVER"; // when to check for expired entries (ms)
    ttl: number; // time to live after last access
    onReject: (error: Error, key: string, loader: () => Promise<T>) => Promise<T>; // what to do with rejected promises
}
```
that has the following defaults.
```typescript
const cacheWithDeaultConfig = new PromiseCache<string>(
    (key: string) => Promise.resolve("value"),
    {
        checkInterval: 30000,
        onReject: (error: Error, key: string, loader: () => Promise<string>) => Promise.reject(error),
        ttl: -1,
    },
);
```

## Retry ##
Retry can by implemented by using [ts-retry-promise](https://www.npmjs.com/package/ts-retry-promise)
```typescript
const loader = failsOneTime("value");
const cache = new PromiseCache<string>(() => retry(loader));
expect(await cache.get("key")).to.eq("value");
```



