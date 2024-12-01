import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, currentFields } = body;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that helps modify document fields. 
          Always respond with JSON in the format: 
          { "suggestions": { fieldName: newValue }, "explanation": "reason for changes" }`,
        },
        {
          role: "user",
          content: `Current fields: ${JSON.stringify(currentFields)}
          User request: ${message}
          Please suggest appropriate changes.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiResponse = JSON.parse(response.choices[0].message.content);
    return NextResponse.json(aiResponse, { status: 200 });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
