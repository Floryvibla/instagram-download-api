import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800">
            <Terminal className="w-12 h-12 text-zinc-900 dark:text-zinc-50" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
            API Tools
          </h1>
          <p className="text-lg text-muted-foreground">
            A minimalist toolkit for LinkedIn and Instagram data extraction.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/playground">
            <Button size="lg" className="w-full sm:w-auto rounded-full px-8 text-base shadow-lg shadow-blue-500/20">
              Open Playground
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/api/browser">
             <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 text-base">
              Check Status
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
