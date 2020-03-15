import {expect} from "chai";
import {wait} from "../src/retry-promise";
import {timeout} from "../src/timeout";
import {expectError} from "./retry-promise.test";

describe("Timeout", () => {

    it("can timeout", async () => {

        const promise = timeout(1, () => wait(10));

        const error = await expectError(promise);

        expect(error.message).to.eq("Timeout after 1ms");

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
        const error = await expectError(promise);

        expect(error.message).to.contain("Timeout");
        expect(events).to.deep.eq(["done false", "failed", "done true"]);

    });
});
