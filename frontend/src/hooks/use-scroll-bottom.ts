import { useEffect, useRef } from "react";

const useScrollToBottom = (dependencies: any[] = []) => {
  const containerEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerEndRef.current) {
      containerEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, dependencies);

  return containerEndRef;
};

export default useScrollToBottom; 