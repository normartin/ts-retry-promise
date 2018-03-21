import {expect} from "chai";
import "mocha";
import {retry} from "ts-retry-promise";
import {PromiseCache} from "../src/promise-cache";

describe("Promise Cache", () => {

    it("can use", async () => {
        const cache = new PromiseCache<string>((key) => Promise.resolve(key));

        const value = await cache.get("key");
        expect(value).to.eq("key");

        const value2 = await cache.get("key2");
        expect(value2).to.eq("key2");
    });

    it("config demo", async () => {
        const cache = new PromiseCache<string>(
            () => Promise.resolve("value"),
            {
                checkInterval: 30000,
                onReject: (error: Error,
                           key: string,
                           loader: (key: string) => Promise<string>) => Promise.reject(error),
                ttl: -1,
            },
        );

        const value = await cache.get("key");

        expect(value).to.eq("value");
    });

    it("can cache", async () => {
        const loader = new TestLoader("value", 5);
        const cache = new PromiseCache<string>(() => loader.load());

        const firstRequest = cache.get("key");
        const secondRequest = cache.get("key");

        await Promise.all([firstRequest, secondRequest]);

        expect(loader.timesLoaded).to.eq(1);
        expectStats(cache, {hits: 1, misses: 1, entries: 1, failLoads: 0});
    });

    it("should cleanup after ttl", async () => {
        const loader = new TestLoader("value");
        const cache = new PromiseCache<string>(() => loader.load(), {ttl: 5, checkInterval: 2});

        await cache.get("key");

        await wait(10);

        await cache.get("key");

        expect(loader.timesLoaded).to.eq(2);
        expectStats(cache, {hits: 0, misses: 2, entries: 1, failLoads: 0});
    });

    it("should not remove entry before ttl", async () => {
        const loader = new TestLoader("value");
        const cache = new PromiseCache<string>(() => loader.load(), {ttl: 10, checkInterval: 2});

        await cache.get("key");

        await wait(5);

        await cache.get("key");

        expect(loader.timesLoaded).to.eq(1);
        expectStats(cache, {hits: 1, misses: 1, entries: 1, failLoads: 0});
    });

    it("should not cleanup if checkInterval is NEVER", async () => {
        const loader = new TestLoader("value");
        const cache = new PromiseCache<string>(() => loader.load(), {ttl: 5, checkInterval: "NEVER"});

        await cache.get("key");

        await wait(10);

        await cache.get("key");

        expect(loader.timesLoaded).to.eq(1);
    });

    it("returns rejected promise", async () => {
        const cache = new PromiseCache<string>(() => Promise.reject(Error("Expected")));

        const promise = cache.get("key");

        const error = await expectError(promise);
        expect(error.message).to.eq("Expected");

        expectStats(cache, {hits: 0, misses: 1, entries: 0, failLoads: 1});
    });

    it("removes rejected promises by default", async () => {
        const cache = new PromiseCache<string>(failsOneTime("value"));

        await expectError(cache.get("key"));

        expect(await cache.get("key")).to.eq("value");
    });

    it("can keep rejected promise", async () => {
        let calls = 0;
        const cache = new PromiseCache<string>(() => {
            calls += 1;
            return Promise.reject(Error("Expected"));
        }, {removeRejected: false});

        await expectError(cache.get("key"));

        const error = await expectError(cache.get("key"));
        expect(error.message).to.eq("Expected");

        expect(calls).to.eq(1);

        expectStats(cache, {hits: 1, misses: 1, entries: 1, failLoads: 1});
    });

    it("can use failure handler", async () => {
        const cache = new PromiseCache<string>(allaysFails,
            {onReject: () => Promise.resolve("fallback")},
        );

        const promise = cache.get("key");

        expect(await promise).to.eq("fallback");
    });

    it("failure handler puts result in cache if removeRejected:false", async () => {
        let calls = 0;
        const cache = new PromiseCache<string>(async () => {
                calls += 1;
                throw Error("failed to load");
            },
            {onReject: () => Promise.resolve("fallback"), removeRejected: false},
        );

        const values = await Promise.all([cache.get("key"), cache.get("key")]);

        expect(values).to.deep.eq(["fallback", "fallback"]);
        expect(calls).to.eq(1);
    });

    it("calls failure handler only once", async () => {
        let onRejectCalled = 0;
        const cache = new PromiseCache<string>(failsOneTime("value"), {
                checkInterval: 5,
                onReject: () => {
                    onRejectCalled += 1;
                    return Promise.resolve("fallback");
                },
                ttl: 2,
            },
        );

        expect(await cache.get("key")).to.eq("fallback");
        await wait(10);
        expect(await cache.get("key")).to.eq("value");

        expect(onRejectCalled).to.eq(1);
    });

    it("should call onRemove callback", async () => {
        let removeKey: string;
        let removeValue: Promise<string>;

        const cache = new PromiseCache<string>(() => Promise.resolve("value"),
            {
                checkInterval: 2,
                onRemove: (key, value) => {
                    removeKey = key;
                    removeValue = value;
                },
                ttl: 5,
            });

        await cache.get("key");

        await wait(10);

        expect(removeKey).to.eq("key");
        expect(await removeValue).to.eq("value");
    });

    it("onRemove callback should not prevent cleanup of other entries", async () => {
        const keysLoaded: string[] = [];
        const loader = (key) => {
            keysLoaded.push(key);
            return Promise.resolve("value");
        };

        const onRemove = (key) => {
            if (key === "fail") {
                throw Error("onRemove");
            }
        };

        const cache = new PromiseCache<string>(loader, {checkInterval: 2, onRemove, ttl: 1});

        await cache.get("fail");
        await cache.get("noFail");

        await wait(10);

        // load again
        await cache.get("noFail");

        expect(keysLoaded).to.deep.eq(["fail", "noFail", "noFail"]);
    });

    it("can use ts-retry-config", async () => {
        const loader = failsOneTime("value");
        const cache = new PromiseCache<string>(() => retry(loader));
        expect(await cache.get("key")).to.eq("value");
    });

});

class TestLoader<T> {

    public timesLoaded = 0;

    constructor(private elem: T, private delay: number = 0) {

    }

    public async load(): Promise<T> {
        await wait(this.delay);
        this.timesLoaded += 1;
        return this.elem;
    }
}

export async function wait(ms: number): Promise<void> {
    if (ms === 0) {
        return Promise.resolve();
    }
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function expectError<T>(p: Promise<T>): Promise<Error> {
    let result: T;
    try {
        result = await p;
    } catch (error) {
        return error;
    }
    throw Error("Expected error, but got " + result);
}

const allaysFails = () => Promise.reject(Error("Expected"));

function failsOneTime<T>(value: T): () => Promise<T> {
    let failed = false;
    return () => {
        if (failed) {
            return Promise.resolve(value);
        } else {
            failed = true;
            return Promise.reject(Error("failing for first time"));
        }
    };
}

function expectStats<T>(cache: PromiseCache<T>,
                        values: { misses: number, hits: number, failLoads: number, entries: number }) {
    const stats = cache.statistics();
    expect(stats.misses).to.eq(values.misses, "misses");
    expect(stats.hits).to.eq(values.hits, "hits");
    expect(stats.failedLoads).to.eq(values.failLoads, "failed loads");
    expect(stats.entries).to.eq(values.entries, "entries");
}
