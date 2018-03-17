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
    });

    it("should cleanup after ttl", async () => {
        const loader = new TestLoader("value");
        const cache = new PromiseCache<string>(() => loader.load(), {ttl: 5, checkInterval: 2});

        await cache.get("key");

        await wait(10);

        await cache.get("key");

        expect(loader.timesLoaded).to.eq(2);
    });

    it("should not remove entry before ttl", async () => {
        const loader = new TestLoader("value");
        const cache = new PromiseCache<string>(() => loader.load(), {ttl: 5, checkInterval: 2});

        await cache.get("key");

        await wait(5);

        await cache.get("key");

        expect(loader.timesLoaded).to.eq(1);
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
    });

    it("can use failure handler", async () => {
        const cache = new PromiseCache<string>(allaysFails,
            {onReject: () => Promise.resolve("fallback")},
        );

        const promise = cache.get("key");

        expect(await promise).to.eq("fallback");
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
