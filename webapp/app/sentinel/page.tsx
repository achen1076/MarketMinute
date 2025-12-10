import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SentinelDashboardClient from "./SentinelDashboardClient";


export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SentinelDashboard() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
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
    },
  });

  return (
    <SentinelDashboardClient latestReport={latestReport} reports={reports} />
  );
}
