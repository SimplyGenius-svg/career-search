import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import { ViewMode } from "@/types";

interface ViewModeSwitcherProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export const ViewModeSwitcher = ({ mode, onModeChange }: ViewModeSwitcherProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`flex rounded-lg p-1 flex-shrink-0 ${ // Added flex-shrink-0
      resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"}
    }> {/* Adjusted background */}
      <motion.button
        onClick={() => onModeChange("full")}
        className={`p-2 rounded-md transition-colors ${
          mode === "full"
            ? resolvedTheme === "dark"
              ? "bg-gray-600 text-white" // Adjusted active button background and text color
              : "bg-white text-gray-900 shadow-sm" // Adjusted active button background and text color
            : resolvedTheme === "dark"
              ? "text-gray-400 hover:text-gray-200" // Adjusted inactive button text color
              : "text-gray-500 hover:text-gray-700" // Adjusted inactive button text color
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Switch to full view"
      >
        <Maximize2 className="w-4 h-4" /> {/* Check icon size and color if needed */}
      </motion.button>

      <motion.button
        onClick={() => onModeChange("compact")}
        className={`p-2 rounded-md transition-colors ${
          mode === "compact"
            ? resolvedTheme === "dark"
              ? "bg-gray-600 text-white" // Adjusted active button background and text color
              : "bg-white text-gray-900 shadow-sm" // Adjusted active button background and text color
            : resolvedTheme === "dark"
              ? "text-gray-400 hover:text-gray-200" // Adjusted inactive button text color
              : "text-gray-500 hover:text-gray-700" // Adjusted inactive button text color
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Switch to compact view"
      >
        <Minimize2 className="w-4 h-4" /> {/* Check icon size and color if needed */}
      </motion.button>
    </div>
  );
}; 