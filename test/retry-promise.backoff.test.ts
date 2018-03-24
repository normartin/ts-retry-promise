import {expect} from "chai";
import * as lolex from "lolex";
import {Clock} from "lolex";
import "mocha";
import {retry} from "../src/retry-promise";

describe("Backoff tests", () => {

    let mockClock: Clock;

    beforeEach(() => {
        mockClock = lolex.install();
    });

    afterEach(() => {
        mockClock.uninstall();
    });

    async function advance(ms: number) {
        await triggerPromises();
        mockClock.tick(ms);
        await triggerPromises();
    }

    it("can use FIXED backoff", async () => {
        const failer = new Failer(3);
        retry(() => failer.run(), {
            backoff: "FIXED",
            delay: 10,
        });

        await advance(10);
        expect(failer.calls).to.eq(2);

        await advance(10);
        expect(failer.calls).to.eq(3);

        await advance(10);
        expect(failer.calls).to.eq(4);
    });

    it("can use EXPONENTIAL backoff", async () => {
        const failer = new Failer(3);
        retry(() => failer.run(), {
            backoff: "EXPONENTIAL",
            delay: 10,
        });

        await advance(10);

        expect(failer.calls).to.eq(2);

        await advance(100);
        expect(failer.calls).to.eq(3);

        await advance(1000);
        expect(failer.calls).to.eq(4);
    });

    it("can use LINEAR backoff", async () => {
        const failer = new Failer(3);
        retry(() => failer.run(), {
            backoff: "LINEAR",
            delay: 10,
        });

        await advance(5);
        expect(failer.calls).to.eq(1);

        await advance(5);
        expect(failer.calls).to.eq(2);

        await advance(20);
        expect(failer.calls).to.eq(3);

        await advance(30);
        expect(failer.calls).to.eq(4);
    });

    it("max backoff is effective", async () => {
        const failer = new Failer(3);
        retry(() => failer.run(), {
            backoff: "EXPONENTIAL",
            delay: 50,
            maxBackOff: 100,
        });

        await advance(50);

        expect(failer.calls).to.eq(2);

        await advance(100);
        expect(failer.calls).to.eq(3);

        await advance(100);
        expect(failer.calls).to.eq(4);
    });

    it("max backoff has default of five minutes", async () => {

        const oneMinute = 60 * 1000;
        const fiveMinutes = 5 * oneMinute;

        const failer = new Failer(3);
        retry(() => failer.run(), {
            backoff: "EXPONENTIAL",
            delay: fiveMinutes,
            timeout: 10 * fiveMinutes,
        });

        await advance(oneMinute);
        expect(failer.calls).to.eq(1);

        await advance(oneMinute);
        expect(failer.calls).to.eq(1);

        await advance(oneMinute);
        expect(failer.calls).to.eq(1);

        await advance(oneMinute);
        expect(failer.calls).to.eq(1);

        await advance(oneMinute);
        expect(failer.calls).to.eq(2);

        await advance(fiveMinutes);
        expect(failer.calls).to.eq(3);

    });

    it("can use custom backoff", async () => {
        const failer = new Failer(2);
        const backOffCalls: number[] = [];
        retry(() => failer.run(), {
            backoff: (retryIndex) => {
                backOffCalls.push(retryIndex);
                return 0;
            },
            delay: 5,
        });

        await triggerPromises();
        expect(failer.calls).to.eq(1);

        await advance(10);
        expect(failer.calls).to.eq(2);

        await advance(10);
        expect(failer.calls).to.eq(3);
        expect(backOffCalls).to.deep.eq([1, 2]);
    });

});

class Failer {

    public calls: number = 0;

    constructor(private fails: number, private result: string = "Result") {

    }

    public async run(): Promise<string> {
        this.calls++;
        if (this.fails < 1) {
            return this.result;
        } else {
            this.fails--;
            throw Error("Expected fail. Fails left " + this.fails);
        }
    }
}

// workaround for using lolex with promises
// https://github.com/sinonjs/sinon/issues/738
const realSetTimeout = setTimeout;

async function triggerPromises(): Promise<void> {
    return new Promise<void>((resolve) => realSetTimeout(resolve, 0));
}
