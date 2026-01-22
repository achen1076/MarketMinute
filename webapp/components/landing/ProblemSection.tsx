import { FileText, Share2, DollarSign } from "lucide-react";

function ProblemCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card">
      <div className="w-14 h-14 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export function ProblemSection() {
  return (
    <section className="px-4 py-20 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The Problem with Financial Analysis Today
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you&apos;re at a bulge bracket or managing your own
            portfolio, the workflow is broken.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <ProblemCard
            icon={<FileText className="w-8 h-8" />}
            title="Data Friction"
            description="Copy-pasting from 10-Ks to Excel is slow and error-prone. Junior analysts spend 80% of their time on data entry, not analysis."
          />
          <ProblemCard
            icon={<Share2 className="w-8 h-8" />}
            title="Static Sharing"
            description="Screenshots of charts don't let peers test assumptions. Email chains of Excel files create version control nightmares."
          />
          <ProblemCard
            icon={<DollarSign className="w-8 h-8" />}
            title="Pricing Gap"
            description="Bloomberg costs $24k/year. Yahoo Finance is too basic. There's no middle ground for serious analysis on a budget."
          />
        </div>
      </div>
    </section>
  );
}
