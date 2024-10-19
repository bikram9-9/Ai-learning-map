import React, { useState, useEffect, useRef } from "react";
import { ElementData } from "@/types/general";

const Element: React.FC<{
  data: ElementData;
  onMove: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, text: string) => void;
  GRID_SIZE: number;
  containerRef: React.RefObject<HTMLDivElement>;
}> = ({ data, onMove, onTextChange, GRID_SIZE, containerRef }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: data.x, y: data.y });
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

  return (
    <div
      ref={elementRef}
      className="absolute p-2 rounded shadow-md cursor-move"
      style={{
        left: position.x,
        top: position.y,
        minWidth: "100px",
        minHeight: "40px",
        backgroundColor: "#01161e",
        color: "#eff6e0",
      }}
      onMouseDown={handleMouseDown}
    >
      <input
        type="text"
        value={data.text}
        onChange={(e) => onTextChange(data.id, e.target.value)}
        className="w-full bg-transparent outline-none text-inherit"
      />
    </div>
  );
};

export default Element;
