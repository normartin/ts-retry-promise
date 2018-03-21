module.exports = function (config) {
    config.set({
        files: [{pattern: 'test/**/*.ts', included: true, mutated: false}],
        testRunner: "mocha",

        mutator: "typescript",
        transpilers: ["typescript"],
        reporter: ["html", "clear-text", "progress"],
        coverageAnalysis: "off",
        tsconfigFile: "tsconfig.stryker.json",
        mutate: ["src/*.ts"]
    });
};
