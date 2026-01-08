import StockDetailClient from "../[ticker]/StockDetailClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function NasdaqPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }
  return <StockDetailClient ticker="^IXIC" displayName="NASDAQ Composite" />;
}
