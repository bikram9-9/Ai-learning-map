import React, { useState, useEffect, useRef } from "react";
import { ElementData } from "@/types/general";
import { FaTimes } from "react-icons/fa";

interface ElementProps {
  data: ElementData;
  onMove: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, text: string) => void;
  GRID_SIZE: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onDelete: (id: string) => void;
}

const Element: React.FC<ElementProps> = ({
  data,
  onMove,
  onTextChange,
  GRID_SIZE,
  containerRef,
  onDelete,
}) => {
  const [position, setPosition] = useState({ x: data.x, y: data.y });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current && elementRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const elementRect = elementRef.current.getBoundingClientRect();

        let newX = e.clientX - containerRect.left - elementRect.width / 2;
        let newY = e.clientY - containerRect.top - elementRect.height / 2;

        // Boundary checks
        newX = Math.max(
          0,
          Math.min(newX, containerRect.width - elementRect.width)
        );
        newY = Math.max(
          0,
          Math.min(newY, containerRect.height - elementRect.height)
        );

        // Snap to grid
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

        setPosition({ x: newX, y: newY });
        onMove(data.id, newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, data.id, onMove, GRID_SIZE, containerRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onTextChange(data.id, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      onTextChange(data.id, text);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(data.id);
  };

  return (
    <div
      ref={elementRef}
      className="absolute p-2 rounded shadow-md cursor-move bg-white dark:bg-gray-800 text-black dark:text-white group"
      style={{
        left: position.x,
        top: position.y,
        minWidth: "100px",
        minHeight: "40px",
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <button
        onClick={handleDelete}
        className="absolute top-0 right-0 p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Delete element"
      >
        <FaTimes size={12} />
      </button>
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent outline-none"
          autoFocus
        />
      ) : (
        <div>{text}</div>
      )}
    </div>
  );
};

export default Element;
