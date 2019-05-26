
export interface RetryConfig<T> {
    // number of maximal retry attempts (default: 10)
    retries: number | "INFINITELY";

    // wait time between retries in ms (default: 100)
    delay: number;

    // check the result, will retry until true (default: () => true)
    until: (t: T) => boolean;

    // log events (default: () => undefined)
    logger: (msg: string) => void;

    // overall timeout in ms (default: 60 * 1000)
    timeout: number;

    // increase delay with every retry (default: "FIXED")
    backoff: "FIXED" | "EXPONENTIAL" | "LINEAR" | ((attempt: number, delay: number) => number);

    // maximal backoff in ms (default: 5 * 60 * 1000)
    maxBackOff: number;
}

const fixedBackoff = (attempt: number, delay: number) => delay;
const linearBackoff = (attempt: number, delay: number) => attempt * delay;
const exponentialBackoff = (attempt: number, delay: number) => Math.pow(delay, attempt);

export const defaultRetryConfig: RetryConfig<any> = {
    backoff: "FIXED",
    delay: 100,
    logger: () => undefined,
    maxBackOff: 5 * 60 * 1000,
    retries: 10,
    timeout: 60 * 1000,
    until: () => true,
};

export async function wait(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(f: () => Promise<T>, config?: Partial<RetryConfig<T>>): Promise<T> {
    const effectiveConfig: RetryConfig<T> = Object.assign({}, defaultRetryConfig, config) as RetryConfig<T>;
    const cancel = exposedPromise();
    return timeout(_retry(f, effectiveConfig, cancel.promise), effectiveConfig.timeout, cancel.resolve);
}

// tslint:disable-next-line
export function customizeRetry<T>(customConfig: Partial<RetryConfig<T>>): <T>(f: () => Promise<T>, config?: RetryConfig<T>) => Promise<T> {
    return (f, c) => {
        const customized = Object.assign({}, customConfig, c);
        return retry(f, customized);
    };
}

async function _retry<T>(f: () => Promise<T>, config: RetryConfig<T>, canceled: Promise<void>): Promise<T> {
    let latestError: Error;
    let stop = false;

    let delay: (attempt: number, delay: number) => number;

    switch (config.backoff) {
        case "EXPONENTIAL":
            delay = exponentialBackoff;
            break;
        case "FIXED":
            delay = fixedBackoff;
            break;
        case "LINEAR":
            delay = linearBackoff;
            break;
        default:
            delay = config.backoff as (attempt: number, delay: number) => number;
    }

    let retries: number;
    if (config.retries === "INFINITELY") {
        retries = Number.MAX_SAFE_INTEGER;
    } else {
        retries = config.retries;
    }

    canceled.then(() => stop = true);
    for (let i = 0; i <= retries && !stop; i++) {
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
        const millisToWait = delay(i + 1, config.delay);
        await wait(millisToWait > config.maxBackOff ? config.maxBackOff : millisToWait);
    }
    throw Error(`All retries failed. Last error: ${latestError!}`);
}

export const notEmpty = (result: any) => {
    if (Array.isArray(result)) {
        return result.length > 0;
    }
    return result !== null && result !== undefined;
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

interface ExposedPromiseInterface {
    promise: Promise<void>;
    resolve: () => void;
    reject: () => void;
}

function exposedPromise(): ExposedPromiseInterface {
    const result: Partial<ExposedPromiseInterface> = {};

    result.promise = new Promise<void>((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });
    return result as ExposedPromiseInterface;
}
