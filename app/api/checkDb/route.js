import { collection, getDocs, query, where } from "firebase/firestore";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/firebase";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    console.log("Received request");
    const body = await request.json();
    const { name } = body;
    console.log("Received name:", name);
    const similarMatches = [];

    if (!name) {
      console.log("Name is missing");
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    // Step 1: Exact match check
    console.log("Checking for exact matches...");
    const exactQuery = query(
      collection(db, "submodules"),
      where("name", "==", name)
    );
    const exactQuerySnapshot = await getDocs(exactQuery);
    console.log("Exact matches found:", exactQuerySnapshot.size);
    const exactMatches = [];

    exactQuerySnapshot.forEach((doc) => {
      exactMatches.push({
        id: doc.id,
        priority: 1, // Priority 1 for exact matches
        ...doc.data(),
      });
    });

    // If no exact matches, generate suggestions using OpenAI
    if (exactMatches.length === 0) {
      const suggestionsCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates similar names. Return exactly 25 names, separated by commas.",
          },
          {
            role: "user",
            content: `Generate exactly 25 commonly used synonyms or closely related meaningful names in English for '${name}', separated by commas.`,
          },
        ],
        model: "gpt-3.5-turbo",
      });

      const suggestedNames = suggestionsCompletion.choices[0].message.content
        .split(",")
        .map((n) => n.trim().toLowerCase().replace(/\s+/g, ""));

      console.log("Suggested names:", suggestedNames);

      // Now proceed with similarity check using both existing and suggested names

      const similarQuery = query(
        collection(db, "submodules"),
        where("name", "in", suggestedNames)
      );
      const similarQuerySnapshot = await getDocs(similarQuery);
      console.log("Exact matches found:", similarQuerySnapshot.size);

      similarQuerySnapshot.forEach((doc) => {
        similarMatches.push({
          id: doc.id,
          priority: 1, // Priority 1 for exact matches
          ...doc.data(),
        });
      });

      // Continue with existing similarity check logic...
    }

    // Combine results
    const allResults = [...exactMatches, ...similarMatches];

    return NextResponse.json({
      success: true,
      matches: allResults,
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
