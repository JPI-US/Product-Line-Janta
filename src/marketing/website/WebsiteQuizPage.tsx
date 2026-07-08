import { SavingsPage } from "../../quiz/SavingsPage";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { useDocumentMeta } from "../../lib/useDocumentMeta";

export default function WebsiteQuizPage() {
  useDocumentMeta({
    title: "Solar Savings Estimate",
    description:
      "Estimate how much you could save with Janta Power three-dimensional solar in a few quick steps.",
  });
  return (
    <WebsiteMarketingShell variant="standard">
      <SavingsPage />
    </WebsiteMarketingShell>
  );
}
