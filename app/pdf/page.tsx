"use client";

import { addDoc, collection } from "firebase/firestore";

import React from "react";
import axios from "axios";
import { db } from "@/firebase";
import { useState } from "react";

const page = () => {
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const getMessage = async () => {
    try {
      setLoading(true);
      const body = { prompt: inputVal };
      const response = await axios.post("api/pdfresponse", body);

      if (response.status === 201) {
        const data = response.data.content;
        setResult(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitData = async () => {
    const docRef = await addDoc(collection(db, "users"), {
      first: "Ada",
      last: "Lovelace",
      born: 1815,
    });
  };
  return (
    <div className="p-4">
      <div className="flex flex-col gap-4 max-w-md">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Enter your prompt"
          className="border p-2 rounded"
        />
        <button
          onClick={getMessage}
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {loading ? "Loading..." : "Send Request"}
        </button>
        {result && (
          <div className="mt-4 p-4 border rounded">
            <h3 className="font-bold">Result:</h3>
            <p>{result}</p>
          </div>
        )}

        <button onClick={submitData}>Submit Data</button>
      </div>
    </div>
  );
};

export default page;
