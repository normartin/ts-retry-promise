import {isArray, isNullOrUndefined} from "util";

export interface RetryConfig<T> {
    retries?: number;
    delay?: number;
    until?: (t: T) => boolean;
    logger?: (msg: string) => void;
    timeout?: number;
}

const defaults: RetryConfig<any> = {
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
    config = Object.assign({}, defaults, config);
    return timeout(_retry(f, config), config.timeout);
}

// tslint:disable-next-line
export function customizeRetry<T>(customConfig: RetryConfig<T>): <T>(f: () => Promise<T>, config?: RetryConfig<T>) => Promise<T> {
    return (f, c) => {
        const customized = Object.assign({}, customConfig, c);
        return retry(f, customized);
    };
}

async function _retry<T>(f: () => Promise<T>, config: RetryConfig<T>): Promise<T> {
    let latestError: Error;
    for (let i = 0; i <= config.retries; i++) {
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

function timeout<T>(p: Promise<T>, time: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Timeout after " + time)), time);

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
