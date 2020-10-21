import {expect} from "./index";
import {customizeRetry, defaultRetryConfig, notEmpty, retry, wait, NotRetryableError, RetryError} from "../src/retry-promise";

describe("NotRetryableError Error", () => {

  it("should be rejected on first try", async () => {
    const failer = new Failer();
    const result = retry(() => failer.run(), {delay: 10, retries: 10});

    expect(result).to.be.rejected;
    expect(failer.calls).to.eq(1);
  });

});

class Failer {

  public calls: number = 0;

  public async run(): Promise<string> {
    this.calls++;
    throw new NotRetryableError("Not retryable error");
  }
}
