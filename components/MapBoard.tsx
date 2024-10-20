import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  LearningMapResponse,
  LearningMapRequest,
  LearningMap,
  ElementData,
  Connection,
} from "@/types/general";
import Element from "./Element";
import { FaPlus, FaTrash } from "react-icons/fa";
import ConfirmationModal from "./ConfirmationModal";

interface MapBoardProps {
  skill: string;
  generateMap: boolean;
}

const GRID_SIZE = 40;

const MapBoard: React.FC<MapBoardProps> = ({ skill, generateMap }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [learningMap, setLearningMap] = useState<LearningMap | null>(null);
  const [elements, setElements] = useState<ElementData[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);

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

      console.log("API Response:", response.data);

      if (response.data) {
        setLearningMap(response.data);
        const newElements = convertLearningMapToElements(response.data);
        setElements(newElements);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("Error generating learning map:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setLearningMap(null);
      setElements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const convertLearningMapToElements = (map: LearningMap): ElementData[] => {
    const totalLayers = map.layers.length;
    const boardWidth = mapRef.current?.clientWidth || 1000;
    const boardHeight = mapRef.current?.clientHeight || 800;
    const layerHeight = boardHeight / totalLayers;

    const newConnections: Connection[] = [];
    const newElements = map.layers.flatMap((layer, layerIndex) => {
      const skillsInLayer = layer.skills.length;
      return layer.skills.map((skill, skillIndex) => {
        const id = `${layerIndex}-${skillIndex}`;
        if (layerIndex < map.layers.length - 1) {
          map.layers[layerIndex + 1].skills.forEach((_, nextSkillIndex) => {
            newConnections.push({
              from: id,
              to: `${layerIndex + 1}-${nextSkillIndex}`,
            });
          });
        }
        return {
          id,
          x:
            Math.round(
              ((boardWidth / (skillsInLayer + 1)) * (skillIndex + 1)) /
                GRID_SIZE
            ) * GRID_SIZE,
          y:
            Math.round((layerHeight * (layerIndex + 0.5)) / GRID_SIZE) *
            GRID_SIZE,
          text: skill,
          layer: layerIndex,
        };
      });
    });

    setConnections(newConnections);
    return newElements;
  };

  useEffect(() => {
    if (learningMap && mapRef.current) {
      drawConnections();
    }
  }, [learningMap, elements, connections]);

  const drawConnections = () => {
    if (!mapRef.current) return;

    // Remove existing SVG
    const existingSvg = mapRef.current.querySelector("svg");
    if (existingSvg) {
      existingSvg.remove();
    }

    // Only create new SVG if there are connections to draw
    if (connections.length === 0) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    mapRef.current.appendChild(svg);

    connections.forEach((connection) => {
      const fromElement = elements.find((e) => e.id === connection.from);
      const toElement = elements.find((e) => e.id === connection.to);

      if (fromElement && toElement) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", (fromElement.x + 50).toString());
        line.setAttribute("y1", (fromElement.y + 20).toString());
        line.setAttribute("x2", (toElement.x + 50).toString());
        line.setAttribute("y2", (toElement.y + 20).toString());
        line.setAttribute("stroke", "rgba(156, 163, 175, 0.5)");
        line.setAttribute("stroke-width", "2");
        svg.appendChild(line);
      }
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
    setConnections((prevConnections) =>
      prevConnections.filter((conn) => conn.from !== id && conn.to !== id)
    );
    // Schedule a redraw of connections after the state updates
    setTimeout(() => drawConnections(), 0);
  };

  useEffect(() => {
    if (elements.length > 0 && mapRef.current) {
      drawConnections();
    }
  }, [elements]);

  const clearBoard = () => {
    setLearningMap(null);
    setElements([]);
    setConnections([]);

    // Remove existing SVG
    if (mapRef.current) {
      const existingSvg = mapRef.current.querySelector("svg");
      if (existingSvg) {
        existingSvg.remove();
      }
    }
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
        <FaTrash className="w-4h-4" />
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
