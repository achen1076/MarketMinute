import { auth } from "@/auth";
import ChatInterface from "@/components/molecules/ChatInterface";
import ChatInfo from "@/components/pages/ChatInfo";

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <ChatInfo />;
  }

  return <ChatInterface userId={session.user.id} />;
}
