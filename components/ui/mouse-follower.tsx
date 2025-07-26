// components/ui/mouse-follower.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * An animated circular cursor that follows the mouse/touch,
 * scaling its size based on its speed of movement, similar to macOS.
 * It also hides when hovering over specified interactive elements (e.g., buttons).
 *
 * @param {string} [color="white"] - The solid color of the cursor.
 * @param {number} [baseSize=10] - The base size (width and height) of the cursor in pixels when stationary.
 * @param {number} [maxSizeMultiplier=5] - The maximum multiplier for the cursor's size when moving rapidly (e.g., 1.5 means 1.5x baseSize).
 * @param {number} [maxSpeedThreshold=2000] - The speed (pixels/second) at which the cursor reaches its maxSizeMultiplier.
 * @param {boolean} [hideOnInteractive=false] - If true, the cursor will hide when hovering over elements matching interactiveSelectors.
 * @param {string[]} [interactiveSelectors=['a', 'button', 'input[type="submit"]', 'input[type="button"]', '[data-interactive]']] - CSS selectors for elements that the cursor should react to for hiding.
 */
export function MouseFollower({
  color = "white",
  baseSize = 10,
  maxSizeMultiplier = 5,
  maxSpeedThreshold = 5000,
  hideOnInteractive = false, // <--- RE-ADDED PROP
  interactiveSelectors = ['a', 'button', 'input[type="submit"]', 'input[type="button"]', '[data-interactive]'], // <--- RE-ADDED PROP
}) {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false); // <--- RE-ADDED STATE
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(performance.now());
  const currentVelocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX, clientY;
      if ('touches' in e) {
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = -100;
          clientY = -100;
        }
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      setMousePosition({ x: clientX, y: clientY });
    };

    // <--- RE-ADDED checkHover FUNCTION
    const checkHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if any interactive selector matches the target or its ancestors
      const isCurrentlyInteractive = interactiveSelectors.some(selector => target.closest(selector));
      setIsHovering(isCurrentlyInteractive);
    };
    // ---> END RE-ADDED checkHover FUNCTION

    const animateCursor = () => {
      if (mousePosition.x === -100) {
        currentVelocityRef.current = 0;
      } else {
        const dx = mousePosition.x - lastPositionRef.current.x;
        const dy = mousePosition.y - lastPositionRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTimeRef.current) / 1000;

        if (deltaTime > 0) {
          const instantaneousSpeed = distance / deltaTime;
          currentVelocityRef.current = currentVelocityRef.current * 0.8 + instantaneousSpeed * 0.2;
        } else {
          currentVelocityRef.current = 0;
        }
      }

      lastPositionRef.current = { x: mousePosition.x, y: mousePosition.y };
      lastTimeRef.current = performance.now();

      animationFrameRef.current = requestAnimationFrame(animateCursor);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove);
    window.addEventListener("touchstart", handlePointerMove);
    window.addEventListener("touchend", handlePointerMove);
    window.addEventListener("touchcancel", handlePointerMove);

    // <--- RE-ADDED MOUSEOVER/MOUSEOUT LISTENERS
    window.addEventListener("mouseover", checkHover);
    window.addEventListener("mouseout", checkHover);
    // ---> END RE-ADDED MOUSEOVER/MOUSEOUT LISTENERS

    animationFrameRef.current = requestAnimationFrame(animateCursor);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchstart", handlePointerMove);
      window.removeEventListener("touchend", handlePointerMove);
      window.removeEventListener("touchcancel", handlePointerMove);

      // <--- RE-ADDED CLEANUP FOR MOUSEOVER/MOUSEOUT
      window.removeEventListener("mouseover", checkHover);
      window.removeEventListener("mouseout", checkHover);
      // ---> END RE-ADDED CLEANUP

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePosition, interactiveSelectors]); // Added interactiveSelectors to dependency array

  const speedNormalized = Math.min(Math.max(currentVelocityRef.current / maxSpeedThreshold, 0), 1);
  const finalScale = 1 + (maxSizeMultiplier - 1) * speedNormalized;

  // <--- NEW LOGIC FOR OPACITY CONTROL
  let currentOpacity = mousePosition.x === -100 ? 0 : 1; // Base opacity: visible if on screen

  if (hideOnInteractive && isHovering) {
    currentOpacity = 0; // Override to hide if `hideOnInteractive` is true AND hovering an interactive element
  }
  // ---> END NEW LOGIC

  return (
    <motion.div
      className="fixed pointer-events-none rounded-full z-[9999] will-change-transform"
      style={{
        left: mousePosition.x,
        top: mousePosition.y,
        width: baseSize,
        height: baseSize,
        backgroundColor: color,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: currentOpacity, // Use the dynamically calculated opacity
        scale: finalScale,
        x: -baseSize / 2,
        y: -baseSize / 2,
      }}
      transition={{
        opacity: { duration: 0.15, ease: "linear" },
        scale: { duration: 0.08, ease: "easeOut" },
      }}
    />
  );
}