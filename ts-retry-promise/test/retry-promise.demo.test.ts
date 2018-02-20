import {expect} from "chai";
import "mocha";
import {retry} from "../src/retry-promise";

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

    it("will retry until condition is met or limit reached", async () => {

        await retry(
            () => browser.$("ul"),
            {until: (list) => list.length === 6});

    });

    it("can be configured and has defaults", async () => {

        await retry(async () => {
            // your code
        }, {
            delay: 100, // default
            logger: (message) => undefined, // default
            retries: 10, // default
            until: () => true, // default
        });

    });
});

const browser = {
    async $(cssSelector: string): Promise<string> {
        return "Loaded";
    },
};
