import { CheckCircle2 } from "lucide-react";

export function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-muted/50 border border-border hover:border-teal-500/30 transition-colors">
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export function StepCard({
  number,
  title,
  description,
  features,
}: {
  number: string;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-card border border-border">
      <div className="shrink-0 w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center text-2xl font-bold text-teal-400">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="grid grid-cols-2 gap-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExampleStep({
  time,
  action,
  result,
}: {
  time: string;
  action: string;
  result: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 px-3 py-1 h-fit rounded-lg text-sm font-semibold bg-teal-500/10 text-teal-400">
        {time}
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground mb-1">{action}</p>
        <p className="text-sm text-muted-foreground">{result}</p>
      </div>
    </div>
  );
}

export function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-muted/50 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
}
