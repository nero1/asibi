"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/onboarding";
import { getSavedLang } from "@/lib/i18n";

export default function OnboardingPage() {
  const router = useRouter();
  const lang = getSavedLang();

  const [step, setStep] = useState<"consent" | "profile">("consent");
  const [clinicCode, setClinicCode] = useState("");
  const [chwId, setChwId] = useState("");
  const [agreed, setAgreed] = useState(false);

  void lang; // used via getSavedLang for future i18n of this screen

  function acceptConsent() {
    if (!agreed) return;
    setStep("profile");
  }

  function completeOnboarding() {
    saveProfile({ clinicCode: clinicCode.trim() || undefined, chwId: chwId.trim() || undefined, consentedAt: new Date().toISOString() });
    router.push("/app");
  }

  if (step === "consent") {
    return (
      <main className="container">
        <h1>Welcome to Asibi</h1>
        <p>Asibi is an offline-capable triage support tool for Community Health Workers. Before you begin, please read and accept the following.</p>

        <section className="card">
          <h2>Data &amp; Privacy Policy</h2>
          <p>This app stores <strong>anonymous triage case records</strong> on your device. No patient names, phone numbers, or national IDs are collected.</p>
          <p>When your device goes online, case records are synced to a secure server to support health program monitoring. Records include:</p>
          <ul>
            <li>Symptom cluster and follow-up answers</li>
            <li>Triage result and risk level</li>
            <li>Patient age range and sex (optional)</li>
            <li>Date and approximate location (if permitted)</li>
          </ul>
          <p>Case records are protected by Row Level Security. Only authorised supervisors within your program can view your cases.</p>
        </section>

        <section className="card">
          <h2>Clinical Disclaimer</h2>
          <p>Asibi supports CHW decision-making. It does <strong>not</strong> replace clinical judgment. Always refer to a qualified clinician when in doubt. Follow your program&apos;s clinical guidelines at all times.</p>
        </section>

        <label style={{ display: "flex", alignItems: "flex-start", gap: ".75rem", fontWeight: "normal", cursor: "pointer" }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: "auto", marginTop: ".2rem" }} />
          <span>I have read and understood the data policy and clinical disclaimer above.</span>
        </label>

        <button className="btn-primary btn-save" onClick={acceptConsent} disabled={!agreed}>
          Accept and Continue
        </button>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Your Profile</h1>
      <p>These details help link your cases to the right program. Both fields are optional — you can skip them.</p>

      <section className="card">
        <label>Clinic or facility code <span style={{ color: "#64748b", fontWeight: "normal" }}>(optional)</span></label>
        <input
          value={clinicCode}
          onChange={(e) => setClinicCode(e.target.value)}
          placeholder="e.g. KAN-001"
          maxLength={40}
        />
        <label style={{ marginTop: "1rem" }}>CHW identification number <span style={{ color: "#64748b", fontWeight: "normal" }}>(optional)</span></label>
        <input
          value={chwId}
          onChange={(e) => setChwId(e.target.value)}
          placeholder="e.g. CHW-2024-042"
          maxLength={40}
        />
      </section>

      <button className="btn-primary btn-save" onClick={completeOnboarding}>
        Start Using Asibi
      </button>
    </main>
  );
}
