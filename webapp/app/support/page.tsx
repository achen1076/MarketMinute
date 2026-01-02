import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SupportForm from "./SupportForm";
import { HeadphonesIcon, Mail, MessageSquare } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support & Feedback",
  description:
    "Get help with MarketMinute. Contact our support team for assistance with your account, features, or to share feedback about our platform.",
  alternates: {
    canonical: "https://marketminute.io/support",
  },
};

export default async function SupportPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] relative">
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-8">
        {/* Left side - Support info */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-3 text-teal-400 mb-4">
            <HeadphonesIcon className="w-10 h-10" />
            <h1 className="text-4xl font-bold bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Support & Feedback
            </h1>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            We're{" "}
            <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              here to help
            </span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-xl">
            Need assistance or have feedback to share? We'd love to hear from
            you. Send us a message and we'll get back to you as soon as
            possible.
          </p>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <div className="flex items-start gap-3 text-left">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Email</h3>
                <p className="text-xs text-muted-foreground">
                  marketminuteapp@gmail.com
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-left">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Response Time
                </h3>
                <p className="text-xs text-muted-foreground">
                  Usually within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Support form */}
        <div className="w-full lg:w-auto lg:shrink-0">
          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8 lg:p-10 w-full lg:w-[480px]">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Get in Touch
              </h3>
              <p className="text-muted-foreground">
                Choose support or feedback and share your thoughts
              </p>
            </div>

            <SupportForm userEmail={session.user.email} />
          </div>
        </div>
      </div>
    </div>
  );
}
