# ts-retry-promise #
Source: https://bitbucket.org/martinmo/ts-tools/src

_retry for functions returning a promise_

I use this heavily in UI tests. 
Repeats the call to a function that returns a promise until a resolved promise is returned.
Optionally a predicate on the result can be specified.

```typescript
// ts-retry-promise/test/retry-promise.demo.test.ts

it("will retry until no exception or limit reached", async () => {

    await retry(async () => {
        const title = await browser.$("h1");
        expect(title).to.eq("Loaded");
    });

});

it("can return a result", async () => {

    const pageTitle = await retry(async () => {
        const title = await browser.$("h1");
        expect(title).to.be.not.empty;
        return title;
    });

    // do some stuff with the result
    expect(pageTitle).to.eq("Loaded");
});

it("can be configured and has defaults", async () => {

    await retry(async () => {
        // your code
    }, {
        delay: 100, // wait time between retries
        logger: (message) => undefined, // log events
        retries: 10, // number of retry attempts
        timeout: 60 * 1000, // overall timeout
        until: () => true, // check the result
    });

});

it("will retry until condition is met or limit reached", async () => {

    await retry(
        () => browser.$("ul"),
        {until: (list) => list.length === 6});

});

it("can have a timeout", async () => {

    const promise = retry(
        () => wait(100),
        {timeout: 10},
    );

    const error = await expectError(promise);
    expect(error.message).to.contain("Timeout");
});

it("can create a customized retry", async () => {
    const impatientRetry = customizeRetry({timeout: 5});

    const error = await expectError(impatientRetry(async () => wait(10)));

    expect(error.message).to.contain("Timeout");
});

it("can customize default config", async () => {
    const originalTimeout = defaultRetryConfig.timeout;
    try {
        defaultRetryConfig.timeout = 1;

        const error = await expectError(retry(async () => wait(10)));

        expect(error.message).to.contain("Timeout");
    } finally {
        defaultRetryConfig.timeout = originalTimeout;
    }
});
```

