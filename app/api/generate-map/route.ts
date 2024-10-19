import { NextResponse } from "next/server";
import OpenAI from "openai";
import { LearningMapRequest, LearningMapResponse } from "@/types/request";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { goal_skill, layers }: LearningMapRequest = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates structured learning maps.",
        },
        {
          role: "user",
          content: `Create a learning map for the goal skill: "${goal_skill}" with ${layers} layers. Return the result as a JSON object with the following structure:
          {
            "goal_skill": "${goal_skill}",
            "layers": [
              {
                "layer_name": "Layer 1",
                "skills": ["Skill 1", "Skill 2", "Skill 3"]
              },
              {
                "layer_name": "Layer 2",
                "skills": ["Skill 4", "Skill 5", "Skill 6"]
              },
              ...
            ]
          }
          Ensure that each layer has a meaningful name and contains relevant skills needed to progress towards the goal skill.`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const learningMap: LearningMapResponse = JSON.parse(
      completion.choices[0].message.content || "{}"
    );
    console.log(learningMap);
    return NextResponse.json(learningMap);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the learning map." },
      { status: 500 }
    );
  }
}
