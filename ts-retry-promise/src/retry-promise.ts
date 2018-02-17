import {isArray} from "util";

export interface RetryConfig {
    retries?: number;
    delay?: number;
    until?: (t: any) => boolean;
}

const defaults: RetryConfig = Object.freeze({
    retries: 10,
    delay: 100,
    until: () => true
});

function clone(c: RetryConfig): RetryConfig {
    return Object.assign({}, defaults, c);
}

async function wait(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(f: () => Promise<T>, config: RetryConfig = clone(defaults)): Promise<T> {
    try {
        let result = await f();
        if (!config.until(result)) {
            throw Error("until condition not met by " + result);
        }
        return result;
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

export const notEmpty = (result: any) => isArray(result) && result.length > 0;
