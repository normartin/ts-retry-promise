module.exports = function (config) {
    config.set({
        mutator: "typescript",
        packageManager: "npm",
        reporters: ["html", "clear-text", "progress"],
        transpilers: [],
        coverageAnalysis: "off",
        tsconfigFile: "tsconfig.json",
        mutate: ["src/**/*.ts"],
        logLevel: 'info',
        testRunner: "mocha"
    });
};
