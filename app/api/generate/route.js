import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();

    // Improved validation
    if (!body || !body.data) {
      console.log("Received invalid body:", body);
      return NextResponse.json(
        { error: "Invalid request: missing data array" },
        { status: 400 }
      );
    }

    const modules = body.data;
    const titlesWithoutMatches = [];
    let hoursLeft = body.duration * 8;
    const existingTitles = [];
    console.log("Hours left 1:", hoursLeft);
    // Extract titles without matches
    modules.forEach((module) => {
      if (!module.titles) return;

      module.titles.forEach((title) => {
        if (!title.matches || title.matches.length === 0) {
          titlesWithoutMatches.push({
            moduleName: module.name,
            title: title.originalTitle,
          });
        } else {
          console.log("Hours Left 2: ", title.matches[0].duration);
          hoursLeft -= title.matches[0].duration;
          console.log("Hours Left 3: ", hoursLeft);
          existingTitles.push({
            moduleName: module.name,
            title: title.originalTitle,
            duration: title.matches[0].duration,
            exists: true,
          });
        }
      });
    });
    console.log("Hours left:", hoursLeft);

    console.log("Processing titles:", titlesWithoutMatches);

    let totalHoursUsed = 0;
    const suggestions = [];

    // Process items sequentially instead of using Promise.all to maintain control
    for (let i = 0; i < titlesWithoutMatches.length; i++) {
      const { moduleName, title } = titlesWithoutMatches[i];
      const remainingItems = titlesWithoutMatches.length - i;
      const remainingHours = hoursLeft - totalHoursUsed;
      const maxHoursPerItem = remainingHours / remainingItems;

      const prompt = `As an experienced developer, estimate the development hours required for a "${title}" feature within the "${moduleName}" module. 
      Important constraints:
      - Maximum hours allowed: ${maxHoursPerItem} hours
      - Estimate should be reasonable and practical
      
      Return only an array with a single object in this structure:
      [
        {
          "moduleName": "${moduleName}",
          "title": "${title}",
          "duration": number (development hours for this feature)
        }
      ]`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
      });

      const result = JSON.parse(completion.choices[0].message.content);

      // Ensure we don't exceed remaining hours
      let duration = Math.min(result[0].duration, maxHoursPerItem);

      // For the last item, use all remaining hours if needed
      if (i === titlesWithoutMatches.length - 1) {
        duration = remainingHours;
      }

      totalHoursUsed += duration;

      suggestions.push({
        moduleName: result[0].moduleName,
        title: result[0].title,
        duration: duration,
      });

      console.log(
        `Item ${i + 1}/${
          titlesWithoutMatches.length
        }: Used ${duration} hours. Total used: ${totalHoursUsed}/${hoursLeft}`
      );
    }

    // Modify suggestions to include exists field
    suggestions.forEach((suggestion) => {
      suggestion.exists = false;
    });

    // Combine both arrays in the response
    const allTitles = [...existingTitles, ...suggestions];

    return NextResponse.json({ success: true, suggestions: allTitles });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 }
    );
  }
}
