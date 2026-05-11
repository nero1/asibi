// Inline copy of evaluateTriage from packages/shared/src/index.ts
// Keep this in sync when the shared evaluator changes.
// Using plain JS here because the test runner is Node.js without TypeScript compilation.

function evaluate(input) {
  const { cluster, unconscious, seizures, childUnderFive, highFever, severeDehydration,
    rainedHeavily, breathingFast, dustSmokeExposure, persistentVomiting,
    bloodInStool, maternalDangerSigns } = input;

  if (unconscious) return { riskLevel: "emergency" };

  if (cluster === "fever") {
    if (seizures) return { riskLevel: "emergency" };
    if (highFever && childUnderFive) return { riskLevel: "urgent" };
    if (rainedHeavily && highFever) return { riskLevel: "urgent" };
    if (highFever) return { riskLevel: "refer" };
    if (rainedHeavily) return { riskLevel: "refer" };
    return { riskLevel: "monitor" };
  }
  if (cluster === "breathing") {
    if (breathingFast && childUnderFive) return { riskLevel: "urgent" };
    if (dustSmokeExposure) return { riskLevel: "refer" };
    if (breathingFast) return { riskLevel: "refer" };
    return { riskLevel: "refer" };
  }
  if (cluster === "vomiting_diarrhea") {
    if (severeDehydration) return { riskLevel: "urgent" };
    if (bloodInStool) return { riskLevel: "urgent" };
    if (persistentVomiting && rainedHeavily) return { riskLevel: "refer" };
    if (persistentVomiting) return { riskLevel: "refer" };
    return { riskLevel: "monitor" };
  }
  if (cluster === "confusion_collapse") {
    if (seizures) return { riskLevel: "emergency" };
    if (highFever) return { riskLevel: "urgent" };
    return { riskLevel: "urgent" };
  }
  if (cluster === "skin_rash") {
    if (highFever && rainedHeavily) return { riskLevel: "urgent" };
    if (highFever) return { riskLevel: "refer" };
    if (dustSmokeExposure) return { riskLevel: "monitor" };
    return { riskLevel: "monitor" };
  }
  // other
  if (maternalDangerSigns) return { riskLevel: "urgent" };
  if (seizures) return { riskLevel: "emergency" };
  if (highFever && childUnderFive) return { riskLevel: "urgent" };
  return { riskLevel: "monitor" };
}

import assert from "node:assert/strict";

const base = { childUnderFive: false, unconscious: false, severeDehydration: false, highFever: false,
  rainedHeavily: false, breathingFast: false, dustSmokeExposure: false, persistentVomiting: false,
  bloodInStool: false, seizures: false, maternalDangerSigns: false };

// Unconscious → always emergency regardless of cluster
assert.equal(evaluate({ ...base, cluster: "fever", unconscious: true }).riskLevel, "emergency");
assert.equal(evaluate({ ...base, cluster: "other", unconscious: true }).riskLevel, "emergency");

// Fever cluster
assert.equal(evaluate({ ...base, cluster: "fever", seizures: true }).riskLevel, "emergency");
assert.equal(evaluate({ ...base, cluster: "fever", highFever: true, childUnderFive: true }).riskLevel, "urgent");
assert.equal(evaluate({ ...base, cluster: "fever", rainedHeavily: true, highFever: true }).riskLevel, "urgent");
assert.equal(evaluate({ ...base, cluster: "fever", highFever: true }).riskLevel, "refer");
assert.equal(evaluate({ ...base, cluster: "fever", rainedHeavily: true }).riskLevel, "refer");
assert.equal(evaluate({ ...base, cluster: "fever" }).riskLevel, "monitor");

// Breathing cluster
assert.equal(evaluate({ ...base, cluster: "breathing", breathingFast: true, childUnderFive: true }).riskLevel, "urgent");
assert.equal(evaluate({ ...base, cluster: "breathing", dustSmokeExposure: true }).riskLevel, "refer");
assert.equal(evaluate({ ...base, cluster: "breathing", breathingFast: true }).riskLevel, "refer");
assert.equal(evaluate({ ...base, cluster: "breathing" }).riskLevel, "refer");

// Vomiting/diarrhea cluster
assert.equal(evaluate({ ...base, cluster: "vomiting_diarrhea", severeDehydration: true }).riskLevel, "urgent");
assert.equal(evaluate({ ...base, cluster: "vomiting_diarrhea", bloodInStool: true }).riskLevel, "urgent");
assert.equal(evaluate({ ...base, cluster: "vomiting_diarrhea", persistentVomiting: true, rainedHeavily: true }).riskLevel, "refer");
assert.equal(evaluate({ ...base, cluster: "vomiting_diarrhea", persistentVomiting: true }).riskLevel, "refer");
assert.equal(evaluate({ ...base, cluster: "vomiting_diarrhea" }).riskLevel, "monitor");

// Confusion/collapse cluster
assert.equal(evaluate({ ...base, cluster: "confusion_collapse", seizures: true }).riskLevel, "emergency");
assert.equal(evaluate({ ...base, cluster: "confusion_collapse", highFever: true }).riskLevel, "urgent");
assert.equal(evaluate({ ...base, cluster: "confusion_collapse" }).riskLevel, "urgent");

// Skin rash cluster
assert.equal(evaluate({ ...base, cluster: "skin_rash", highFever: true, rainedHeavily: true }).riskLevel, "urgent");
assert.equal(evaluate({ ...base, cluster: "skin_rash", highFever: true }).riskLevel, "refer");
assert.equal(evaluate({ ...base, cluster: "skin_rash", dustSmokeExposure: true }).riskLevel, "monitor");
assert.equal(evaluate({ ...base, cluster: "skin_rash" }).riskLevel, "monitor");

// Other cluster
assert.equal(evaluate({ ...base, cluster: "other", maternalDangerSigns: true }).riskLevel, "urgent");
assert.equal(evaluate({ ...base, cluster: "other", seizures: true }).riskLevel, "emergency");
assert.equal(evaluate({ ...base, cluster: "other", highFever: true, childUnderFive: true }).riskLevel, "urgent");
assert.equal(evaluate({ ...base, cluster: "other" }).riskLevel, "monitor");

console.log("triage.test.mjs passed");
