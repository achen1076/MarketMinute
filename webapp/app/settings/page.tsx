import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsContent from "./SettingsContent";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
  }

  // Check if user has password-based auth
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      password: true,
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  });

  const hasPassword = !!user?.password;
  const hasGoogleAccount = user?.accounts.some(
    (account) => account.provider === "google"
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <SettingsContent
        user={session.user}
        canChangePassword={hasPassword && !hasGoogleAccount}
      />
    </div>
  );
}
