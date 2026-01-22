import Link from "next/link";

export function Footer() {
  return (
    <footer className="px-4 py-8 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Mintalyze</span>
          <span>Business</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="https://mintalyze.com/terms"
            className="hover:text-foreground transition"
          >
            Terms
          </Link>
          <Link
            href="https://mintalyze.com/privacy"
            className="hover:text-foreground transition"
          >
            Privacy
          </Link>
          <Link
            href="https://mintalyze.com/support"
            className="hover:text-foreground transition"
          >
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
