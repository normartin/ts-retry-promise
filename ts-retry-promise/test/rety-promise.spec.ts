import "mocha";
import {retry, RetryConfig} from "../src/retry-promise";
import {expect} from "chai";

describe("Retry Promise", () => {

    it("can be used", async function () {

        const failer = new Failer(1, "Result");

        const result = await retry(() => failer.run());

        expect(result).to.eq("Result");
        expect(failer.calls).to.eq(2);
    });

    it("should not alter config", async function () {
        const failer = new Failer(1, "Result");

        const config: RetryConfig = {
            retries: 3,
            delay: 10
        };

        await retry(() => failer.run(), config);

        expect(config.retries).to.eq(3);
        expect(config.delay).to.eq(10);
    });

});

class Failer<T> {

    public calls: number = 0;

    constructor(private fails: number, private result: T) {

    }

    public async run(): Promise<T> {
        this.calls++;
        if (this.fails < 1) {
            return this.result;
        } else {
            this.fails--;
            throw Error("Expected fail. Fails left " + this.fails);
        }
    }
}