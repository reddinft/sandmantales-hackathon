import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Mic, Loader2 } from "lucide-react"

export function StoryCreator() {
  const [text, setText] = useState("")
  const [language, setLanguage] = useState("EN")
  const [isLoading, setIsLoading] = useState(false)
  const [progressText, setProgressText] = useState("")

  const handleCreateStory = () => {
    if (!text.trim()) return
    
    setIsLoading(true)
    setProgressText("Generating story...")
    
    // Simulate progress
    setTimeout(() => {
      setProgressText("Creating illustrations...")
      setTimeout(() => {
        setProgressText("Recording narration...")
        setTimeout(() => {
          setIsLoading(false)
          setProgressText("")
        }, 2000)
      }, 2000)
    }, 2000)
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-auto">
      <div className="space-y-4">
        <Input
          placeholder="Enter your story idea..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white"
          disabled={isLoading}
        />

        <Select value={language} onValueChange={setLanguage} disabled={isLoading}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="EN">English</SelectItem>
            <SelectItem value="JA">Japanese</SelectItem>
            <SelectItem value="FR">French</SelectItem>
            <SelectItem value="HI">Hindi</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            disabled={isLoading}
          >
            <Mic className="h-4 w-4 text-indigo-500" />
          </Button>

          <Button
            className="bg-indigo-500 hover:bg-indigo-600 flex-1"
            onClick={handleCreateStory}
            disabled={isLoading || !text.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {progressText}
              </>
            ) : (
              "Create Story"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}