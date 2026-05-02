"use client";

import { useState } from "react";
import { saveCase, type LocalCase } from "@/lib/cases";
import { getSavedLang, strings } from "@/lib/i18n";

type TriageResponse = {
  likelyCondition: string;
  recommendation: string;
  riskLevel: string;
};

const clusters = [
  { label: "Fever and sweating", value: "fever" },
  { label: "Breathing problems", value: "breathing" },
  { label: "Vomiting or diarrhea", value: "vomiting_diarrhea" },
  { label: "Confusion or collapse", value: "confusion_collapse" },
  { label: "Skin rash", value: "skin_rash" },
  { label: "Other", value: "other" }
] as const;

export default function TriagePage() {
  const [cluster, setCluster] = useState<string>("fever");
  const [childUnderFive, setChildUnderFive] = useState(false);
  const [unconscious, setUnconscious] = useState(false);
  const [severeDehydration, setSevereDehydration] = useState(false);
  const [highFever, setHighFever] = useState(false);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const lang = getSavedLang();

  async function runTriage() {
    setSavedMessage("");
    const response = await fetch("/api/triage/evaluate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cluster, childUnderFive, unconscious, severeDehydration, highFever }) });
    const body = await response.json();
    setResult(body.data ?? null);
  }

  async function saveCurrentCase() {
    if (!result) return;
    const localCase: Omit<LocalCase, "localCaseId" | "idempotencyKey"> = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      symptomCluster: cluster,
      riskLevel: result.riskLevel,
      likelyCondition: result.likelyCondition,
      recommendation: result.recommendation,
      syncStatus: "unsynced"
    };
    await saveCase(localCase);
    setSavedMessage("Case saved to IndexedDB for offline sync.");
  }

  return (<main className="container"><h1>{strings[lang].triageTitle}</h1><p>{strings[lang].triageHint}</p><label>Symptom cluster</label><select value={cluster} onChange={(e) => setCluster(e.target.value)}>{clusters.map((item) => (<option key={item.value} value={item.value}>{item.label}</option>))}</select><label><input type="checkbox" checked={childUnderFive} onChange={(e) => setChildUnderFive(e.target.checked)} /> Child under 5</label><label><input type="checkbox" checked={unconscious} onChange={(e) => setUnconscious(e.target.checked)} /> Unconscious</label><label><input type="checkbox" checked={severeDehydration} onChange={(e) => setSevereDehydration(e.target.checked)} /> Severe dehydration</label><label><input type="checkbox" checked={highFever} onChange={(e) => setHighFever(e.target.checked)} /> High fever</label><button onClick={runTriage}>{strings[lang].evaluate}</button>{result && <section className="card"><h2>{result.riskLevel.toUpperCase()}</h2><p>Likely condition: {result.likelyCondition}</p><p>Action: {result.recommendation}</p><button onClick={saveCurrentCase}>{strings[lang].saveOffline}</button></section>}{savedMessage && <p>{savedMessage}</p>}</main>);
}
