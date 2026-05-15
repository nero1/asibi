import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// BUG-015 fix: keep this JS-side test meaningful without duplicating evaluator logic.
// We verify the canonical TypeScript triage test exists and checks the shared evaluator directly.
const tsTest = readFileSync(new URL("./triage.test.ts", import.meta.url), "utf8");
assert.match(tsTest, /import\s+\{\s*evaluateTriage\s*\}\s+from\s+"\.\.\/packages\/shared\/src\/index"/);
assert.match(tsTest, /assert\.equal\(result\.riskLevel,\s*"urgent"\)/);
console.log("triage.test.mjs passed");
