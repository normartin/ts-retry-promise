import {expect} from "./index";
import {wait} from "../src/retry-promise";
import {timeout} from "../src/timeout";

describe("Timeout", () => {

    it("can timeout", async () => {

        const promise = timeout(1, () => wait(10));

        await expect(promise).to.be.rejectedWith("Timeout after 1ms");

    });

    it("can in time", async () => {

        const result = await timeout(10, async () => {
            await wait(1);
            return "1";
        });

        expect(result).to.eq("1");

    });

    it("can cancel promise", async () => {

        const events: string[] = [];

        const promise = timeout(10, async (done) => {
            events.push("done " + done());
            await wait(20);
            events.push("done " + done());
        });

        promise.catch(() => events.push("failed"));

        await wait(20);

        await expect(promise).to.be.rejectedWith("Timeout");
        expect(events).to.deep.eq(["done false", "failed", "done true"]);

    });
});
