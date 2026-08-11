import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@fhusocom/db$": "<rootDir>/../../packages/db/src/index.ts",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          esModuleInterop: true,
          allowJs: true,
          skipLibCheck: true,
          moduleResolution: "node",
          isolatedModules: true,
        },
      },
    ],
  },
};

export default config;
