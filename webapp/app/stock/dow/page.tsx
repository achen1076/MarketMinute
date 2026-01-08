import StockDetailClient from "../[ticker]/StockDetailClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DowPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }
  return <StockDetailClient ticker="^DJI" displayName="Dow Jones" />;
}
