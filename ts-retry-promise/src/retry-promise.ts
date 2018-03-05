import {isArray, isNullOrUndefined} from "util";

export interface RetryConfig<T> {
    retries?: number;
    delay?: number;
    until?: (t: T) => boolean;
    logger?: (msg: string) => void;
    timeout?: number;
}

export const defaultRetryConfig: RetryConfig<any> = {
    delay: 100,
    logger: () => undefined,
    retries: 10,
    timeout: 60 * 1000,
    until: () => true,
};

export async function wait(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(f: () => Promise<T>, config?: RetryConfig<T>): Promise<T> {
    config = Object.assign({}, defaultRetryConfig, config);
    const cancel = exposedPromise();
    return timeout(_retry(f, config, cancel.promise), config.timeout, cancel.resolve);
}

// tslint:disable-next-line
export function customizeRetry<T>(customConfig: RetryConfig<T>): <T>(f: () => Promise<T>, config?: RetryConfig<T>) => Promise<T> {
    return (f, c) => {
        const customized = Object.assign({}, customConfig, c);
        return retry(f, customized);
    };
}

async function _retry<T>(f: () => Promise<T>, config: RetryConfig<T>, canceled: Promise<void>): Promise<T> {
    let latestError: Error;
    let stop = false;
    canceled.then(() => stop = true);
    for (let i = 0; i <= config.retries && !stop; i++) {
        try {
            const result = await f();
            if (config.until(result)) {
                return result;
            }
            config.logger("Until condition not met by " + result);
        } catch (error) {
            latestError = error;
            config.logger("Retry failed: " + error.message);
        }
        await wait(config.delay);
    }
    throw Error(`All retries failed. Last error: ${latestError}`);
}

export const notEmpty = (result: any) => {
    if (isArray(result)) {
        return result.length > 0;
    }
    return !isNullOrUndefined(result);
};

function timeout<T>(p: Promise<T>, time: number, onTimeout: () => void): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error("Timeout after " + time));
            onTimeout();
        }, time);

        return p
            .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

function exposedPromise(): { promise: Promise<void>, resolve: () => void, reject: () => void } {
    const result: { promise: Promise<void>, resolve: () => void, reject: () => void } = {
        promise: undefined,
        reject: undefined,
        resolve: undefined,
    };
    result.promise = new Promise<void>(((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    }));
    return result;
}
