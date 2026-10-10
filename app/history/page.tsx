import { Suspense } from "react";
import HistoryView from "@/components/HistoryView";

export const metadata = { title: "Your history" };

/** The profile lives in the browser, so the history is fetched client-side. */
export default function HistoryPage() {
  return <Suspense fallback={<p>Memuat riwayat…</p>}><HistoryView /></Suspense>;
}
