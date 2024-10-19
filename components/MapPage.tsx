import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MdKeyboardReturn } from "react-icons/md";
import { FaSun, FaMoon } from "react-icons/fa";
import {
  LearningMapResponse,
  LearningMapRequest,
  LearningMap,
  LearningNode,
} from "@/types/request";
import { useTheme } from "@/providers/ThemeProvider";

const MapPage: React.FC = () => {
  const [skill, setSkill] = useState<string>("");
  const [learningMap, setLearningMap] = useState<LearningMap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const generateLearningMap = async (inputSkill: string = skill) => {
    if (!inputSkill.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post<LearningMapResponse>(
        "/api/generate-map",
        {
          goal_skill: inputSkill,
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      generateLearningMap();
    }
  };

  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (learningMap && mapRef.current) {
      drawConnections();
    }
  }, [learningMap]);

  const drawConnections = () => {
    if (!mapRef.current) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    mapRef.current.appendChild(svg);

    const layers = mapRef.current.querySelectorAll(".layer");
    layers.forEach((layer, layerIndex) => {
      if (layerIndex === layers.length - 1) return; // Skip the last layer

      const currentNodes = layer.querySelectorAll(".learning-node");
      const nextLayer = layers[layerIndex + 1];
      const nextNodes = nextLayer.querySelectorAll(".learning-node");

      currentNodes.forEach((currentNode) => {
        nextNodes.forEach((nextNode) => {
          const rect1 = currentNode.getBoundingClientRect();
          const rect2 = nextNode.getBoundingClientRect();

          const x1 = rect1.right - mapRef.current!.offsetLeft;
          const y1 = rect1.top + rect1.height / 2 - mapRef.current!.offsetTop;
          const x2 = rect2.left - mapRef.current!.offsetLeft;
          const y2 = rect2.top + rect2.height / 2 - mapRef.current!.offsetTop;

          const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          line.setAttribute("x1", x1.toString());
          line.setAttribute("y1", y1.toString());
          line.setAttribute("x2", x2.toString());
          line.setAttribute("y2", y2.toString());
          line.setAttribute("stroke", theme === "dark" ? "#888" : "#ddd");
          line.setAttribute("stroke-width", "1");
          svg.appendChild(line);
        });
      });
    });
  };

  const renderLearningMap = (node: LearningNode, index: number) => {
    return (
      <div
        key={index}
        className="learning-node bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 mb-4 transition-colors duration-300"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {node.skill}
        </h3>
        {node.description && (
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
            {node.description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`map-page w-full px-20 ${theme === "dark" ? "dark" : ""}`}>
      <div className="flex flex-row gap-4 justify-between items-center w-full ">
        <p className="text-lg col-span-4 font-italic min-w-96">
          Create a learning map for a new skill in{" "}
          <span className="font-semibold">seconds.</span>{" "}
        </p>
        <div className="skill-input flex flex-row gap-4  items-center justify-center min-w-96 ">
          <div className="relative w-96">
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="ex. 'Cooking, Machine Learning, React JS'"
              className="py-4 px-8 pr-12 rounded-full w-full bg-secondary text-foreground dark:text-background focus:outline-none text-sm"
            />
            <MdKeyboardReturn
              className="absolute right-3 top-1/2 transform -translate-y-1/2 dark:text-background text-foreground opacity-50"
              size={20}
            />
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => generateLearningMap()}
              disabled={isLoading}
              className="text-foreground px-4 py-2 font-semibold font-italic"
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {theme === "dark" ? (
              <FaSun className="text-yellow-400" />
            ) : (
              <FaMoon className="text-gray-600" />
            )}
          </button>
        </div>
      </div>
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}
      {learningMap && learningMap.layers && (
        <div className="learning-map mt-8" ref={mapRef}>
          <h2 className="text-2xl font-bold mb-6">
            Learning Map for {learningMap.goal_skill}
          </h2>
          <div className="flex flex-row gap-8 overflow-x-auto">
            {learningMap.layers.map((layer, index) => (
              <div
                key={layer.layer_name || index}
                className="layer flex-shrink-0"
              >
                <h3 className="text-xl font-semibold mb-4">
                  {layer.layer_name}
                </h3>
                <div className="flex flex-col gap-4">
                  {layer.skills.map((skill, skillIndex) =>
                    renderLearningMap(skill, skillIndex)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
