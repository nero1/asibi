import { z } from "zod";

export const symptomClusterSchema = z.enum([
  "fever",
  "breathing",
  "vomiting_diarrhea",
  "confusion_collapse",
  "skin_rash",
  "other"
]);

export const triageInputSchema = z.object({
  cluster: symptomClusterSchema,
  childUnderFive: z.boolean(),
  unconscious: z.boolean(),
  severeDehydration: z.boolean(),
  highFever: z.boolean()
});

export type TriageInput = z.infer<typeof triageInputSchema>;

export type TriageResult = {
  riskLevel: "monitor" | "treat_local" | "refer" | "urgent" | "emergency";
  likelyCondition: string;
  recommendation: string;
};

// Decision order matters: the first matching branch sets the highest applicable urgency.
export function evaluateTriage(input: TriageInput): TriageResult {
  if (input.unconscious) {
    return {
      riskLevel: "emergency",
      likelyCondition: "Severe acute illness",
      recommendation: "Immediate emergency escalation"
    };
  }

  if (input.severeDehydration || (input.highFever && input.childUnderFive)) {
    return {
      riskLevel: "urgent",
      likelyCondition: "High-risk febrile/dehydration syndrome",
      recommendation: "Urgent referral to clinic"
    };
  }

  if (input.cluster === "breathing" || input.highFever) {
    return {
      riskLevel: "refer",
      likelyCondition: "Respiratory or febrile illness",
      recommendation: "Refer to clinic within same day"
    };
  }

  return {
    riskLevel: "monitor",
    likelyCondition: "Mild non-specific symptoms",
    recommendation: "Monitor with follow-up and hydration advice"
  };
}
