import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import axios from "axios";
import { db } from "@/firebase";

interface ProjectChatProps {
  projectId: string;
  suggestions: any;
  project: {
    name: string;
    description: string;
    duration: number;
  };
  onUpdateSuggestions: (newSuggestions: any) => void;
}

export default function ProjectChat({
  projectId,
  suggestions,
  project,
  onUpdateSuggestions,
}: ProjectChatProps) {
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    // Load chat history when component mounts
    const loadChatHistory = async () => {
      const projectRef = doc(db, "projects", projectId);
      const projectDoc = await getDoc(projectRef);
      if (projectDoc.exists() && projectDoc.data().chatHistory) {
        setChatHistory(projectDoc.data().chatHistory);
      }
    };

    loadChatHistory();
  }, [projectId]);

  const handleChatWithAI = async (message: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/chat-suggestions", {
        suggestions,
        projectContext: {
          name: project.name,
          description: project.description,
          duration: project.duration,
          userMessage: message,
        },
      });

      if (response.data) {
        const newChat = {
          user: message,
          ai: response.data,
          timestamp: new Date().toISOString(),
        };

        setChatHistory((prev) => [...prev, newChat]);

        // Update project suggestions and chat history in Firebase
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
          suggestions: response.data.updatedSuggestions,
          chatHistory: arrayUnion(newChat),
        });

        // Update parent component with new suggestions
        onUpdateSuggestions(response.data.updatedSuggestions);
      }
    } catch (error) {
      console.error(
        "Error chatting with AI:",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsLoading(false);
      setUserInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      handleChatWithAI(userInput);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col justify-between bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800">AI Assistant</h2>
      </div>
      
      {/* Chat History Section - Fixed height with scroll */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {chatHistory.length > 0 ? (
          chatHistory.map((chat, index) => (
            <div key={index} className="space-y-6">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white p-5 rounded-2xl rounded-tr-none max-w-[80%] shadow-md">
                  <p className="text-base font-bold mb-2">You</p>
                  <p className="text-base leading-relaxed">{chat.user}</p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start">
                <div className="bg-gray-100 p-5 rounded-2xl rounded-tl-none max-w-[80%] shadow-md">
                  <p className="text-base font-bold text-gray-800 mb-2">AI Assistant</p>
                  <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {chat.ai.explanation}
                  </p>
                  <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                    <p className="font-bold text-gray-800 mb-3 text-base">Updated Suggestions:</p>
                    <pre className="text-sm text-gray-700 overflow-x-auto custom-scrollbar max-h-[200px] leading-relaxed">
                      {JSON.stringify(chat.ai.updatedSuggestions, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-xl font-bold mb-3">No messages yet</p>
              <p className="text-base text-gray-600">Start a conversation with the AI Assistant</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Form - Fixed at bottom */}
      <div className="border-t p-6 bg-gray-50">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <textarea
              id="chatInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full px-5 py-4 text-base text-gray-700 rounded-t-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none border-b"
              rows={3}
              placeholder="Ask for specific changes or improvements..."
              disabled={isLoading}
            />
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
              <button
                type="submit"
                disabled={isLoading || !userInput.trim()}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 
                  transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed
                  font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}