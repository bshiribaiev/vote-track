import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
    title: "Personalized Ballot",
    description:
      "See only the elections you're eligible to vote in, filtered by your address, district, and party affiliation.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Candidate Alignment",
    description:
      "Compare candidates on the issues you care about with color-coded topic matching and stance timelines.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    ),
    title: "RCV Simulator",
    description:
      "Practice ranked-choice voting with a drag-and-drop tool before you head to the polls.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    title: "AI-Powered Insights",
    description:
      "Ask questions about any candidate and get sourced, cited answers powered by Google Gemini.",
  },
];

const upcomingElections = [
  {
    title: "Manhattan CD3 Special Election",
    date: "April 28, 2026",
    type: "Special",
    rcv: true,
    daysUntil: 31,
    description: "Ranked-choice voting to fill the vacant City Council seat in Lower Manhattan.",
  },
  {
    title: "NYS Primary Elections",
    date: "June 23, 2026",
    type: "Primary",
    rcv: false,
    daysUntil: 87,
    description: "Statewide primaries for Governor, Attorney General, and state legislature.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-to-br from-primary/8 via-blue-400/5 to-sky-500/3 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-gradient-to-l from-blue-500/5 to-transparent rounded-full blur-3xl" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(90deg, #1e3a5f 1px, transparent 1px), linear-gradient(#1e3a5f 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        </div>

        <div className="mx-auto max-w-6xl px-6 pt-28 pb-24">
          <div className="flex flex-col items-center text-center gap-8 animate-fade-in">
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm font-medium border-primary/20 text-primary bg-primary/5"
            >
              Now tracking the 2026 NYC election cycle
            </Badge>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1]">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Know your ballot.
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                Vote with confidence.
              </span>
            </h1>

            <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              VoteTrack maps your address to your districts, matches candidates
              to your interests, and uses AI to help you cut through the noise
              &mdash; all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 h-12 text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Get started free
                </Button>
              </Link>
              <Link href="#elections">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 h-12 text-base rounded-xl"
                >
                  View upcoming elections
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                100% free & open
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                Non-partisan
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                Real-time data
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Elections */}
      <section id="elections" className="px-6 py-24 civic-bg">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-widest">
              Coming up
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Upcoming Elections
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Stay ahead of every election in New York City. We track dates,
              candidates, and early voting windows so you never miss a vote.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto stagger-children">
            {upcomingElections.map((election) => (
              <div
                key={election.title}
                className="group relative bg-white rounded-2xl border border-border/60 p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    className={
                      election.type === "Special"
                        ? "bg-primary/10 text-primary border-0 hover:bg-primary/10"
                        : "bg-amber-500/10 text-amber-600 border-0 hover:bg-amber-500/10"
                    }
                  >
                    {election.type}
                  </Badge>
                  {election.rcv && (
                    <Badge variant="outline" className="border-primary/20 text-primary text-xs">
                      Ranked Choice
                    </Badge>
                  )}
                  <span className="ml-auto text-xs font-medium text-muted-foreground bg-gray-100 px-2.5 py-1 rounded-full">
                    {election.daysUntil}d
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {election.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {election.description}
                </p>
                <div className="flex items-center text-sm font-medium text-foreground/70">
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  {election.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-widest">
              Everything you need
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Built for informed voters
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              From finding your districts to practicing ranked-choice voting,
              VoteTrack gives you the tools to participate with confidence.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 max-w-4xl mx-auto stagger-children">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4 group">
                <div className="shrink-0 h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-200">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-24 bg-gradient-to-b from-primary/[0.03] to-slate-50/80 overflow-hidden">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to find your ballot?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Enter your address, pick your interests, and see exactly who&apos;s on
            your ballot in under two minutes.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="px-10 h-12 text-base rounded-xl shadow-lg shadow-primary/25">
              Get started free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">V</span>
            </div>
            <span className="text-sm font-medium">VoteTrack</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for the 2026 NYC Election Cycle &mdash; Non-partisan &amp;
            open source
          </p>
        </div>
      </footer>
    </main>
  );
}
