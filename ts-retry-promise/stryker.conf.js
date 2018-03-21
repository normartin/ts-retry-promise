module.exports = function (config) {
    config.set({
        files: [{pattern: 'test/**/*.ts', included: true, mutated: false}],
        testRunner: "mocha",
        mutator: "typescript",
        transpilers: ["typescript"],
        reporter: ["html", "clear-text", "progress"],
        testFramework: "mocha",
        coverageAnalysis: "off",
        tsconfigFile: "tsconfig.json",
        mutate: ["src/**/*.ts"]
    });
};
