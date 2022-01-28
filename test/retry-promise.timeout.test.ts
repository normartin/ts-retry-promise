import {expect} from "./index";
import {retry, wait} from "../src/retry-promise";
import {install, InstalledClock} from "@sinonjs/fake-timers";

describe("Timeout tests", () => {

    let mockClock: InstalledClock;

    beforeEach(() => {
        mockClock = install();
    });

    afterEach(() => {
        mockClock.uninstall();
    });

    it("should not timeout when timeout is set to INFINITELY", async () => {
        const oneHour = 60 * 60 * 1000;

        const lateResult = retry(async () => {
            await wait(oneHour);
            return "late result"
        }, {timeout: "INFINITELY"});

        await mockClock.tickAsync(oneHour * 2);

        expect(await lateResult).to.eq("late result");
    });

    it("should not timeout when timeout is set to INFINITELY and function fails", async () => {
        const oneHour = 60 * 60 * 1000;
        let failuresLeft = 10;

        const lateResult = retry(async () => {
            if (failuresLeft < 1) {
                return "late result"
            }
            failuresLeft--;

            throw Error("expected failure");
        }, {timeout: "INFINITELY"});

        await mockClock.tickAsync(oneHour * 2);

        expect(await lateResult).to.eq("late result");
    });

    it("default timeout is 1 minute", async () => {
        const oneMinute = 60 * 1000;

        const timeoutResult = retry(async () => {
            await wait(oneMinute + 100);
            return "late result"
        });

        const expectation = expect(timeoutResult).to.be.rejectedWith("Timeout after 60000ms");

        await mockClock.tickAsync(oneMinute + 200);

        await expectation;
    });
});
