export type Duration = {
  approx_time: string;
  start_time: string;
  mastery_time: string;
};

export interface ElementData {
  id: string;
  x: number;
  y: number;
  text: string;
  pathIndex: number;
  phaseIndex: number;
  duration?: Duration;
  skills?: string[];
  isStartElement?: boolean;
}

export interface Connection {
  from: string;
  to: string;
}

export type LearningPath = {
  phase_name: string;
  skills: string[];
};

export type LearningPathsRequest = {
  goal_skill: string;
};

export type LearningPathsResponse = {
  goal_skill: string;
  paths: LearningPath[];
};
