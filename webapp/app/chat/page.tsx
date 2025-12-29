import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/molecules/ChatInterface";

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  return <ChatInterface userId={session.user.id} />;
}
