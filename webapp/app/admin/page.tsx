import { auth } from "@/auth";
import { redirect } from "next/navigation";
import QuantScriptRunner from "@/components/organisms/QuantScriptRunner";

// Configure admin emails
const ADMIN_EMAILS = ["achen1076@gmail.com"];

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Admin Panel
          </h1>
          <p className="text-slate-400">Manage quant models and predictions</p>
        </div>

        <QuantScriptRunner />
      </div>
    </div>
  );
}
