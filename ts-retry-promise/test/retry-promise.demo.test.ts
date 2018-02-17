import "mocha";
import {retry} from "../src/retry-promise";
import {expect} from "chai";

describe("Retry Promise Demo", () => {

    it("will retry until no exception or limit reached", async () => {

        await retry(async () => {
            const title = await browser.$("h1");
            expect(title).to.eq("Loaded");
        });

    });

    it("can return a result", async () => {

        const title = await retry(async () => {
            const title = await browser.$("h1");
            expect(title).to.be.not.empty;
            return title;
        });

        // do some stuff with the result
        expect(title).to.eq("Loaded");
    });

    it("will retry until condition is met or limit reached", async () => {

        await retry(
            () => browser.$("ul"),
            {until: list => list.length === 6});

    });

    it("can be configured and has defaults", async () => {

        await retry(async () => {
            // your code
        }, {
            retries: 10, // default
            delay: 100, // default
            until: () => true // default
        });

    });
});

const browser = {
    $: async function (cssSelector: string): Promise<string> {
        return "Loaded";
    }
};
