import {expect} from "chai";
import "mocha";
import {singlePromiseCache} from "../src/promise-cache";

describe("Single Promise Cache", () => {

    it("can use", async () => {
        const cache = singlePromiseCache(() => Promise.resolve("value"));

        const value = await cache();
        expect(value).to.eq("value");
    });

    it("should cache", async () => {
        const loader = new TestLoader("value", 10);

        const cache = singlePromiseCache(() => loader.load());

        const [v1, v2, v3] = await Promise.all([cache(), cache(), cache()]);

        expect(v1).to.eq("value");
        expect(v2).to.eq("value");
        expect(v3).to.eq("value");

        expect(loader.timesLoaded).to.eq(1);
    });

    it("should not cache rejected promises", async () => {
        const cache = singlePromiseCache(failsOneTime("value"));

        await expectError(cache());

        expect(await cache()).to.eq("value");
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
