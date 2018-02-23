# ts tools #

Some tools I extracted from my daily work.

Source: https://bitbucket.org/martinmo/ts-tools/src

## ts-retry-promise ##

I use this heavily in UI tests. 
Repeats the call to a function that returns a promise until a resolved promise is returned.

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

it("will retry until condition is met or limit reached", async () => {

    await retry(
        () => browser.$("ul"),
        {until: (list) => list.length === 6});

});

it("can be configured and has defaults", async () => {

    await retry(async () => {
        // your code
    }, {
        delay: 100, // default
        logger: (message) => undefined, // default
        retries: 10, // default
        until: () => true, // default
    });

});
```
