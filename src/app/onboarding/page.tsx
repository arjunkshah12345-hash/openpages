import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata: Metadata = {
  title: "Setup",
  description:
    "Connect SuperCompress, then bring your own inference — ChatGPT account, OpenAI API key, or any provider.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
