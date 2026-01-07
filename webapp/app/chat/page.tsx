import { auth } from "@/auth";
import ChatInterface from "@/components/molecules/ChatInterface";
import ChatInfo from "@/components/pages/ChatInfo";

export const metadata = {
  title: "MarketMinute | Chat",
  description:
    "Talk to MarketMinute's AI assistant for personalized market insights and stock analysis. Customized to your watchlists.",
};

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <ChatInfo />;
  }

  return <ChatInterface userId={session.user.id} />;
}
