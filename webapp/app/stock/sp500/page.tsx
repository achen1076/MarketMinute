import StockDetailClient from "../[ticker]/StockDetailClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SP500Page() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }
  return <StockDetailClient ticker="^GSPC" displayName="S&P 500" />;
}
