"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { evaluateTriage, clusterQuestions, type TriageInput, type TriageResult } from "@asibi/shared";
import { saveCase } from "@/lib/cases";
import { getSavedLang, strings } from "@/lib/i18n";

const APP_VERSION = "0.2.0";
const DECISION_TREE_VERSION = "v2";

type Cluster = TriageInput["cluster"];
type FlagKey = keyof Omit<TriageInput, "cluster">;

const clusters: { value: Cluster; labelKey: keyof typeof strings.en }[] = [
  { value: "fever", labelKey: "clusterFever" },
  { value: "breathing", labelKey: "clusterBreathing" },
  { value: "vomiting_diarrhea", labelKey: "clusterVomiting" },
  { value: "confusion_collapse", labelKey: "clusterConfusion" },
  { value: "skin_rash", labelKey: "clusterRash" },
  { value: "other", labelKey: "clusterOther" },
];

const questionKeys: Record<FlagKey, keyof typeof strings.en> = {
  childUnderFive: "q_childUnderFive",
  unconscious: "q_unconscious",
  highFever: "q_highFever",
  severeDehydration: "q_severeDehydration",
  rainedHeavily: "q_rainedHeavily",
  breathingFast: "q_breathingFast",
  dustSmokeExposure: "q_dustSmokeExposure",
  persistentVomiting: "q_persistentVomiting",
  bloodInStool: "q_bloodInStool",
  seizures: "q_seizures",
  maternalDangerSigns: "q_maternalDangerSigns",
};

const ageRangeOptions: { value: string; labelKey: keyof typeof strings.en }[] = [
  { value: "under_1", labelKey: "ageUnder1" },
  { value: "1_4", labelKey: "age1to4" },
  { value: "5_14", labelKey: "age5to14" },
  { value: "15_49", labelKey: "age15to49" },
  { value: "50_plus", labelKey: "age50plus" },
  { value: "unknown", labelKey: "ageUnknown" },
];

const sexOptions: { value: string; labelKey: keyof typeof strings.en }[] = [
  { value: "male", labelKey: "sexMale" },
  { value: "female", labelKey: "sexFemale" },
  { value: "other", labelKey: "sexOther" },
];

const riskColors: Record<string, string> = {
  monitor: "#2e7d32",
  treat_local: "#1565c0",
  refer: "#e65100",
  urgent: "#b71c1c",
  emergency: "#7b1fa2",
};

const riskLabelKeys: Record<string, keyof typeof strings.en> = {
  monitor: "risk_monitor",
  treat_local: "risk_treat_local",
  refer: "risk_refer",
  urgent: "risk_urgent",
  emergency: "risk_emergency",
};

type Step = "patient" | "cluster" | `q-${number}` | "result";

function buildSteps(cluster: Cluster | null): Step[] {
  const base: Step[] = ["patient", "cluster"];
  if (!cluster) return base;
  const qs = clusterQuestions[cluster] ?? [];
  return [...base, ...qs.map((_, i) => `q-${i}` as Step), "result"];
}

export default function TriagePage() {
  const router = useRouter();
  const lang = getSavedLang();
  const t = strings[lang];

  const [stepIndex, setStepIndex] = useState(0);
  const [patientAgeRange, setPatientAgeRange] = useState("");
  const [patientSex, setPatientSex] = useState("");
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [answers, setAnswers] = useState<Partial<Record<FlagKey, boolean>>>({});
  const [result, setResult] = useState<TriageResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const steps = buildSteps(cluster);
  const currentStep = steps[stepIndex] as Step;

  function goBack() {
    if (stepIndex === 0) { router.push("/"); return; }
    setStepIndex((i) => i - 1);
  }

  function goNext() {
    const next = stepIndex + 1;
    if (next >= steps.length) return;

    // When moving from cluster step, compute result immediately on the final question answer.
    setStepIndex(next);
  }

  function selectCluster(c: Cluster) {
    setCluster(c);
    setAnswers({});
    setResult(null);
    setSavedMessage("");
    // Move to first question step (index 2)
    setStepIndex(2);
  }

  function answerQuestion(flag: FlagKey, value: boolean) {
    const updatedAnswers = { ...answers, [flag]: value };
    setAnswers(updatedAnswers);

    const qs = clusterQuestions[cluster!] ?? [];
    const questionIndex = Number((currentStep as string).split("-")[1]);
    const isLast = questionIndex === qs.length - 1;

    if (isLast) {
      // Build full triage input with defaults for unanswered flags.
      const defaultFalse: Record<string, boolean> = {};
      (Object.keys(questionKeys) as FlagKey[]).forEach((k) => { defaultFalse[k] = false; });
      const input: TriageInput = {
        cluster: cluster!,
        ...defaultFalse,
        ...updatedAnswers,
      } as TriageInput;
      const r = evaluateTriage(input);
      setResult(r);
      // Jump to result step.
      setStepIndex(steps.length - 1);
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  async function handleSave() {
    if (!result || !cluster || saving) return;
    setSaving(true);
    try {
      await saveCase({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        patientAgeRange: patientAgeRange || "unknown",
        patientSex: patientSex || undefined,
        symptomCluster: cluster,
        answers: answers as Record<string, boolean>,
        riskLevel: result.riskLevel,
        likelyCondition: result.likelyCondition,
        recommendation: result.recommendation,
        redFlags: result.redFlags,
        careAdvice: result.careAdvice,
        referralRequired: result.referralRequired,
        decisionTreeVersion: DECISION_TREE_VERSION,
        appVersion: APP_VERSION,
        syncStatus: "unsynced",
      });
      setSavedMessage(t.caseSaved);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (currentStep === "patient") {
    return (
      <main className="container">
        <h1>{t.patientProfile}</h1>
        <p className="step-hint">{`${t.triageTitle} · ${t.next}`}</p>

        <label>{t.ageRangeLabel}</label>
        <div className="btn-grid">
          {ageRangeOptions.map((opt) => (
            <button
              key={opt.value}
              className={`tap-btn${patientAgeRange === opt.value ? " selected" : ""}`}
              onClick={() => setPatientAgeRange(opt.value)}
            >
              {t[opt.labelKey]}
            </button>
          ))}
        </div>

        <label style={{ marginTop: "1.5rem" }}>{t.sexLabel}</label>
        <div className="btn-grid">
          {sexOptions.map((opt) => (
            <button
              key={opt.value}
              className={`tap-btn${patientSex === opt.value ? " selected" : ""}`}
              onClick={() => setPatientSex(opt.value)}
            >
              {t[opt.labelKey]}
            </button>
          ))}
        </div>

        <div className="actions" style={{ marginTop: "2rem" }}>
          <button onClick={() => router.push("/")}>{t.cancel}</button>
          <button className="btn-primary" onClick={goNext} disabled={!patientAgeRange}>{t.next}</button>
        </div>
      </main>
    );
  }

  if (currentStep === "cluster") {
    return (
      <main className="container">
        <h1>{t.selectCluster}</h1>
        <div className="btn-grid">
          {clusters.map((c) => (
            <button key={c.value} className="tap-btn" onClick={() => selectCluster(c.value)}>
              {t[c.labelKey]}
            </button>
          ))}
        </div>
        <div className="actions" style={{ marginTop: "2rem" }}>
          <button onClick={goBack}>{t.back}</button>
          <button onClick={() => router.push("/")}>{t.cancel}</button>
        </div>
      </main>
    );
  }

  if (typeof currentStep === "string" && currentStep.startsWith("q-") && cluster) {
    const questionIndex = Number(currentStep.split("-")[1]);
    const qs = clusterQuestions[cluster] ?? [];
    const flagKey = qs[questionIndex] as FlagKey;
    const questionText = t[questionKeys[flagKey]];
    const total = qs.length;

    return (
      <main className="container">
        <p className="step-hint">{`${questionIndex + 1} / ${total}`}</p>
        <h1>{questionText}</h1>
        <div className="btn-grid-2">
          <button className="tap-btn tap-btn--yes" onClick={() => answerQuestion(flagKey, true)}>{t.yes}</button>
          <button className="tap-btn tap-btn--no" onClick={() => answerQuestion(flagKey, false)}>{t.no}</button>
        </div>
        <div className="actions" style={{ marginTop: "2rem" }}>
          <button onClick={goBack}>{t.back}</button>
          <button onClick={() => router.push("/")}>{t.cancel}</button>
        </div>
      </main>
    );
  }

  // Result screen
  if (currentStep === "result" && result) {
    const riskColor = riskColors[result.riskLevel] ?? "#555";
    const riskLabel = t[riskLabelKeys[result.riskLevel]];

    return (
      <main className="container">
        <h1>{t.resultTitle}</h1>

        <div className="result-badge" style={{ background: riskColor }}>
          <span>{riskLabel}</span>
        </div>

        <section className="card">
          <h2>{t.likelyCondition}</h2>
          <p>{result.likelyCondition}</p>
        </section>

        {result.redFlags.length > 0 && (
          <section className="card card--danger">
            <h2>{t.redFlags}</h2>
            <ul>
              {result.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
            </ul>
          </section>
        )}

        <section className="card">
          <h2>{t.recommendation}</h2>
          <p>{result.recommendation}</p>
        </section>

        <section className="card">
          <h2>{t.careAdvice}</h2>
          <p>{result.careAdvice}</p>
        </section>

        <section className="card">
          <p><strong>{result.referralRequired ? `⚠ ${t.referralRequired}` : t.noReferral}</strong></p>
        </section>

        <p className="disclaimer">{t.disclaimer}</p>

        {savedMessage
          ? <p className="saved-msg">{savedMessage}</p>
          : (
            <button className="btn-primary btn-save" onClick={handleSave} disabled={saving}>
              {saving ? "…" : t.saveOffline}
            </button>
          )}

        <div className="actions" style={{ marginTop: "1rem" }}>
          <button onClick={goBack}>{t.back}</button>
          <button onClick={() => router.push("/")}>{t.cancel}</button>
        </div>
      </main>
    );
  }

  return null;
}
