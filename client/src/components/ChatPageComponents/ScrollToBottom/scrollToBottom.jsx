import { useState, useEffect } from "react";
import { FaArrowDown } from "react-icons/fa";
import "./ScrollToBottom.css";

const ScrollToBottom = ({ containerRef, targetRef }) => {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToBottom = () => {
    if (containerRef.current && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      // Show button if the user is scrolled up at least 100px from the bottom
      const isScrolledUp =
        containerRef.current.scrollHeight -
          containerRef.current.scrollTop -
          containerRef.current.clientHeight >
        100;

      setIsVisible(isScrolledUp);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, [containerRef]);

  return (
    <button
      className={`scroll-to-bottom-btn ${isVisible ? "show" : ""}`}
      onClick={scrollToBottom}
    >
      <FaArrowDown />
    </button>
  );
};

export default ScrollToBottom;
