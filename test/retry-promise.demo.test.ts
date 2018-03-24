import {expect} from "chai";
import "mocha";
import {customizeRetry, defaultRetryConfig, retry, wait} from "../src/retry-promise";
import {expectError} from "./retry-promise.test";

describe("Retry Promise Demo", () => {

    it("will retry until no exception or limit reached", async () => {

        await retry(async () => {
            const title = await browser.$("h1");
            expect(title).to.eq("Loaded");
        });

    });

    it("can return a result", async () => {

        const pageTitle = await retry(async () => {
            const title = await browser.$("h1");
            expect(title).to.be.not.empty;
            return title;
        });

        // do some stuff with the result
        expect(pageTitle).to.eq("Loaded");
    });

    it("can be configured and has defaults", async () => {

        await retry(async () => {
            // your code
        }, {
            // increase delay with every retry
            // possible values: "FIXED" | "EXPONENTIAL" | "LINEAR" | ((attempt: number, delay: number) => number)
            backoff: "FIXED",
            // wait time between retries
            delay: 100,
            // log events
            logger: (message) => undefined,
            // number of retry attempts
            retries: 10,
            // overall timeout
            timeout: 60 * 1000,
            // check the result
            until: () => true,
        });

    });

    it("will retry until condition is met or limit reached", async () => {

        await retry(
            () => browser.$$("ul"),
            {until: (list) => list.length === 2});

    });

    it("can have a timeout", async () => {

        const promise = retry(
            () => wait(100),
            {timeout: 10},
        );

        const error = await expectError(promise);
        expect(error.message).to.contain("Timeout");
    });

    it("can create a customized retry", async () => {
        const impatientRetry = customizeRetry({timeout: 5});

        const error = await expectError(impatientRetry(async () => wait(10)));

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

});

const browser = {
    async $(cssSelector: string): Promise<string> {
        return "Loaded";
    },
    async $$(cssSelector: string): Promise<string[]> {
        return ["Loaded", "Loaded"];
    },
};
