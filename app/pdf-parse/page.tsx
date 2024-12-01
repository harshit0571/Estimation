"use client";

import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ProjectEstimate {
  title: string;
  duration: {
    days: number;
  };
  team: {
    developers: number;
    designers: number;
  };
  budget: {
    total: number;
    breakdown: {
      development: number;
      testing: number;
      deployment: number;
      design: number;
    };
  };
  modules: Array<{
    name: string;
    submodules: Array<{
      name: string;
      time: number;
    }>;
  }>;
}

interface ProjectReference {
  project_name: string;
  module_name: string;
  time_taken: number;
  team?: {
    developers: number;
    designers: number;
  };
}

export default function PDFParsePage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<ProjectEstimate | null>(null);
  const [correction, setCorrection] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const [team, setTeam] = useState({
    developers: 0,
    designers: 0
  });
  const [duration, setDuration] = useState({
    days: 0
  });

  const calculateHours = (days: number) => days * 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/pdfresponse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          team,
          duration,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setChatHistory([
        ...chatHistory,
        {
          role: "user",
          content: input,
          timestamp: new Date(),
        },
        {
          role: "assistant",
          content: JSON.stringify(data, null, 2),
          timestamp: new Date(),
        },
      ]);
      setInput("");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate estimate. Please try again.");
    }
  };

  const handleCorrection = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/pdfresponse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentFields: response,
          correction: correction,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setChatHistory([
        ...chatHistory,
        {
          role: "user",
          content: correction,
          timestamp: new Date(),
        },
        {
          role: "assistant",
          content: JSON.stringify(data, null, 2),
          timestamp: new Date(),
        },
      ]);
      setCorrection("");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to apply corrections. Please try again.");
    }
  };

  

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Project Estimator</h1>

      {/* Team and Duration Input Form */}
      <div className="mb-8 grid grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">Team Composition</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Developers</label>
              <input
                type="number"
                min="0"
                value={team.developers}
                onChange={(e) => setTeam({ ...team, developers: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Designers</label>
              <input
                type="number"
                min="0"
                value={team.designers}
                onChange={(e) => setTeam({ ...team, designers: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">Project Duration</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Days</label>
              <input
                type="number"
                min="0"
                value={duration.days}
                onChange={(e) => setDuration({ days: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded"
              />
            </div>
            {duration.days > 0 && (
              <div className="text-sm text-gray-600">
                Equivalent to {calculateHours(duration.days)} working hours
                <br />
                <span className="text-xs">(Based on 8-hour workdays)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Initial Input Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4"
          rows={6}
          placeholder="Enter your project description..."
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Generate Estimate
        </button>
      </form>

      {/* Response Display */}
      {response && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Estimate:</h2>

          {/* Team and Duration Summary */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Team Composition</h3>
              <ul className="space-y-1">
                <li>Developers: {response.team.developers}</li>
                <li>Designers: {response.team.designers}</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Project Duration</h3>
              <p>
                {response.duration.days} days
              </p>
            </div>
          </div>

          {/* Existing JSON display */}
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      {/* Correction Form */}
      {response && (
        <form onSubmit={handleCorrection} className="mb-8">
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4"
            rows={4}
            placeholder="Enter any corrections or adjustments..."
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Submit Correction
          </button>
        </form>
      )}

      {/* Chat History */}
      {chatHistory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Chat History</h2>
          <div className="space-y-4">
            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === "user" ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <div className="font-semibold mb-2">
                  {message.role === "user" ? "You" : "Assistant"}:
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {message.timestamp.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
