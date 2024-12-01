"use client";

import React, { useEffect, useState } from "react";

import Header from "@/components/ui/header";
import axios from "axios";

const Page = () => {
  const [result, setResult] = useState<any>("");
  const [input, setInput] = useState("");
  const [developers, setDevelopers] = useState<string>("");
  const [designers, setDesigners] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [final, setFinal] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/refactor-text", {
        input,
        developers: Number(developers) || 0,
        designers: Number(designers) || 0,
        duration: Number(duration) || 0,
      });
      setResult(response.data);
      console.log(result.module);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleGenerate = async () => {
    try {
      const response = await axios.post("/api/generate", {
        data: result.modules,
        duration: Number(duration) || 0,
      });
      console.log(result.modules);
      console.log("Generated response:", response.data);
      setFinal(response.data);
    } catch (error) {
      console.error("Error generating:", error);
    }
  };

  useEffect(() => {
    if (result !== null) {
      handleGenerate();
    }
  }, [result]);
  return (
    <div className="p-4">
      <Header />

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Enter your code..."
          rows={4}
        />

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Developers
            </label>
            <input
              type="number"
              min="0"
              value={developers}
              onChange={(e) => setDevelopers(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Enter number of developers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Designers
            </label>
            <input
              type="number"
              min="0"
              value={designers}
              onChange={(e) => setDesigners(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Enter number of designers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (days)
            </label>
            <input
              type="number"
              min="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Enter duration in days"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </form>

      {result && (
        <div className="mt-4">
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      {final && (
        <div className="mt-4">
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(final, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Page;
