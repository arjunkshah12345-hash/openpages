import type { Metadata } from "next";
import { LandingPageV2 } from "@/components/v2/landing-page";

export const metadata: Metadata = {
  title: {
    absolute: "OpenPages — Make room for your next idea",
  },
  description:
    "The open-source alternative to OpenAI Pages. Your notes, knowledge, and AI in one workspace — with SuperCompress so context stays focused.",
};

export default function Page() {
  return <LandingPageV2 />;
}
