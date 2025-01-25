import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NoteList from "./components/NoteList"
import NoteForm from "./components/NoteForm"
import SearchBar from "./components/SearchBar"
import ThemeToggle from "./components/ThemeToggle"
import Analytics from "./components/Analytics"
import PomodoroTimer from "./components/PomodoroTimer"
import KanbanBoard from "./components/KanbanBoard"
import MindMap from "./components/MindMap"
import DocumentOutline from "./components/DocumentOutline"
import MeetingScheduler from "./components/MeetingScheduler"
import AIWritingAssistant from "./components/AIWritingAssistant"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <h1 className="text-2xl font-bold text-primary">Online Notepad</h1>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <SearchBar />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="container py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-xl font-semibold mb-4">Add New Note</h2>
              <NoteForm />
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-xl font-semibold mb-4">Pomodoro Timer</h2>
              <PomodoroTimer />
            </div>
          </div>
          <div className="md:col-span-2">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="active">Active Notes</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
                <TabsTrigger value="kanban">Kanban</TabsTrigger>
                <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
                <TabsTrigger value="outline">Outline</TabsTrigger>
                <TabsTrigger value="meetings">Meetings</TabsTrigger>
                <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="mt-6">
                <NoteList isArchived={false} />
              </TabsContent>
              <TabsContent value="archived" className="mt-6">
                <NoteList isArchived={true} />
              </TabsContent>
              <TabsContent value="kanban" className="mt-6">
                <KanbanBoard />
              </TabsContent>
              <TabsContent value="mindmap" className="mt-6">
                <MindMap />
              </TabsContent>
              <TabsContent value="outline" className="mt-6">
                <DocumentOutline noteId="default" initialOutline={[]} />
              </TabsContent>
              <TabsContent value="meetings" className="mt-6">
                <MeetingScheduler />
              </TabsContent>
              <TabsContent value="ai-assistant" className="mt-6">
                <AIWritingAssistant />
              </TabsContent>
              <TabsContent value="analytics" className="mt-6">
                <Analytics />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

