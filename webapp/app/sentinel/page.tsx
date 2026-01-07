import { auth } from "@/auth";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import SentinelDashboardClient from "./SentinelDashboardClient";
import SentinelInfo from "@/components/pages/SentinelInfo";

export const metadata: Metadata = {
  title: "MarketMinute | Sentinel Dashboard",
  description:
    "MarketMinute's Sentinel Dashboard provides real-time market anomaly detection and AI-powered insights for traders and investors.",
  alternates: {
    canonical: "https://marketminute.io/sentinel",
  },
};

export default async function SentinelDashboard() {
  const session = await auth();

  if (!session?.user?.email) {
    return <SentinelInfo />;
  }

  // Fetch latest report
  const latestReport = await prisma.sentinelReport.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      summary: true,
      keyDrivers: true,
      macroContext: true,
      scenarioQuestions: true,
      whatThisMeans: true,
      indexMove: true,
      sectorRotation: true,
      macroSurprise: true,
      volSpike: true,
      vix: true,
      vixChangePct: true,
      realizedVol: true,
    },
  });

  // Fetch recent reports for history
  const reports = await prisma.sentinelReport.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      summary: true,
      keyDrivers: true,
      macroContext: true,
      scenarioQuestions: true,
      whatThisMeans: true,
      indexMove: true,
      sectorRotation: true,
      macroSurprise: true,
      volSpike: true,
      vix: true,
      vixChangePct: true,
      realizedVol: true,
      context: true,
    },
  });

  return (
    <SentinelDashboardClient latestReport={latestReport} reports={reports} />
  );
}
