import React, { useState, useRef, useEffect } from "react";
import { ElementData, Duration } from "@/types/general.types";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";

interface ElementProps {
  data: ElementData & { isStartElement?: boolean };
  onMove: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  GRID_SIZE: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onStartConnection: (id: string) => void;
  onCompleteConnection: () => boolean;
  isConnecting: boolean;
  isConnectionStart: boolean;
}

const PlusIcon: React.FC<{ position: string; onClick: () => void }> = ({
  position,
  onClick,
}) => {
  return (
    <button
      className={`absolute bg-accent rounded-full p-1 ${position}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <FaPlus className="w-3 h-3" />
    </button>
  );
};

const Element: React.FC<ElementProps> = ({
  data,
  onMove,
  onTextChange,
  GRID_SIZE,
  containerRef,
  onStartConnection,
  onCompleteConnection,
  isConnecting,
  isConnectionStart,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPlusIcons, setShowPlusIcons] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

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

  const formatDuration = (duration: Duration | undefined): string => {
    if (!duration) return "Duration unknown";
    if (duration.approx_time) {
      return `${duration.approx_time} weeks`;
    }
    if (duration.start_time && duration.mastery_time) {
      const start = parseInt(duration.start_time);
      const mastery = parseInt(duration.mastery_time);
      if (!isNaN(start) && !isNaN(mastery)) {
        return `${mastery - start} weeks`;
      }
    }
    return "Duration format unknown";
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isConnecting) {
      e.stopPropagation();
      onCompleteConnection();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const isNear =
          e.clientX >= rect.left - 32 &&
          e.clientX <= rect.right + 32 &&
          e.clientY >= rect.top - 32 &&
          e.clientY <= rect.bottom + 32;
        setShowPlusIcons(isNear);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const elementClasses = data.isStartElement
    ? "bg-accent text-background dark:text-foreground dark:bg-gray-800"
    : "bg-foreground text-background dark:text-foreground dark:bg-gray-800";

  return (
    <div
      ref={elementRef}
      className={`absolute p-2 rounded shadow-md cursor-move flex flex-col justify-between text-sm font-italic ${elementClasses} ${
        isConnectionStart ? "ring-2 ring-accent" : ""
      }`}
      style={{
        left: data.x,
        top: data.y,
        width: GRID_SIZE * 4,
        height: GRID_SIZE * 1.2,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
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
        <div className="p-2">{data.text}</div>
      )}
      {showPlusIcons && !isConnecting && !isConnectionStart && (
        <>
          <PlusIcon
            position="left-0 top-1/2 -translate-x-full -translate-y-1/2"
            onClick={() => onStartConnection(data.id)}
          />
          <PlusIcon
            position="right-0 top-1/2 translate-x-full -translate-y-1/2"
            onClick={() => onStartConnection(data.id)}
          />
          <PlusIcon
            position="top-0 left-1/2 -translate-x-1/2 -translate-y-full"
            onClick={() => onStartConnection(data.id)}
          />
          <PlusIcon
            position="bottom-0 left-1/2 -translate-x-1/2 translate-y-full"
            onClick={() => onStartConnection(data.id)}
          />
        </>
      )}
      {isConnectionStart && (
        <div className="absolute inset-0 bg-accent opacity-20 rounded pointer-events-none"></div>
      )}
      {data.skills && data.skills.length > 0 && (
        <div
          className={`absolute top-full left-0 w-full shadow-md rounded-b p-2 z-10 ${elementClasses}`}
        >
          {data.skills.map((skill, index) => (
            <Link href={`/skill?name=${encodeURIComponent(skill)}`} key={index}>
              <span className="block underline cursor-pointer hover:text-accent">
                {skill}: {formatDuration(data.duration)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Element;
