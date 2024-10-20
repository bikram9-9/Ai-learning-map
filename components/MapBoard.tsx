import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  LearningPathsResponse,
  LearningPathsRequest,
  LearningPath,
  Phase,
  ElementData,
} from "@/types/general";
import Element from "./Element";
import { FaPlus, FaTrash } from "react-icons/fa";
import ConfirmationModal from "./ConfirmationModal";

interface MapBoardProps {
  skill: string;
  generateMap: boolean;
}

const GRID_SIZE = 40;
const NUMBER_OF_PATHS = 3;

const MapBoard: React.FC<MapBoardProps> = ({ skill, generateMap }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [, setLearningPaths] = useState<LearningPath[]>([]);
  const [elements, setElements] = useState<ElementData[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (generateMap) {
      generateLearningPaths();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateMap]);

  const generateLearningPaths = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post<LearningPathsResponse>(
        "/api/generate-learning-paths",
        {
          goal_skill: skill,
          numberOfPaths: NUMBER_OF_PATHS,
        } as LearningPathsRequest
      );

      console.log("API Response:", response.data);

      if (response.data && response.data.paths) {
        setLearningPaths(response.data.paths);
        const newElements = convertLearningPathsToElements(response.data.paths);
        setElements(newElements);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("Error generating learning paths:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setLearningPaths([]);
      setElements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const convertLearningPathsToElements = (
    paths: LearningPath[]
  ): ElementData[] => {
    const boardWidth = mapRef.current?.clientWidth || 1000;
    const boardHeight = mapRef.current?.clientHeight || 800;
    const pathWidth = boardWidth / paths.length;

    return paths.flatMap((path, pathIndex) => {
      return path.phase.flatMap((phase: Phase, phaseIndex: number) => {
        const phaseHeight = boardHeight / path.phase.length;
        return phase.skills.map((skill, skillIndex) => {
          return {
            id: `${pathIndex}-${phaseIndex}-${skillIndex}`,
            x:
              Math.round((pathWidth * (pathIndex + 0.5)) / GRID_SIZE) *
              GRID_SIZE,
            y:
              Math.round((phaseHeight * (phaseIndex + 0.5)) / GRID_SIZE) *
              GRID_SIZE,
            text: skill,
            pathIndex,
            phaseIndex,
            duration: phase.duration,
          };
        });
      });
    });
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
      pathIndex: -1,
      phaseIndex: -1,
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

  const deleteElement = (id: string) => {
    setElements((prevElements) => prevElements.filter((el) => el.id !== id));
  };

  const clearBoard = () => {
    setLearningPaths([]);
    setElements([]);
  };

  const handleClearClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmClear = () => {
    clearBoard();
    setShowConfirmModal(false);
  };

  const handleCancelClear = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="map-board w-full h-[calc(100vh-200px)] mt-10 rounded-lg relative">
      <div className="absolute inset-0 dot-pattern dark:dot-pattern"></div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="text-white text-2xl">
            Generating learning paths...
          </div>
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
            onDelete={deleteElement}
            GRID_SIZE={GRID_SIZE}
            containerRef={mapRef}
          />
        ))}
      </div>
      <button
        onClick={createNewElement}
        className="absolute top-2 left-2 bg-accent w-20 h-20 rounded-full flex items-center justify-center cursor-pointer z-20"
        aria-label="Add Element"
      >
        <FaPlus className="w-4 h-4" />
      </button>
      <button
        onClick={handleClearClick}
        className="absolute bottom-4 left-4 bg-red-500 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer z-20"
        aria-label="Clear Board"
      >
        <FaTrash className="w-4 h-4" />
      </button>
      {showConfirmModal && (
        <ConfirmationModal
          message="Are you sure you want to clear the board?"
          onConfirm={handleConfirmClear}
          onCancel={handleCancelClear}
        />
      )}
    </div>
  );
};

export default MapBoard;
