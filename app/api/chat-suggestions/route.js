import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { suggestions, projectContext } = body;

    // Prepare the prompt for GPT
    const prompt = `
As an AI project planning assistant, please review and provide corrections for the following project module suggestions.

Project Context:
Name: ${projectContext.name}
Description: ${projectContext.description}
Total Duration: ${projectContext.duration} hours

User Message:
${projectContext.userMessage}

Current Suggestions:
${JSON.stringify(suggestions, null, 2)}

Please:
1. Address the user's specific request/question
2. Review the module structure and durations
3. Suggest any missing crucial modules
4. Correct any unrealistic durations
5. Ensure modules are properly organized
6. Return both an explanation and the corrected suggestions

Provide your response in the following JSON format:
{
  "explanation": "Your detailed explanation here",
  "updatedSuggestions": [array of corrected suggestions]
}
  Important: Do not modify the 'exists' property of existing suggestions. For any new suggestions you add, set 'exists' to false.

`;
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;

    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(response);

    // Ensure 'exists' property of existing suggestions is not modified
    const updatedSuggestions = parsedResponse.updatedSuggestions.map(
      (suggestion, index) => {
        if (suggestions[index] && suggestions[index].exists !== undefined) {
          suggestion.exists = suggestions[index].exists;
        }
        return suggestion;
      }
    );

    return NextResponse.json(
      { ...parsedResponse, updatedSuggestions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in chat-suggestions:", error);
    return NextResponse.json(
      { error: "Failed to process suggestions" },
      { status: 500 }
    );
  }
}
