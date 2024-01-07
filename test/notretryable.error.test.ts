import {expect} from "./index";
import {retry, NotRetryableError} from "../src/retry-promise";

describe("NotRetryableError Error", () => {

  it("should be rejected on first try", async () => {
    const failer = new Failer();
    const result = retry(() => failer.run(), {delay: 10, retries: 10});

    expect(result).to.be.rejected;
    expect(failer.calls).to.eq(1);
  });

  it("should have RetryError in lastError", async () => {
    const error = new NotRetryableError("stop retrying");

    const result = retry(async () => {throw error});

    expect(result).to.be.eventually.rejected.with.property("lastError").eq(error);
  });

  it("RetryError should have message", async () => {
      const error = new NotRetryableError("stop retrying");

      expect(error.message).to.eq("stop retrying");
  });

});

class Failer {

  public calls: number = 0;

  public async run(): Promise<string> {
    this.calls++;
    throw new NotRetryableError("Not retryable error");
  }
}
