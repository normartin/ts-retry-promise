export const timeout: <T>(millis: number, f: (done: () => boolean) => Promise<T>) => Promise<T> = (millies, f) => {

    let done = false;
    const doneF = () => done;

    return new Promise((resolve, reject) => {

        const timeoutRef = setTimeout(() => {
            done = true;
            reject(new Error("Timeout after " + millies + "ms"));
        }, millies);

        const result = f(doneF);
        // result.finally(() => clearTimeout(timeoutRef));

        result.then(
            r => {
                resolve(r);
                clearTimeout(timeoutRef);
            },
            e => {
                reject(e);
                clearTimeout(timeoutRef);
            }
        );
    });
};
