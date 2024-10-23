import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  LearningPathsRequest,
  LearningPathsResponse,
} from "@/types/general.types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { goal_skill }: LearningPathsRequest = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates structured learning paths.",
        },
        {
          role: "user",
          content: `Generate 1-3 learning paths for the goal skill: "${goal_skill}". Each path should contain 3-5 phases. Ensure that each phase has a concise name and a meaningful set of skills. The skill names should be 1-2 words. A path can be something like using a tutor, self teaching through youtube videos, reading books, etc.`,
        },
      ],
      functions: [
        {
          name: "generate_learning_paths",
          description:
            "Generate different common paths of learning a skill, each path includes phases, each phase includes a list of skills.",
          parameters: {
            type: "object",
            required: ["goal_skill"],
            properties: {
              goal_skill: {
                type: "string",
                description: "The skill that the user aims to learn.",
              },
              paths: {
                type: "array",
                description:
                  "Array of learning paths, each containing phases of skills to learn.",
                items: {
                  type: "object",
                  properties: {
                    phase_name: {
                      type: "string",
                      description: "Name of the phase in the learning path.",
                    },
                    skills: {
                      type: "array",
                      description: "List of skills to acquire in this phase.",
                      items: {
                        type: "string",
                        description: "Skill name, 1 to 2 words.",
                      },
                    },
                  },
                  additionalProperties: false,
                  required: ["phase_name", "skills"],
                },
              },
            },
            additionalProperties: false,
          },
        },
      ],
      function_call: { name: "generate_learning_paths" },
    });

    const functionCall = completion.choices[0].message.function_call;
    if (functionCall && functionCall.name === "generate_learning_paths") {
      const learningPaths: LearningPathsResponse = JSON.parse(
        functionCall.arguments || "{}"
      );
      console.log(learningPaths);
      return NextResponse.json(learningPaths);
    } else {
      throw new Error("Unexpected response from OpenAI");
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the learning paths." },
      { status: 500 }
    );
  }
}
