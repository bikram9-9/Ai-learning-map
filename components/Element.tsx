import React, { useState, useRef } from "react";
import { ElementData, Duration } from "@/types/general";
import { FaPlus } from "react-icons/fa";

interface ElementProps {
  data: ElementData & { isStartElement?: boolean };
  onMove: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  GRID_SIZE: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onStartConnection: () => void;
  onCompleteConnection: () => void;
  isConnecting: boolean;
}

const Element: React.FC<ElementProps> = ({
  data,
  onMove,
  onTextChange,
  onDelete,
  GRID_SIZE,
  containerRef,
  onStartConnection,
  onCompleteConnection,
  isConnecting,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = data.x;
    const startTop = data.y;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        let newX = startLeft + e.clientX - startX;
        let newY = startTop + e.clientY - startY;

        // Boundary checks
        newX = Math.max(0, Math.min(newX, containerRect.width - GRID_SIZE * 4));
        newY = Math.max(
          0,
          Math.min(newY, containerRect.height - GRID_SIZE * 2)
        );

        // Snap to grid
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

        onMove(data.id, newX, newY);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onTextChange(data.id, editText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      onTextChange(data.id, editText);
    }
  };

  const formatDuration = (duration: Duration) => {
    return `${duration.approx_time} weeks`;
  };

  return (
    <div
      className={`absolute p-2 rounded shadow-md cursor-move flex flex-col justify-between text-sm font-italic ${
        data.isStartElement
          ? "bg-accent text-background dark:text-foreground dark:bg-gray-800"
          : "bg-foreground text-background dark:text-foreground dark:bg-gray-800"
      }`}
      style={{
        left: data.x,
        top: data.y,
        width: GRID_SIZE * 4,
        height: GRID_SIZE * 1.2,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isConnecting) {
          onCompleteConnection();
        }
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none text-sm"
          autoFocus
        />
      ) : (
        <>
          <div className="p-2">{data.text}</div>
          <div className="flex justify-between items-center text-gray-500">
            {data.duration && <span>{formatDuration(data.duration)}</span>}
            {data.skills && <span>Skills: {data.skills.join(", ")}</span>}
          </div>
        </>
      )}
      <button
        onClick={() => onDelete(data.id)}
        className="absolute top-0 right-0 p-1"
      ></button>
      {isHovered && !isConnecting && (
        <button
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-accent rounded-full p-1"
          onClick={(e) => {
            e.stopPropagation();
            onStartConnection();
          }}
        >
          <FaPlus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default Element;
