import {expect} from "./index";
import {customizeRetry, defaultRetryConfig, retry, wait} from "../src/retry-promise";

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
        }, {backoff: "LINEAR", retries: 100});

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

        await expect(promise).to.be.rejectedWith("Timeout");
    });

    it("can create a customized retry", async () => {
        const impatientRetry = customizeRetry({timeout: 5});

        await expect(impatientRetry(async () => wait(10))).to.be.rejectedWith("Timeout");
    });

    it("can create another customized retry", async () => {
        const retryUntilNotEmpty = customizeRetry({until: (array: number[]) => array.length > 0});

        const result = await retryUntilNotEmpty(async () => [1, 2]);

        expect(result).to.deep.eq([1, 2]);
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

});

const browser = {
    async $(cssSelector: string): Promise<string> {
        return "Loaded";
    },
    async $$(cssSelector: string): Promise<string[]> {
        return ["Loaded", "Loaded"];
    },
};
