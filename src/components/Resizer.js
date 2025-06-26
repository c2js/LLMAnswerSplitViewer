import React, { useState, useRef, useCallback } from 'react';

const Resizer = ({ onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const currentTableWidth = useRef(60);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    startX.current = e.clientX;
    
    // Get current table width
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      const tableContainer = mainContent.children[1]; // Second child is the table container
      if (tableContainer && tableContainer.style.width) {
        currentTableWidth.current = parseFloat(tableContainer.style.width) || 60;
      }
    }
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX.current;
      const containerWidth = window.innerWidth - 60; // Subtract tool pane width
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(30, Math.min(70, currentTableWidth.current + deltaPercent));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [onResize]);

  return (
    <div
      className={`resizer ${isResizing ? 'resizing' : ''}`}
      onMouseDown={handleMouseDown}
      style={{
        userSelect: 'none',
        zIndex: 10
      }}
    />
  );
};

export default Resizer;
