import "mocha";
import {retry, RetryConfig} from "../src/retry-promise";
import {expect} from "chai";

describe("Retry Promise", () => {

    it("should retry", async function () {

        const failer = new Failer(1, "Result");

        const result = await retry(() => failer.run());

        expect(result).to.eq("Result");
        expect(failer.calls).to.eq(2);
    });

    it("should fail if all retries are done", async function () {

        const failer = new Failer(100, "Result");

        await expectError(retry(() => failer.run()));
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

async function expectError<T>(p: Promise<T>): Promise<Error> {
    let result: any = undefined;
    try {
        result = await p;
    } catch (error) {
        return error;
    }
    throw Error("Expected error, but got " + result);
}