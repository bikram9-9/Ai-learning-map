import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  LearningMapResponse,
  LearningMapRequest,
  LearningMap,
  ElementData,
} from "@/types/general";
import Element from "./Element";
import { FaPlus } from "react-icons/fa";

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

    return map.layers.flatMap((layer, layerIndex) => {
      const skillsInLayer = layer.skills.length;
      return layer.skills.map((skill, skillIndex) => ({
        id: `${layerIndex}-${skillIndex}`,
        x:
          Math.round(
            ((boardWidth / (skillsInLayer + 1)) * (skillIndex + 1)) / GRID_SIZE
          ) * GRID_SIZE,
        y:
          Math.round((layerHeight * (layerIndex + 0.5)) / GRID_SIZE) *
          GRID_SIZE,
        text: skill,
        layer: layerIndex,
      }));
    });
  };

  useEffect(() => {
    if (learningMap && mapRef.current) {
      drawConnections();
    }
  }, [learningMap]);

  const drawConnections = () => {
    if (!mapRef.current || !learningMap) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    mapRef.current.appendChild(svg);

    elements.forEach((element) => {
      const nextLayerElements = elements.filter(
        (e) => e.layer === (element.layer || 0) + 1
      );

      nextLayerElements.forEach((nextElement) => {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", (element.x + 50).toString());
        line.setAttribute("y1", (element.y + 20).toString());
        line.setAttribute("x2", (nextElement.x + 50).toString());
        line.setAttribute("y2", (nextElement.y + 20).toString());
        line.setAttribute("stroke", "rgba(156, 163, 175, 0.5)");
        line.setAttribute("stroke-width", "2");
        svg.appendChild(line);
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

  useEffect(() => {
    if (elements.length > 0 && mapRef.current) {
      drawConnections();
    }
  }, [elements]);

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
        className="absolute top-2 left-2 bg-accent w-20 h-20 rounded-full flex items-center justify-center cursor-pointer z-20 "
        aria-label="Add Element"
      >
        <FaPlus className="w-4 h-4 " />
      </button>
    </div>
  );
};

export default MapBoard;
