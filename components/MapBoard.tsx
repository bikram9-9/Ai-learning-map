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
import { FaPlus, FaTrash, FaArrowRight } from "react-icons/fa";
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
  const [connections, setConnections] = useState<
    { from: string; to: string; id: string }[]
  >([]);
  const [newConnection, setNewConnection] = useState<{
    from: string;
    to: string | null;
  }>({ from: "", to: null });
  const [startElement, setStartElement] = useState<ElementData | null>(null);

  useEffect(() => {
    if (generateMap) {
      generateLearningPaths();
    }
    updateStartElement();
  }, [generateMap, skill]);

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

  const updateStartElement = () => {
    const boardHeight = mapRef.current?.clientHeight || 800;
    const newStartElement: ElementData = {
      id: "start-element",
      x: GRID_SIZE,
      y: Math.round(boardHeight / 2 / GRID_SIZE) * GRID_SIZE,
      text: skill,
      pathIndex: -1,
      phaseIndex: -1,
      isStartElement: true, // Add this flag
    };
    setStartElement(newStartElement);
  };

  const convertLearningPathsToElements = (
    paths: LearningPath[]
  ): ElementData[] => {
    const boardWidth = mapRef.current?.clientWidth || 1000;
    const boardHeight = mapRef.current?.clientHeight || 800;
    const pathHeight = boardHeight / paths.length;

    return paths.flatMap((path, pathIndex) => {
      return path.phase.map((phase: Phase, phaseIndex: number) => {
        const phaseWidth = (boardWidth - GRID_SIZE * 3) / path.phase.length;
        return {
          id: `${pathIndex}-${phaseIndex}`,
          x:
            Math.round(
              (phaseWidth * (phaseIndex + 0.5) + GRID_SIZE * 3) / GRID_SIZE
            ) * GRID_SIZE,
          y:
            Math.round((pathHeight * (pathIndex + 0.5)) / GRID_SIZE) *
            GRID_SIZE,
          text: phase.name,
          pathIndex,
          phaseIndex,
          duration: phase.duration,
          skills: phase.skills,
        };
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

  const startNewConnection = (fromId: string) => {
    setNewConnection({ from: fromId, to: null });
  };

  const completeNewConnection = (toId: string) => {
    if (newConnection.from && newConnection.from !== toId) {
      const newConn = {
        from: newConnection.from,
        to: toId,
        id: `conn-${Date.now()}`,
      };
      setConnections([...connections, newConn]);
      setNewConnection({ from: "", to: null });
    }
  };

  const deleteConnection = (id: string) => {
    setConnections(connections.filter((conn) => conn.id !== id));
  };

  const handleStartElementMove = (id: string, x: number, y: number) => {
    setStartElement((prev) => (prev ? { ...prev, x, y } : null));
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
        {connections.map((conn) => (
          <svg
            key={conn.id}
            className="absolute z-0"
            style={{
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
            }}
          >
            <line
              x1={elements.find((el) => el.id === conn.from)?.x || 0}
              y1={elements.find((el) => el.id === conn.from)?.y || 0}
              x2={elements.find((el) => el.id === conn.to)?.x || 0}
              y2={elements.find((el) => el.id === conn.to)?.y || 0}
              stroke="#888"
              strokeWidth="2"
              className="cursor-pointer"
              onClick={() => deleteConnection(conn.id)}
            />
            <FaArrowRight
              className="text-gray-500 cursor-pointer"
              style={{
                position: "absolute",
                left: (elements.find((el) => el.id === conn.to)?.x || 0) - 16,
                top: (elements.find((el) => el.id === conn.to)?.y || 0) - 8,
              }}
              onClick={() => deleteConnection(conn.id)}
            />
          </svg>
        ))}
        {startElement && (
          <Element
            data={startElement}
            onMove={handleStartElementMove}
            onTextChange={() => {}} // Start element text is not editable
            onDelete={() => {}} // Start element cannot be deleted
            GRID_SIZE={GRID_SIZE}
            containerRef={mapRef}
            onStartConnection={() => startNewConnection(startElement.id)}
            onCompleteConnection={() => completeNewConnection(startElement.id)}
            isConnecting={newConnection.from === startElement.id}
          />
        )}
        {elements.map((element) => (
          <React.Fragment key={element.id}>
            <Element
              data={element}
              onMove={updateElementPosition}
              onTextChange={updateElementText}
              onDelete={deleteElement}
              GRID_SIZE={GRID_SIZE}
              containerRef={mapRef}
              onStartConnection={() => startNewConnection(element.id)}
              onCompleteConnection={() => completeNewConnection(element.id)}
              isConnecting={newConnection.from === element.id}
            />
          </React.Fragment>
        ))}
      </div>
      <button
        onClick={createNewElement}
        className="absolute top-2 left-2 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-20"
        aria-label="Add Element"
      >
        <FaPlus className="w-4 h-4" />
      </button>
      <button
        onClick={handleClearClick}
        className="absolute bottom-4 left-4 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer z-20"
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
