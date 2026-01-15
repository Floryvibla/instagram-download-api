"use client"

import { useState } from "react"
import useSWRMutation from "swr/mutation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Linkedin, 
  Instagram, 
  Globe, 
  Search, 
  User, 
  Building2, 
  FileText, 
  Download, 
  Activity,
  ChevronRight,
  Loader2
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// --- Fetcher for SWR ---
async function fetcher(url: string, { arg }: { arg: Record<string, any> }) {
  const params = new URLSearchParams()
  Object.entries(arg).forEach(([key, value]) => {
    if (value) params.append(key, String(value))
  })
  
  const queryString = params.toString()
  const fullUrl = queryString ? `${url}?${queryString}` : url
  
  const res = await fetch(fullUrl)
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || "An error occurred")
  }
  return res.json()
}

// --- Components ---

const ResponseViewer = ({ data, error, isLoading }: { data: any, error: any, isLoading: boolean }) => {
  return (
    <div className="mt-6 rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-zinc-100/50 dark:bg-zinc-800/50">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Response</span>
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        {!isLoading && data && <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-200">Success</Badge>}
        {!isLoading && error && <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-200">Error</Badge>}
      </div>
      <ScrollArea className="h-[300px] w-full p-4 font-mono text-xs">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin opacity-20" />
              <span>Processing request...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-red-500 whitespace-pre-wrap">{error.message}</div>
        ) : data ? (
          <pre className="text-zinc-700 dark:text-zinc-300">{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground opacity-50">
            Waiting for request...
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// --- LinkedIn Playground ---
const LinkedinPlayground = () => {
  const [mode, setMode] = useState<"account" | "contact" | "company" | "search" | "posts">("account")
  const [identifier, setIdentifier] = useState("")
  const [field, setField] = useState("profile")
  const [query, setQuery] = useState("")
  
  const endpoints = {
    account: "/api/linkedin/account",
    contact: "/api/linkedin/account/contact",
    company: "/api/linkedin/company",
    search: "/api/linkedin/search",
    posts: "/api/linkedin/posts"
  }

  const { trigger, data, error, isMutating } = useSWRMutation(
    endpoints[mode],
    fetcher
  )

  const handleExecute = () => {
    const args: Record<string, any> = {}
    
    if (mode === "account") {
      args.identifier = identifier
      if (field !== "profile") args.field = field // Optional param logic if supported by API, checking route mapping...
      // Actually /api/linkedin/account takes identifier and field query params
    } else if (mode === "contact") {
      args.identifier = identifier
    } else if (mode === "company") {
      args.identifier = identifier
    } else if (mode === "search") {
      args.q = query
      args.field = "people" // default for now
    }
    // posts takes no args currently
    
    trigger(args)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-4">
          <div className="space-y-2">
            <Label>Operation Mode</Label>
            <Select value={mode} onValueChange={(v: any) => setMode(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="account">Profile Data</SelectItem>
                <SelectItem value="contact">Contact Info</SelectItem>
                <SelectItem value="company">Company Data</SelectItem>
                <SelectItem value="search">Search People</SelectItem>
                <SelectItem value="posts">Recent Posts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {(mode === "account" || mode === "contact" || mode === "company") && (
                <div className="space-y-2">
                  <Label>Identifier (Username/URN)</Label>
                  <Input 
                    placeholder="e.g. billgates" 
                    value={identifier} 
                    onChange={(e) => setIdentifier(e.target.value)} 
                  />
                  <p className="text-[10px] text-muted-foreground">The public profile ID or Company URN.</p>
                </div>
              )}

              {mode === "account" && (
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select value={field} onValueChange={setField}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profile">Full Profile</SelectItem>
                      <SelectItem value="experiences">Experiences</SelectItem>
                      <SelectItem value="skills">Skills</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {mode === "search" && (
                <div className="space-y-2">
                  <Label>Search Query</Label>
                  <Input 
                    placeholder="e.g. Software Engineer at Google" 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <Button 
            className="w-full" 
            onClick={handleExecute} 
            disabled={isMutating}
          >
            {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronRight className="mr-2 h-4 w-4" />}
            Execute Request
          </Button>
        </div>

        <div className="md:col-span-2">
           <ResponseViewer data={data} error={error} isLoading={isMutating} />
        </div>
      </div>
    </div>
  )
}

// --- Instagram Playground ---
const InstagramPlayground = () => {
  const [url, setUrl] = useState("")
  
  const { trigger, data, error, isMutating } = useSWRMutation(
    "/api/instagram/download",
    fetcher
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label>Instagram Post/Reel URL</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="https://www.instagram.com/p/..." 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              className="flex-1"
            />
            <Button onClick={() => trigger({ url })} disabled={isMutating}>
              {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">Supports Posts, Reels, and TV. Public accounts only.</p>
        </div>

        <ResponseViewer data={data} error={error} isLoading={isMutating} />
      </div>
    </div>
  )
}

// --- Browser Playground ---
const BrowserPlayground = () => {
  const { trigger, data, error, isMutating } = useSWRMutation(
    "/api/browser",
    fetcher
  )

  return (
    <div className="space-y-4">
      <Card className="border-dashed shadow-none bg-zinc-50/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium">Browser Session Manager</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Initialize or check the status of the headless browser session used for scraping. 
              This helps ensure cookies are valid.
            </p>
          </div>
          <Button onClick={() => trigger({})} variant="outline" disabled={isMutating}>
            {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Activity className="mr-2 h-4 w-4" />
            Check & Initialize Session
          </Button>
        </CardContent>
      </Card>

      <ResponseViewer data={data} error={error} isLoading={isMutating} />
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">API Playground</h1>
          <p className="text-muted-foreground text-lg font-light">
            Test and validate data extraction endpoints in real-time.
          </p>
        </div>

        <Tabs defaultValue="linkedin" className="space-y-6">
          <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-lg backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50">
            <TabsTrigger value="linkedin" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">
              <Linkedin className="mr-2 h-4 w-4" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="instagram" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">
              <Instagram className="mr-2 h-4 w-4" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="browser" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">
              <Globe className="mr-2 h-4 w-4" />
              Browser
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="linkedin" asChild>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-xl shadow-zinc-200/50 dark:shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-blue-600 rounded-lg text-white">
                        <Linkedin className="h-5 w-5" />
                      </div>
                      LinkedIn Data Extraction
                    </CardTitle>
                    <CardDescription>
                      Access public profiles, company data, and search results via automation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LinkedinPlayground />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="instagram" asChild>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-xl shadow-zinc-200/50 dark:shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-orange-500 rounded-lg text-white">
                        <Instagram className="h-5 w-5" />
                      </div>
                      Instagram Downloader
                    </CardTitle>
                    <CardDescription>
                      Retrieve media links and metadata from Posts and Reels.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InstagramPlayground />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="browser" asChild>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-xl shadow-zinc-200/50 dark:shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-600 rounded-lg text-white">
                        <Activity className="h-5 w-5" />
                      </div>
                      System Status
                    </CardTitle>
                    <CardDescription>
                      Monitor and manage the headless browser instance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BrowserPlayground />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  )
}
