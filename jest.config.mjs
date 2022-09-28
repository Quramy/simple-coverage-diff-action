export default {
  transform: {
    "^.+\\.(mc)?ts$": ["ts-jest", { diagnostics: false }],
  },
  moduleNameMapper: {
    "^(\\.\\.?/.*)\\.js$": ["$1.ts", "$1.js"],
    "^(\\.\\.?/.*)\\.mjs$": ["$1.mts", "$1.mjs"],
    "^(\\.\\.?/.*)\\.cjs$": ["$1.cts", "$1.cjs"],
  },
  testMatch: ["**/?(*.)+(spec|test).?([mc])[jt]s"],
  testPathIgnorePatterns: ["/node_modules/", "/.rollup.cache/", "\\.d\\.ts$", "dist/.*"],
  collectCoverageFrom: ["src/**/*.?([mc])ts", "!src/**/*.test.*"],
  coverageReporters: ["json-summary", ["text", { skipFull: true }]],
  moduleFileExtensions: ["ts", "mts", "cts", "js", "mjs", "cjs", "json"],
}
