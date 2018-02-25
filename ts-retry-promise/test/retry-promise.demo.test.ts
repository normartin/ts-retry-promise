import {expect} from "chai";
import "mocha";
import {retry, wait} from "../src/retry-promise";
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
            delay: 100, // wait time between retries
            logger: (message) => undefined, // log events
            retries: 10, // number of retry attempts
            timeout: 60 * 1000, // overall timeout
            until: () => true, // check the result
        });

    });

    it("will retry until condition is met or limit reached", async () => {

        await retry(
            () => browser.$("ul"),
            {until: (list) => list.length === 6});

    });

    it("can have a timeout", async () => {

        const promise = retry(
            () => wait(100),
            {timeout: 10},
        );

        const error = await expectError(promise);
        expect(error.message).to.contain("Timeout");
    });

});

const browser = {
    async $(cssSelector: string): Promise<string> {
        return "Loaded";
    },
};
