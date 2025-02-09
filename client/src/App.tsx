import { useState } from "react";
import { Send, LucideSquareTerminal, Clock } from "lucide-react";

type Message = {
  id: string;
  timestamp: string;
  segments: {
    timeRange: string;
    text: string;
  }[];
  title: string;
  description: string;
};

interface TranscriptSegment {
  timestamp: string;
  text: string;
}

const timeToSeconds = (time: string): number => {
  let parts = time.split(':').map(Number);
  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0];
};

const groupTranscript = (content: TranscriptSegment[]) => {
  if (!Array.isArray(content) || content.length === 0) {
    return [];
  }

  let groupedTranscript = [];
  let tempText = "";
  let startTime = content[0].timestamp || "0:00";
  let endTime = "";

  content.forEach((segment, index) => {
    if (!segment.timestamp || !segment.text) return;

    let currentTime = timeToSeconds(segment.timestamp);
    let startTimeSec = timeToSeconds(startTime);

    if (currentTime - startTimeSec < 18) {
      tempText += " " + segment.text;
    } else {
      endTime = content[index - 1]?.timestamp || segment.timestamp;
      groupedTranscript.push({
        timeRange: `${startTime} - ${endTime}`,
        text: tempText.trim()
      });
      startTime = segment.timestamp;
      tempText = segment.text;
    }
  });

  if (tempText) {
    endTime = content[content.length - 1]?.timestamp || startTime;
    groupedTranscript.push({
      timeRange: `${startTime} - ${endTime}`,
      text: tempText.trim()
    });
  }

  return groupedTranscript;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const processUrl = async () => {
    if (!inputValue.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/process-url", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: inputValue }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate response data
      if (!data) {
        throw new Error("No data received from server");
      }

      if (!data.transcript || !Array.isArray(data.transcript)) {
        throw new Error(error);
      }

      const segments = groupTranscript(data.transcript);
      console.log(segments)

      if (segments.length === 0) {
        throw new Error("No transcript segments could be processed");
      }

      setMessages(prevMessages => [...prevMessages, {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        segments: segments,
        title: data.title || "Untitled",
        description: data.description || "No description available"
      }]);
      console.log(messages)
    } catch (err) {
      console.error("Error details:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
      setInputValue("");
    }
  };

  return (
    <div className="min-h-screen bg-black z-10 text-gray-200 flex flex-col">
<div className="inset-0 z-20 relative">
  <div className="absolute bottom-40 left-10 sm:left-50 sm:w-78 sm:h-78 w-56 h-56 rounded-[3rem]
    bg-[radial-gradient(ellipse_at_center,_rgba(128,0,128,0.3),_transparent)]
    backdrop-blur-3xl" />
</div>


      <header className="border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <LucideSquareTerminal className="w-6 h-6" />
          <span className="text-xl">Tubesage AI</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-4">TubeSage AI</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Interact with YouTube videos, tweets, and web content using AI
          </p>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-400 mb-4">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{message.timestamp}</span>
                </div>
                <h2 className="text-xl font-semibold mb-2">{message.title}</h2>
                <p className="text-gray-400 mb-4">{message.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {message.segments.map((segment, index) => (
                  <div
                    key={index}
                    className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                  >
                    <div className="text-sm text-blue-400 mb-2 font-mono">
                      {segment.timeRange}
                    </div>
                    <p className="text-gray-200">{segment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="border rounded-lg mx-auto w-full max-w-4xl border-gray-800 p-4 mb-4">
        <div className="relative">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter a YouTube, Twitter, or Website URL..."
              className="w-full bg-transparent py-3 px-4 pr-12 focus:outline-none"
            />
          </div>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            onClick={processUrl}
            disabled={loading}
          >
            {loading ? "..." : <Send className="w-5 h-5" />}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}

export default App;