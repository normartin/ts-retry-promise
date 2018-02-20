import {isArray, isNullOrUndefined} from "util";

export interface RetryConfig<T> {
    retries?: number;
    delay?: number;
    until?: (t: T) => boolean;
    logger?: (msg: string) => void;
}

const defaults: RetryConfig<any> = {
    delay: 100,
    logger: () => undefined,
    retries: 10,
    until: () => true,
};

async function wait(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(f: () => Promise<T>, config: RetryConfig<T> = defaults): Promise<T> {
    config = Object.assign({}, defaults, config);

    for (let i = 0; i <= config.retries; i++) {
        try {
            const result = await f();
            if (config.until(result)) {
                return result;
            }
            config.logger("Until condition not met by " + result);
        } catch (error) {
            config.logger("Retry failed: " + error.message);
        }
        await wait(config.delay);
    }
    throw Error("All retries failed.");
}

export const notEmpty = (result: any) => {
    if (isArray(result)) {
        return result.length > 0;
    }
    return !isNullOrUndefined(result);
};
