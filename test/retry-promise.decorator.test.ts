import {expect} from "./index";
import {customizeRetry, defaultRetryConfig, retry, retryDecorator, wait} from "../src/retry-promise";

describe("Retry decorator test", () => {

    it("can use decorator", async () => {
        const asyncFunction: (s: string) => Promise<string> = async s => s;

        const asyncFunctionDecorated = retryDecorator(asyncFunction);

        expect(asyncFunctionDecorated("1")).to.eventually.eq("1")
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

});
