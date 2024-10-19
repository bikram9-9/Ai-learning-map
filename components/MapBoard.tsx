import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  LearningMapResponse,
  LearningMapRequest,
  LearningMap,
  ElementData,
} from "@/types/general";
import Element from "./Element";

interface MapBoardProps {
  skill: string;
  generateMap: boolean;
}

const GRID_SIZE = 20;

const MapBoard: React.FC<MapBoardProps> = ({ skill, generateMap }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [learningMap, setLearningMap] = useState<LearningMap | null>(null);
  const [elements, setElements] = useState<ElementData[]>([]);

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

  const createNewElement = () => {
    const newElement: ElementData = {
      id: `element-${Date.now()}`,
      x:
        Math.round(
          (Math.random() * ((mapRef.current?.clientWidth || 500) - 100)) /
            GRID_SIZE
        ) * GRID_SIZE,
      y:
        Math.round(
          (Math.random() * ((mapRef.current?.clientHeight || 500) - 40)) /
            GRID_SIZE
        ) * GRID_SIZE,
      text: "New Element",
    };
    setElements((prevElements) => [...prevElements, newElement]);
  };

  const updateElementPosition = (id: string, x: number, y: number) => {
    setElements((prevElements) =>
      prevElements.map((el) => (el.id === id ? { ...el, x, y } : el))
    );
  };

  const updateElementText = (id: string, text: string) => {
    setElements((prevElements) =>
      prevElements.map((el) => (el.id === id ? { ...el, text } : el))
    );
  };

  return (
    <div className="map-board w-full h-[calc(100vh-200px)] mt-10 rounded-lg relative">
      <div className="absolute inset-0 dot-pattern dark:dot-pattern"></div>
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
      <div ref={mapRef} className="relative z-10 w-full h-full">
        {elements.map((element) => (
          <Element
            key={element.id}
            data={element}
            onMove={updateElementPosition}
            onTextChange={updateElementText}
            GRID_SIZE={GRID_SIZE}
            containerRef={mapRef}
          />
        ))}
      </div>
      <button
        onClick={createNewElement}
        className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
      >
        Add Element
      </button>
    </div>
  );
};

export default MapBoard;
