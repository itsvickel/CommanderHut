export default {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1", // Alias for imports like '@/components/Button'
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    collectCoverage: true,
    collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/main.tsx", "!src/vite-env.d.ts"],
    coverageReporters: ["json", "lcov", "text", "clover"],
};
