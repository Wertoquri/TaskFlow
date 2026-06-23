import { useEffect, useRef, useState } from "react";

export default function useMobileMenuPosition(isOpen, { maxWidth = 340 } = {}) {
  const triggerRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  useEffect(() => {
    function updatePosition() {
      if (!isOpen || !triggerRef.current) {
        setMenuStyle(null);
        return;
      }

      const isMobile = window.matchMedia("(max-width: 640px)").matches;
      if (!isMobile) {
        setMenuStyle(null);
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gutter = 12;
      const width = Math.min(maxWidth, viewportWidth - gutter * 2);
      const left = Math.max(
        gutter,
        Math.min(rect.left, viewportWidth - width - gutter)
      );
      const top = Math.min(rect.bottom + 8, viewportHeight - 80);
      const maxHeight = Math.max(180, viewportHeight - top - gutter);

      setMenuStyle({
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        right: "auto",
        width: `${width}px`,
        maxWidth: `calc(100vw - ${gutter * 2}px)`,
        maxHeight: `${maxHeight}px`,
        overflowY: "auto",
        zIndex: 5000,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, maxWidth]);

  return { triggerRef, menuStyle };
}
