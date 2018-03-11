import {expect} from "chai";
import "mocha";
import {customizeRetry, defaultRetryConfig, notEmpty, retry, RetryConfig, wait} from "../src/retry-promise";

describe("Retry Promise", () => {

    it("should retry correct number of times", async () => {
        const failer = new Failer(1);

        const result = await retry(() => failer.run(), {delay: 10});

        expect(result).to.eq("Result");
        expect(failer.calls).to.eq(2);
    });

    it("should fail if all retries are done", async () => {
        const failer = new Failer(2);

        await expectError(retry(() => failer.run(), {delay: 10, retries: 1}));

        expect(failer.calls).to.eq(2);
    });

    it("should not alter config", async () => {
        const failer = new Failer(1);

        const config: RetryConfig<any> = {
            retries: 3,
        };

        await retry(() => failer.run(), config);

        expect(config.retries).to.eq(3);
    });

    it("can use until function", async () => {
        let times = 0;
        const returnsNoneEmptyArrayAfter2Calls = async () => {
            times++;
            if (times === 2) {
                return ["Result"];
            } else {
                return [];
            }
        };

        const result = await retry(returnsNoneEmptyArrayAfter2Calls, {
            until: notEmpty,
        });

        expect(result).length(1);
        expect(result[0]).to.eq("Result");
    });

    it("notEmpty can handle undefined and null", async () => {
        expect(notEmpty(null)).to.be.false;
        expect(notEmpty(undefined)).to.be.false;
    });

    it("should throw on timeout", async () => {
        const error = await expectError(retry(() => wait(100), {timeout: 10}));

        expect(error.message).to.contain("Timeout");
    });

    it("error message should caontain message of last error", async () => {
        const failer = new Failer(2);

        const error = await expectError(retry(() => failer.run(), {delay: 1, retries: 1}));

        expect(error.message).to.contain("Expected fail.");
    });

    it("can create a customized retry", async () => {
        const shortRetry = customizeRetry({timeout: 5});

        const error = await expectError(shortRetry(async () => wait(10)));

        expect(error.message).to.contain("Timeout");
    });

    it("can customize default config", async () => {
        const originalTimeout = defaultRetryConfig.timeout;
        try {
            defaultRetryConfig.timeout = 1;

            const error = await expectError(retry(async () => wait(10)));

            expect(error.message).to.contain("Timeout");
        } finally {
            defaultRetryConfig.timeout = originalTimeout;
        }
    });

    it("should stop retry after timeout", async () => {
        let calls = 0;
        const error = await expectError(retry(async () => {
            calls += 1;
            await wait(5);
            throw Error();
        }, {timeout: 2, delay: 1}));

        expect(error.message).to.contain("Timeout");

        await wait(20);
        expect(calls).to.eq(1);
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

export async function expectError<T>(p: Promise<T>): Promise<Error> {
    let result: T;
    try {
        result = await p;
    } catch (error) {
        return error;
    }
    throw Error("Expected error, but got " + result);
}
