import StockDetailClient from "./StockDetailClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ ticker: string }>;
};

export default async function StockPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const { ticker } = await params;
  return <StockDetailClient ticker={ticker.toUpperCase()} />;
}
