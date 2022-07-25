import {expect} from "./index";
import {customizeRetry, defaultRetryConfig, notEmpty, retry, wait} from "../src/retry-promise";

describe("Retry Promise", () => {

    it("should retry correct number of times", async () => {
        const failer = new Failer(1);

        const result = await retry(() => failer.run(), {delay: 10});

        expect(result).to.eq("Result");
        expect(failer.calls).to.eq(2);
    });

    it("should fail if all retries are done", async () => {
        const failer = new Failer(2);

        await expect(retry(() => failer.run(), {delay: 10, retries: 1})).to.be.rejected;

        expect(failer.calls).to.eq(2);
    });

    it("should not alter config", async () => {
        const failer = new Failer(1);

        const config = {
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
        const timeoutPromise = retry(() => wait(100), {timeout: 10});

        await expect(timeoutPromise).to.be.rejectedWith("Timeout");
    });

    it("error message should contain message of last error", async () => {
        const failer = new Failer(2);

        const failedPromise = retry(() => failer.run(), {delay: 1, retries: 1});

        await expect(failedPromise).to.be.rejectedWith("Expected fail.");
    });

    it("can create a customized retry", async () => {
        const shortRetry = customizeRetry({timeout: 5});

        await expect(shortRetry(async () => wait(10))).to.be.rejectedWith("Timeout");
    });

    it("customized retry should return customizable retry", async () => {
        const customRetry = customizeRetry({timeout: 5});

        await customRetry(async () => wait(1), {delay: 1});
    });

    it("can customize default config", async () => {
        const originalTimeout = defaultRetryConfig.timeout;
        try {
            defaultRetryConfig.timeout = 1;

            await expect(retry(async () => wait(10))).to.be.rejectedWith("Timeout");
        } finally {
            defaultRetryConfig.timeout = originalTimeout;
        }
    });

    it("should stop retry after timeout", async () => {
        let calls = 0;

        const timedout = retry(async () => {
            calls += 1;
            await wait(5);
            throw Error();
        }, {timeout: 2, delay: 1});

        await expect(timedout).to.be.rejectedWith("Timeout");

        await wait(20);
        expect(calls).to.eq(1);
    });

    it("can use logger for retries", async () => {
        const failer = new Failer(1);
        const logs: string[] = [];
        await retry(async () => failer.run(),
            {
                delay: 1, logger: (msg) => logs.push(msg),
            });

        expect(failer.calls).to.eq(2);

        expect(logs).to.deep.eq(["Retry failed: Expected fail. Fails left 0"]);
    });

    it("can use logger for until", async () => {
        const logs: string[] = [];

        const result = retry(async () => "value",
            {
                delay: 1,
                logger: (msg) => logs.push(msg),
                retries: 1,
                until: (str) => str !== "value",
            });

        await expect(result).to.be.rejected;
        expect(logs).to.deep.eq(["Until condition not met by value", "Until condition not met by value"]);
    });

    it("retry a lot when retries is INFINITELY", async () => {
        const failer = new Failer(Number.MAX_SAFE_INTEGER);

        const result = retry(() => failer.run(), {delay: 0, retries: "INFINITELY", timeout: 100});

        await expect(result).to.be.rejectedWith("Timeout");
        expect(failer.calls).to.be.greaterThan(10);
    });

    it("should provide last error in case of failure", async () => {
        const error = Error("Fail");

        await expect(retry(async () => {
            throw error
        }, {retries: 1}))
            .to.be.eventually.rejected.with.property("lastError", error);
    });

    it("should stop retrying if retryIf is false", async () => {
        const failer = new Failer(1);

        const result = retry(() => failer.run(), {retryIf: () => false});

        await expect(result).to.eventually.be.rejected
        expect(failer.calls).to.eq(1);
    });

    it("should provide error to retryIf function", async () => {
        const error = Error("fail")
        let passedError: Error | undefined;

        const result = retry(() => {
            throw error
        }, {
            retryIf: e => {
                passedError = e
                return false;
            }
        });
        await expect(result).to.eventually.be.rejected;
        expect(passedError).to.eq(error);
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
