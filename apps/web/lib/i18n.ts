export type Lang = "en" | "ha" | "yo" | "ig";

export const strings = {
  en: {
    title: "Asibi", triage: "Start Triage", cases: "My Cases", dashboard: "Dashboard", language: "Language",
    online: "Online", offline: "Offline", unsynced: "Unsynced cases",
    triageTitle: "Triage", triageHint: "Select symptoms and tap evaluate.", evaluate: "Evaluate", saveOffline: "Save Case Offline",
    casesTitle: "My Cases", sync: "Sync Unsynced Cases", status: "Status", nextRetry: "Next retry",
    dashTitle: "Supervisor Dashboard", riskFilter: "Risk level filter", loadSummary: "Load Summary"
  },
  ha: {
    title: "Asibi", triage: "Fara Tantancewa", cases: "Shari'ata", dashboard: "Dashboard", language: "Harshe",
    online: "A kan layi", offline: "Ba a kan layi ba", unsynced: "Shari'un da ba a daidaita ba",
    triageTitle: "Tantancewa", triageHint: "Zaɓi alamomi sannan danna tantance.", evaluate: "Tantance", saveOffline: "Ajiye shari'a ba tare da intanet ba",
    casesTitle: "Shari'ata", sync: "Daidaita waɗanda ba a daidaita ba", status: "Matsayi", nextRetry: "Lokacin sake gwadawa",
    dashTitle: "Dashboard na Mai Kula", riskFilter: "Tace matakin haɗari", loadSummary: "Loda Taƙaitaccen Bayani"
  },
  yo: {
    title: "Asibi", triage: "Bẹrẹ Ayẹwo", cases: "Awọn Iṣẹlẹ Mi", dashboard: "Dasibodu", language: "Èdè",
    online: "Lori Ayelujara", offline: "Kò sí Ayelujara", unsynced: "Awọn ìṣẹ̀lẹ̀ tí kò tíì bá mu",
    triageTitle: "Ayẹwo", triageHint: "Yan aami aisan ki o tẹ ayẹwo.", evaluate: "Ṣe Ayẹwo", saveOffline: "Fipamọ ìṣẹ̀lẹ̀ láìsí ayélujára",
    casesTitle: "Awọn Iṣẹlẹ Mi", sync: "Ba awọn ti kò tíì bá mu", status: "Ipo", nextRetry: "Akoko igbiyanju to tẹle",
    dashTitle: "Dasibodu Alabojuto", riskFilter: "Asẹ ipele ewu", loadSummary: "Gba Akopọ"
  },
  ig: {
    title: "Asibi", triage: "Malite Nyocha", cases: "Akụkọ M", dashboard: "Dashboard", language: "Asụsụ",
    online: "N'ịntanet", offline: "Anọghị n'ịntanet", unsynced: "Akụkọ ndị a na-emebeghị syncing",
    triageTitle: "Nyocha", triageHint: "Họrọ mgbaàmà ma pịa nyochaa.", evaluate: "Nyochaa", saveOffline: "Chekwaa akụkọ na-enweghị ịntanet",
    casesTitle: "Akụkọ M", sync: "Sync akụkọ ndị na-emebeghị", status: "Ọnọdụ", nextRetry: "Oge nwalee ọzọ",
    dashTitle: "Dashboard Onye Nlekọta", riskFilter: "Nyocha ọkwa ihe ize ndụ", loadSummary: "Bute Nchịkọta"
  }
} as const;

// Read persisted language on the client; default to English for SSR/unknown values.
export function getSavedLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem("asibi_lang");
  return v === "ha" || v === "yo" || v === "ig" ? v : "en";
}

// Persist the user-selected language so it survives refreshes.
export function saveLang(lang: Lang) {
  if (typeof window !== "undefined") window.localStorage.setItem("asibi_lang", lang);
}
