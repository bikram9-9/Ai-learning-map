export type Phase = {
  duration: Duration;
  skills: string[];
};

export type Duration = {
  approx_time: number;
  start_time: string;
  mastery_time: string;
};

export type ElementData = {
  id: string;
  x: number;
  y: number;
  text: string;
  pathIndex: number;
  phaseIndex: number;
  phase?: Phase;
  duration?: Duration;
};

export interface Connection {
  from: string;
  to: string;
}

export type LearningPath = {
  phase: Phase[];
};

export type LearningPathsRequest = {
  goal_skill: string;
  numberOfPaths: number;
};

export type LearningPathsResponse = {
  goal_skill: string;
  paths: LearningPath[];
};
