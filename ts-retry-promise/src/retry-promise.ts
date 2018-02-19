import {isArray, isNullOrUndefined} from 'util';

export interface RetryConfig<T> {
    retries?: number;
    delay?: number;
    until?: (t: T) => boolean;
}

const defaults: RetryConfig<any> = Object.freeze({
    retries: 10,
    delay: 100,
    until: () => true
});

function clone<T>(c: RetryConfig<T>): RetryConfig<T> {
    return Object.assign({}, defaults, c);
}

async function wait(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(f: () => Promise<T>, config: RetryConfig<T> = defaults): Promise<T> {
    config = clone(config);

    for (let i = 0; i < config.retries; i++) {
        try {
            let result = await f();
            if (config.until(result)) {
                return result;
            }
            console.error('Until condition not met by ' + result);
        } catch (error) {
            console.error('Retry failed: ', error);
        }
        await wait(config.delay);
    }
    throw Error('All retries failed.');
}


export const notEmpty = (result: any) =>
    (isArray(result) && result.length > 0)
    || (!isArray(result) && !isNullOrUndefined(result));
