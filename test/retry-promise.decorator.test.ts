import {expect} from "./index";
import {customizeDecorator, NotRetryableError, retryDecorator, wait} from "../src/retry-promise";

describe("Retry decorator test", () => {

    it("can use decorator", async () => {
        const asyncFunction: (s: string) => Promise<string> = async s => s;

        const asyncFunctionDecorated = retryDecorator(asyncFunction);

        const result = asyncFunctionDecorated("1");

        expect(result).to.eventually.eq("1");
    });

    it("can use decorator with custom config", async () => {
        const asyncFunction: (s: string) => Promise<string> = async s => {
            await wait(5);
            return s;
        };

        const asyncFunctionDecorated = retryDecorator(asyncFunction, {timeout: 1});

        expect(asyncFunctionDecorated("1")).to.be.rejectedWith("Timeout")
    });

    it("can use decorator with multiple args", async () => {
        const asyncFunction: (s1: string, s2: string) => Promise<string> = async (s1, s2) => s1 + s2;

        const asyncFunctionDecorated: (s1: string, s2: string) => Promise<string> = retryDecorator(asyncFunction);

        expect(asyncFunctionDecorated("1", "2")).to.eventually.eq("12")
    });

    it("can customize decorator", async () => {
        const asyncFunction = async (s: string) => {
            await wait(3);
            return s;
        };

        const myDecorator = customizeDecorator({timeout: 1});

        expect(myDecorator(asyncFunction)("1")).to.be.rejectedWith("Timeout");
    });

    it("can overwrite customized decorator", async () => {
        const asyncFunction = async (s: string) => {
            await wait(3);
            return s;
        };

        const myDecorator = customizeDecorator({timeout: 1});

        expect(myDecorator(asyncFunction, {timeout: 5})("1")).to.eventually.eq("1");
    });

    it("should provide last error in case of failure", async () => {
        const error = Error("Fail");
        let first = true;

        const decorated = retryDecorator(
            async () => {
                if (first) {
                    first = false;
                    throw new Error("first");
                }
                throw error
            }, {retries: 2}
        );

        await expect(decorated()).to.be.eventually.rejected.with.property("lastError", error);
    });

    it("should provide last error in case of NotRetryableError", async () => {
        const error = new NotRetryableError("Fail");
        let calls = 0;

        const decorated = retryDecorator(
            async () => {
                calls++;
                throw error;
            },
            {retries: 3}
        );

        await expect(decorated()).to.be.eventually.rejected.with.property("lastError", error);
        expect(calls).to.eq(1);
    });
});
