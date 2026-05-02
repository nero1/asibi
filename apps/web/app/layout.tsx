import type { Metadata } from "next";
import ServiceWorkerRegister from "./sw-register";
import SyncAgent from "./sync-agent";
import "./styles.css";

export const metadata: Metadata = {
  title: "Asibi",
  description: "Offline-first CHW climate triage PWA"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        <SyncAgent />
        {children}
      </body>
    </html>
  );
}

