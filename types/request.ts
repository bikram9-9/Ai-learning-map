export type LearningMap = {
  goal_skill: string;
  layers: {
    layer_name: string;
    skills: LearningNode[];
  }[];
};

export type LearningNode = {
  skill: string;
  description: string;
};

export type LearningMapRequest = {
  goal_skill: string;
  layers: number;
};

export type LearningMapResponse = LearningMap;
