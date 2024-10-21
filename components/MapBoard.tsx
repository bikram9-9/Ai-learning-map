import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LearningPathsResponse,
  LearningPathsRequest,
  LearningPath,
  Phase,
  ElementData,
} from "@/types/general.types";
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
  const [connections, setConnections] = useState<
    {
      from: string;
      to: string;
      id: string;
      side: "left" | "right" | "top" | "bottom";
    }[]
  >([]);
  const [newConnection, setNewConnection] = useState<{
    from: string;
    side: "left" | "right" | "top" | "bottom";
    to: string | null;
  }>({ from: "", side: "right", to: null });
  const [startElement, setStartElement] = useState<ElementData | null>(null);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [tempConnection, setTempConnection] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [newElementId, setNewElementId] = useState<string | null>(null);

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
    const id = `element-${Date.now()}`;
    const newElement: ElementData = {
      id,
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
    setNewElementId(id);
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
    // Delete all connections associated with this element
    setConnections((prevConnections) =>
      prevConnections.filter((conn) => conn.from !== id && conn.to !== id)
    );
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

  const startNewConnection = (
    fromId: string,
    side: "left" | "right" | "top" | "bottom",
    startX: number,
    startY: number
  ) => {
    setNewConnection({ from: fromId, side, to: null });
    setIsCreatingConnection(true);
    setTempConnection({ x: startX, y: startY });
  };

  const createNewElementFromConnection = useCallback(
    (position: { x: number; y: number }) => {
      const newElement: ElementData = {
        id: `element-${Date.now()}`,
        x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(position.y / GRID_SIZE) * GRID_SIZE,
        text: "New Element",
        pathIndex: -1,
        phaseIndex: -1,
      };
      setElements((prevElements) => [...prevElements, newElement]);
      return newElement.id;
    },
    [GRID_SIZE]
  );

  const completeNewConnection = useCallback(
    (
      toId: string | null,
      position: { x: number; y: number } | null
    ): boolean => {
      if (newConnection.from) {
        let targetId = toId;
        if (!targetId && position) {
          targetId = createNewElementFromConnection(position);
        }
        if (targetId && newConnection.from !== targetId) {
          const newConn = {
            from: newConnection.from,
            to: targetId,
            id: `conn-${Date.now()}`,
            side: newConnection.side,
          };
          setConnections((prevConnections) => [...prevConnections, newConn]);
        }
        setNewConnection({ from: "", side: "right", to: null });
        setIsCreatingConnection(false);
        setTempConnection(null);
        return true;
      }
      return false;
    },
    [newConnection, createNewElementFromConnection]
  );

  const findClosestElement = useCallback(
    (position: { x: number; y: number }): ElementData | null => {
      const threshold = GRID_SIZE; // Adjust this value as needed
      let closestElement: ElementData | null = null;
      let minDistance = Infinity;

      [...elements, startElement].forEach((element) => {
        if (element) {
          const distance = Math.sqrt(
            Math.pow(element.x - position.x, 2) +
              Math.pow(element.y - position.y, 2)
          );
          if (distance < minDistance && distance < threshold) {
            minDistance = distance;
            closestElement = element;
          }
        }
      });

      return closestElement;
    },
    [elements, startElement]
  );

  const deleteConnection = (id: string) => {
    setConnections(connections.filter((conn) => conn.id !== id));
  };

  const handleStartElementMove = (id: string, x: number, y: number) => {
    setStartElement((prev: ElementData | null) =>
      prev ? { ...prev, x, y } : null
    );
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isCreatingConnection) {
        const rect = mapRef.current?.getBoundingClientRect();
        if (rect) {
          setTempConnection({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }
      }
    },
    [isCreatingConnection]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isCreatingConnection && e.key === "Enter") {
        const closestElement = findClosestElement(
          tempConnection || { x: 0, y: 0 }
        );
        if (closestElement) {
          completeNewConnection(closestElement.id, null);
        }
        setIsCreatingConnection(false);
        setTempConnection(null);
      }
    },
    [
      isCreatingConnection,
      tempConnection,
      findClosestElement,
      completeNewConnection,
    ]
  );

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isCreatingConnection) {
        const rect = mapRef.current?.getBoundingClientRect();
        if (rect) {
          const clickPosition = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          };
          const closestElement = findClosestElement(clickPosition);
          if (closestElement) {
            completeNewConnection(closestElement.id, null);
          } else {
            completeNewConnection(null, clickPosition);
          }
        }
      }
    },
    [isCreatingConnection, findClosestElement, completeNewConnection]
  );

  const getConnectionPoints = (
    element: ElementData,
    side?: "left" | "right" | "top" | "bottom"
  ) => {
    const elementWidth = GRID_SIZE * 4;
    const elementHeight = GRID_SIZE * 1.2;
    const points = {
      left: { x: element.x, y: element.y + elementHeight / 2 },
      right: { x: element.x + elementWidth, y: element.y + elementHeight / 2 },
      top: { x: element.x + elementWidth / 2, y: element.y },
      bottom: { x: element.x + elementWidth / 2, y: element.y + elementHeight },
      center: {
        x: element.x + elementWidth / 2,
        y: element.y + elementHeight / 2,
      },
    };
    return side ? { [side]: points[side], center: points.center } : points;
  };

  const getClosestConnectionPoint = (
    from: ElementData,
    to: ElementData,
    fromSide: "left" | "right" | "top" | "bottom"
  ) => {
    const fromPoints = getConnectionPoints(from, fromSide);
    const toPoints = getConnectionPoints(to);

    let minDistance = Infinity;
    let closestFromPoint = fromPoints[fromSide];
    let closestToPoint = toPoints.center;

    Object.entries(toPoints).forEach(([toKey, toPoint]) => {
      if (toKey !== "center") {
        const distance = Math.sqrt(
          Math.pow(fromPoints[fromSide].x - toPoint.x, 2) +
            Math.pow(fromPoints[fromSide].y - toPoint.y, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestToPoint = toPoint;
        }
      }
    });

    return { from: closestFromPoint, to: closestToPoint };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const isDescending = start.y < end.y;
    const controlX = midX;
    const controlY = isDescending
      ? midY + Math.min(100, Math.abs(end.y - start.y) / 2)
      : midY - Math.min(100, Math.abs(end.y - start.y) / 2);

    return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleMouseMove, handleKeyDown]);

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
      <div
        ref={mapRef}
        className="relative z-10 w-full h-full"
        onClick={handleMapClick}
      >
        {connections.map((conn) => {
          const fromElement =
            elements.find((el) => el.id === conn.from) || startElement;
          const toElement = elements.find((el) => el.id === conn.to);
          if (!fromElement || !toElement) return null;

          const { from, to } = getClosestConnectionPoint(
            fromElement,
            toElement,
            conn.side // Add this property to your connections state
          );
          const pathD = createCurvedPath(from, to);

          return (
            <svg
              key={conn.id}
              className="absolute z-0"
              style={{ left: 0, top: 0, width: "100%", height: "100%" }}
            >
              <path
                d={pathD}
                fill="none"
                stroke="#888"
                strokeWidth="2"
                className="cursor-pointer"
                onClick={() => deleteConnection(conn.id)}
              />
            </svg>
          );
        })}
        {isCreatingConnection && newConnection.from && tempConnection && (
          <svg
            className="absolute z-0"
            style={{ left: 0, top: 0, width: "100%", height: "100%" }}
          >
            <path
              d={createCurvedPath(
                getConnectionPoints(
                  elements.find((el) => el.id === newConnection.from) ||
                    startElement!
                ).center,
                tempConnection
              )}
              fill="none"
              stroke="#888"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </svg>
        )}
        {elements.map((element) => (
          <Element
            key={element.id}
            data={element}
            onMove={updateElementPosition}
            onTextChange={updateElementText}
            onDelete={deleteElement}
            GRID_SIZE={GRID_SIZE}
            containerRef={mapRef}
            onStartConnection={startNewConnection}
            onCompleteConnection={completeNewConnection}
            isConnecting={isCreatingConnection}
            isConnectionStart={newConnection.from === element.id}
            isNewElement={element.id === newElementId}
          />
        ))}
        {startElement && (
          <Element
            data={{ ...startElement, isStartElement: true }}
            onMove={handleStartElementMove}
            onTextChange={updateElementText} // Make sure this is passed for the start element too
            onDelete={deleteElement}
            GRID_SIZE={GRID_SIZE}
            containerRef={mapRef}
            onStartConnection={startNewConnection}
            onCompleteConnection={completeNewConnection}
            isConnecting={isCreatingConnection}
            isConnectionStart={newConnection.from === startElement.id}
          />
        )}
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
