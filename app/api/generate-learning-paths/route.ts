import { NextResponse } from "next/server";
import OpenAI from "openai";
import { LearningPathsRequest, LearningPathsResponse } from "@/types/general";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { goal_skill, numberOfPaths }: LearningPathsRequest =
      await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates structured learning paths.",
        },
        {
          role: "user",
          content: `Generate ${numberOfPaths} learning paths for the goal skill: "${goal_skill}". Return the result as a JSON object with the following structure:
          {
            "goal_skill": "${goal_skill}",
            "paths": [
              {
                "phase": [
                  {
                    "duration": {
                      "approx_time": number,
                      "start_time": "YYYY-MM-DD",
                      "mastery_time": "YYYY-MM-DD"
                    },
                    "skills": ["Skill 1", "Skill 2", ...]
                  },
                  ...
                ]
              },
              ...
            ]
          }
          Provide exactly ${numberOfPaths} different paths, each with 3-5 phases. Ensure that each phase has a meaningful set of skills and realistic time estimates.`,
        },
      ],
      functions: [
        {
          name: "generate_learning_paths",
          description:
            "Generate different paths to learn a goal skill, organized into phases with skills and time estimates.",
          parameters: {
            type: "object",
            required: ["goal_skill", "paths"],
            properties: {
              goal_skill: {
                type: "string",
                description: "The skill that the paths are designed to achieve",
              },
              paths: {
                type: "array",
                description:
                  "Array of different learning paths to achieve the goal skill",
                items: {
                  type: "object",
                  required: ["phase"],
                  properties: {
                    phase: {
                      type: "array",
                      description: "List of phases within the learning path",
                      items: {
                        type: "object",
                        required: ["duration", "skills"],
                        properties: {
                          duration: {
                            type: "object",
                            required: [
                              "approx_time",
                              "start_time",
                              "mastery_time",
                            ],
                            properties: {
                              approx_time: {
                                type: "number",
                                description:
                                  "Approximate time to learn the skills in the phase",
                              },
                              start_time: {
                                type: "string",
                                description:
                                  "Start time to begin learning the skills in this phase",
                              },
                              mastery_time: {
                                type: "string",
                                description:
                                  "Estimated time to master the skills in the phase",
                              },
                            },
                          },
                          skills: {
                            type: "array",
                            description:
                              "List of skills to be learned in the phase",
                            items: {
                              type: "string",
                              description: "Skill to be learned",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
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
