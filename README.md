# ts-retry-promise #

[![Build Status](https://travis-ci.org/normartin/ts-retry-promise.svg?branch=master)](https://travis-ci.org/normartin/ts-retry-promise)
[![Coverage Status](https://coveralls.io/repos/github/normartin/ts-retry-promise/badge.svg?branch=master)](https://coveralls.io/github/normartin/ts-retry-promise?branch=master)
[![Dependencies](https://david-dm.org/normartin/ts-retry-promise.svg)](https://david-dm.org/normartin/ts-retry-promise)


_retry for functions returning a promise_


```typescript
function retry<T>(f: () => Promise<T>, config?: RetryConfig<T>): Promise<T> {}
```

_retry_ will repeatedly call _f_ until a resolved _Promise_ is returned. 
Optionally a predicate can be specified, against which the result will be checked.

Several aspects of the execution can be configured:

```typescript
export interface RetryConfig<T> {
    // number of maximal retry attempts (default: 10)
    retries?: number | "INFINITELY";

    // wait time between retries in ms (default: 100)
    delay?: number;

    // check the result, will retry until true (default: () => true)
    until?: (t: T) => boolean;

    // log events (default: () => undefined)
    logger?: (msg: string) => void;

    // overall timeout in ms (default: 60 * 1000)
    timeout?: number;

    // increase delay with every retry (default: "FIXED")
    backoff?: "FIXED" | "EXPONENTIAL" | "LINEAR" | ((attempt: number, delay: number) => number);

    // maximal backoff in ms (default: 5 * 60 * 1000)
    maxBackOff?: number;
}
```

## Customize ##

_customizeRetry_ returns a new instance of _retry_ that has defined default configuration.

```typescript

const retryUntilNotEmpty = customizeRetry<T[]>({until: (array: T[]) => array.length > 0});
const result = await retryUntilNotEmpty(async () => [1, 2]);
expect(result).to.deep.eq([1, 2]);

// another example

const impatientRetry = customizeRetry({timeout: 5});
const error = await expectError(impatientRetry(async () => wait(10)));
expect(error.message).to.contain("Timeout");
```

## Samples ##

_retry_ is well suited for acceptance tests (but not restricted to).

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
    }, {backoff: "LINEAR", retries: 100});

});

it("will retry until condition is met or limit reached", async () => {

    await retry(
        () => browser.$$("ul"),
        {until: (list) => list.length === 2});

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
