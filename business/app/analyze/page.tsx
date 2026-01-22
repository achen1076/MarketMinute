import { auth } from "@/auth";
import { AnalyzeLanding } from "@shared/components/landing/AnalyzeLanding";
import { AnalyzeClient } from "@shared/components/pages/AnalyzeClient";

export default async function AnalyzePage() {
  const session = await auth();

  if (!session?.user?.email) {
    return <AnalyzeLanding />;
  }

  return <AnalyzeClient />;
}
