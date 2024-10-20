export type LearningMap = {
  goal_skill: string;
  layers: {
    layer_name: string;
    skills: Array<string>;
  }[];
};

export type LearningMapRequest = {
  goal_skill: string;
  layers: number;
};

export type ElementData = {
  id: string;
  x: number;
  y: number;
  text: string;
  layer?: number;
};

export type LearningMapResponse = LearningMap;
