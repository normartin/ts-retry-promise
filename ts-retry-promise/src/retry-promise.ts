export interface RetryConfig {
    retries: number;
    delay: number;
}

const defaults: RetryConfig = Object.freeze({
    retries: 10,
    delay: 100
});

function clone(c: RetryConfig): RetryConfig {
    return Object.assign({}, c);
}

async function wait(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(f: () => Promise<T>, config: RetryConfig = clone(defaults)): Promise<T> {
    try {
        return await f();
    } catch (error) {
        if (config.retries < 1) {
            throw Error("all retries failed. Last error: " + error.message);
        } else {
            await wait(config.delay);
            config = clone(config);
            config.retries--;
            return retry(f, config)
        }
    }
}
