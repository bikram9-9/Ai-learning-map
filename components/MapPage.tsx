import React, { useState } from "react";
import { MdKeyboardReturn } from "react-icons/md";
import { FaSun, FaMoon } from "react-icons/fa";

import { useTheme } from "@/providers/ThemeProvider";
import MapBoard from "./MapBoard";

const MapPage: React.FC = () => {
  const [skill, setSkill] = useState<string>("");
  const { theme, toggleTheme } = useTheme();
  const [generateMap, setGenerateMap] = useState<boolean>(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setGenerateMap(true);
    }
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
              className="py-4 px-8 pr-12 rounded-lg w-full bg-secondary text-foreground dark:text-background focus:outline-none text-sm"
            />
            <MdKeyboardReturn
              className="absolute right-3 top-1/2 transform -translate-y-1/2 dark:text-background text-foreground opacity-50"
              size={20}
            />
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => setGenerateMap(true)}
              className="text-foreground px-4 py-2 font-semibold font-italic"
            >
              Generate
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {theme === "dark" ? (
              <FaSun className="text-yellow-400" />
            ) : (
              <FaMoon className="text-gray-600" />
            )}
          </button>
        </div>
      </div>
      <MapBoard skill={skill} generateMap={generateMap} />
    </div>
  );
};

export default MapPage;
