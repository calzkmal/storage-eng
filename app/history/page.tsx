import HistoryView from "@/components/HistoryView";

export const metadata = { title: "Your history" };

/** The profile lives in the browser, so the history is fetched client-side. */
export default function HistoryPage() {
  return <HistoryView />;
}
