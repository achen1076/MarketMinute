import { Metadata } from "next";
import StockSearchClient from "./StockSearchClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Stocks",
  description:
    "Search for any stock and get detailed market information, charts, and AI-powered explanations.",
};

export default async function StockPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }
  return <StockSearchClient />;
}
