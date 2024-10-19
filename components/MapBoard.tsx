import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  LearningMapResponse,
  LearningMapRequest,
  LearningMap,
} from "@/types/request";

interface MapBoardProps {
  skill: string;
  generateMap: boolean;
}

const MapBoard: React.FC<MapBoardProps> = ({ skill, generateMap }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [learningMap, setLearningMap] = useState<LearningMap | null>(null);

  useEffect(() => {
    if (generateMap) {
      generateLearningMap();
    }
  }, [generateMap]);

  const generateLearningMap = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post<LearningMapResponse>(
        "/api/generate-map",
        {
          goal_skill: skill,
          layers: 3,
        } as LearningMapRequest
      );

      console.log("API Response:", response);

      if (response.data) {
        setLearningMap(response.data);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("Error generating learning map:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setLearningMap(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (learningMap && mapRef.current) {
      drawConnections();
    }
  }, [learningMap]);

  const drawConnections = () => {
    // ... (keep the existing drawConnections function)
  };

  return (
    <div className="map-board bg-white dark:bg-black w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="text-white text-2xl">Generating learning map...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="text-white text-2xl error-message">
            Error: {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapBoard;
