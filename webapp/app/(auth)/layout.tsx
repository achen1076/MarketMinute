import type { ReactNode } from "react";

export const metadata = {
  title: "Sign In",
  description: "Sign in to access your personalized market dashboard",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
