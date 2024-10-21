import { Duration } from "@/types/general.types";

export function formatDuration(duration: Duration): string {
  // Helper function to parse time strings like "2 weeks" or "3 months"
  const parseTimeString = (timeString: string): number => {
    const [value, unit] = timeString.split(" ");
    const numValue = parseInt(value, 10);
    switch (unit.toLowerCase()) {
      case "day":
      case "days":
        return numValue;
      case "week":
      case "weeks":
        return numValue * 7;
      case "month":
      case "months":
        return numValue * 30; // Approximation
      case "year":
      case "years":
        return numValue * 365; // Approximation
      default:
        return 0;
    }
  };

  const approxDays = parseTimeString(duration.approx_time);
  const masteryDays = parseTimeString(duration.mastery_time);

  if (approxDays === masteryDays) {
    return `${duration.approx_time}`;
  } else {
    return `${duration.approx_time} - ${duration.mastery_time}`;
  }
}
