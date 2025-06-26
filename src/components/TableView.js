import React, { useState, useEffect, useCallback, useRef } from 'react';

const TableView = ({
  data,
  headers,
  columnMapping,
  selectedRow,
  editedCells,
  hasRemarkColumn,
  visibleColumns,
  columnOrder,
  rowsToShow = 10,
  onCellEdit,
  onRowSelect,
  onColumnOrderChange
}) => {
  // Function to check if a column is mapped
  const isMappedColumn = (header) => {
    return header === columnMapping.question || 
           header === columnMapping.golden || 
           header === columnMapping.bot ||
           header === 'question' ||
           header === 'golden' ||
           header === 'bot' ||
           header === 'remark';
  };

  const [currentPage, setCurrentPage] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedCell, setExpandedCell] = useState(null);
  const [calculatedRowHeight, setCalculatedRowHeight] = useState(60);
  const [pageInputValue, setPageInputValue] = useState('1');
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Get visible headers based on visibleColumns prop
  const getVisibleHeaders = () => {
    // If no headers, return empty array
    if (!headers || headers.length === 0) {
      return [];
    }
    
    // Use columnOrder if available, otherwise use headers order
    const orderedHeaders = columnOrder && columnOrder.length > 0 ? columnOrder : headers;
    
    // If visibleColumns is not set or empty, show all headers
    if (!visibleColumns || Object.keys(visibleColumns).length === 0) {
      return orderedHeaders;
    }
    
    // Filter headers based on visibility
    const filtered = orderedHeaders.filter(header => visibleColumns[header] !== false);
    return filtered;
  };

  const visibleHeaders = getVisibleHeaders();const [columnWidths, setColumnWidths] = useState({
    question: 200,
    golden: 300,
    bot: 300,
    remark: 250
  });
    const tableRef = useRef();
  const dataLengthRef = useRef(data.length);  // Calculate optimal row height to fit the desired number of rows in viewport
  const calculateOptimalRowHeight = useCallback(() => {
    // Get viewport height
    const viewportHeight = window.innerHeight;
    
    // Estimate available height for table content
    // Subtract header bar (~50px), table controls (~60px), pagination (~40px), and some padding
    const reservedHeight = 200; // Conservative estimate
    const availableHeight = viewportHeight - reservedHeight;
    
    // Calculate height per row
    const headerHeight = 40; // Approximate table header height
    const contentHeight = availableHeight - headerHeight;
    const optimalRowHeight = Math.max(30, Math.floor(contentHeight / rowsToShow));
    
    return Math.min(optimalRowHeight, 150); // Cap at 150px for readability
  }, [rowsToShow]);

  // Update calculated row height when rowsToShow changes or window resizes
  useEffect(() => {
    const newRowHeight = calculateOptimalRowHeight();
    setCalculatedRowHeight(newRowHeight);
  }, [rowsToShow, calculateOptimalRowHeight]);

  // Handle window resize for recalculating row height
  useEffect(() => {
    const handleResize = () => {
      const newRowHeight = calculateOptimalRowHeight();
      setCalculatedRowHeight(newRowHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateOptimalRowHeight]);
  useEffect(() => {
    // Only reset page when data is completely replaced (import), not when edited
    if (data.length !== dataLengthRef.current) {
      setCurrentPage(0);
      setPageInputValue('1');
      dataLengthRef.current = data.length;
    }
  }, [data.length]);

  // Update page input value when current page changes
  useEffect(() => {
    if (!isEditingPage) {
      setPageInputValue((currentPage + 1).toString());
    }
  }, [currentPage, isEditingPage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!data.length) return;
      
      const maxRow = Math.min(data.length - 1, getVisibleData().length - 1);
      let newRow = selectedRow;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newRow = Math.max(0, (selectedRow || 0) - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newRow = Math.min(maxRow, (selectedRow || 0) + 1);
          break;
        default:
          return;
      }
      
      onRowSelect(currentPage * rowsToShow + newRow);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);  }, [selectedRow, data.length, currentPage, rowsToShow, onRowSelect]);

  const getVisibleData = () => {
    const start = currentPage * rowsToShow;
    return data.slice(start, start + rowsToShow);
  };
  const getTotalPages = () => {
    return Math.ceil(data.length / rowsToShow);
  };

  const handlePageInputChange = (e) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const pageNum = parseInt(pageInputValue, 10);
    const totalPages = getTotalPages();
    
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum - 1); // Convert to 0-based index
      setIsEditingPage(false);
    } else {
      // Reset to current page if invalid input
      setPageInputValue((currentPage + 1).toString());
      setIsEditingPage(false);
    }
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    } else if (e.key === 'Escape') {
      setPageInputValue((currentPage + 1).toString());
      setIsEditingPage(false);
    }
  };

  const handlePageSpanClick = () => {
    setIsEditingPage(true);
    setPageInputValue((currentPage + 1).toString());
  };

  const handleCellChange = useCallback((rowIndex, columnKey, value) => {
    const actualRowIndex = currentPage * rowsToShow + rowIndex;
    onCellEdit(actualRowIndex, columnKey, value);
  }, [currentPage, rowsToShow, onCellEdit]);
  const handleRowClick = useCallback((rowIndex) => {
    const actualRowIndex = currentPage * rowsToShow + rowIndex;
    onRowSelect(actualRowIndex);
  }, [currentPage, rowsToShow, onRowSelect]);

  const handleCellFocus = (rowIndex, columnKey) => {
    setExpandedRow(rowIndex);
    setExpandedCell(`${rowIndex}-${columnKey}`);
  };

  const handleCellBlur = () => {
    setExpandedRow(null);
    setExpandedCell(null);
  };

  const handleCellKeyDown = (e) => {
    if (e.key === 'Escape') {
      // Cancel cell expansion when Escape is pressed
      setExpandedRow(null);
      setExpandedCell(null);
      // Keep the textarea focused but return to normal size
      e.preventDefault();
    }
  };
  // Drag and drop handlers for column reordering
  const handleDragStart = (e, columnIndex) => {
    setDraggedColumn(columnIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, columnIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnIndex);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, dropColumnIndex) => {
    e.preventDefault();
    
    if (draggedColumn === null || draggedColumn === dropColumnIndex) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    // Get the current ordered headers
    const currentOrder = columnOrder && columnOrder.length > 0 ? [...columnOrder] : [...headers];
    
    // Remove the dragged column from its current position
    const draggedHeader = currentOrder[draggedColumn];
    currentOrder.splice(draggedColumn, 1);
    
    // Insert it at the new position
    currentOrder.splice(dropColumnIndex, 0, draggedHeader);
    
    // Update the column order
    onColumnOrderChange(currentOrder);
    
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };
  const getVisibleSelectedRow = () => {
    if (selectedRow === null) return null;
    
    const start = currentPage * rowsToShow;
    const end = start + rowsToShow;
    
    if (selectedRow >= start && selectedRow < end) {
      return selectedRow - start;
    }
    return null;
  };
  const handleColumnResize = (column, newWidth) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(10, newWidth)
    }));
  };

  const ResizeHandle = ({ column, width }) => {
    const [isResizing, setIsResizing] = useState(false);
    const startX = useRef(0);
    const startWidth = useRef(0);    const handleMouseDown = (e) => {
      e.stopPropagation(); // Prevent parent drag events
      setIsResizing(true);
      startX.current = e.clientX;
      startWidth.current = width;
      
      const handleMouseMove = (e) => {
        const delta = e.clientX - startX.current;
        const newWidth = startWidth.current + delta;
        handleColumnResize(column, newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    return (
      <div
        className="resize-handle"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '4px',
          height: '100%',
          cursor: 'col-resize',
          backgroundColor: isResizing ? '#3498db' : 'transparent',
          zIndex: 15
        }}
        onMouseDown={handleMouseDown}
        onDragStart={(e) => e.preventDefault()} // Prevent any drag events
      />
    );
  };  // Update column widths when headers change
  useEffect(() => {
    if (headers.length > 0) {
      setColumnWidths(prevWidths => {
        const newWidths = { ...prevWidths };
        const visibleHeadersCount = visibleHeaders.length;
        
        headers.forEach(header => {
          if (!newWidths[header]) {
            // Calculate dynamic width based on number of columns
            let defaultWidth = 200; // Base width
            
            // Adjust width based on number of visible columns to ensure horizontal scrolling
            if (visibleHeadersCount > 8) {
              defaultWidth = 160; // Smaller columns for many columns
            } else if (visibleHeadersCount > 5) {
              defaultWidth = 180; // Medium columns
            }
              // Special widths for known column types
            if (header.toLowerCase().includes('question')) {
              defaultWidth = Math.max(50, defaultWidth);
            } else if (header.toLowerCase().includes('answer') || header.toLowerCase().includes('response')) {
              defaultWidth = Math.max(50, defaultWidth);
            } else if (header === 'remark' || header.toLowerCase().includes('remark')) {
              defaultWidth = Math.max(50, defaultWidth);
            } else if (header.length > 25) {
              defaultWidth = Math.max(50, defaultWidth); // Ensure readability for long headers
            } else if (header.length < 10) {
              defaultWidth = Math.max(50, defaultWidth - 40); // Shorter columns for short headers
            }
            
            // Ensure minimum width for horizontal scrolling
            newWidths[header] = Math.max(10, defaultWidth);
          }
        });
        return newWidths;
      });
    }
  }, [headers, visibleHeaders.length]);

  if (data.length === 0) {
    return (
      <div className="table-panel">
        <div className="empty-state">
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
          <h3>No Data Loaded</h3>
          <p>Import an Excel file to get started</p>
        </div>
      </div>
    );
  }

  const visibleData = getVisibleData();
  const visibleSelectedRow = getVisibleSelectedRow();
  return (
    <div className="table-panel">
      <div className="table-controls">
        <div className="page-size-selector">
          <span style={{ fontSize: '13px', color: '#666' }}>
            Showing {rowsToShow} rows per page (row height: {calculatedRowHeight}px)
          </span>
        </div>        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="pagination-button"
          >
            ◀ Prev
          </button>
          <div className="page-input-container">
            <span>Page </span>
            {isEditingPage ? (
              <input
                type="text"
                value={pageInputValue}
                onChange={handlePageInputChange}
                onBlur={handlePageInputSubmit}
                onKeyDown={handlePageInputKeyDown}
                className="page-input"
                autoFocus
              />
            ) : (
              <span 
                className="page-number-clickable"
                onClick={handlePageSpanClick}
                title="Click to jump to page"
              >
                {currentPage + 1}
              </span>
            )}
            <span> of {getTotalPages()}</span>
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(getTotalPages() - 1, prev + 1))}
            disabled={currentPage >= getTotalPages() - 1}
            className="pagination-button"
          >
            Next ▶
          </button>
        </div>
      </div>      <div className="table-container" ref={tableRef}>
        <div className="table-scroll-wrapper">
          <table className="data-table">
            <thead className="table-header">              <tr>
                {visibleHeaders.map((header) => {
                  const displayName = header === 'question' ? 'Question' :
                                     header === 'golden' ? 'Golden Answer' :
                                     header === 'bot' ? 'Bot Answer' :
                                     header === 'remark' ? 'Remark' : 
                                     header.charAt(0).toUpperCase() + header.slice(1);
                  
                  const isMapped = isMappedColumn(header);                  return (
                    <th 
                      key={header}
                      style={{ 
                        width: columnWidths[header] || 200,
                        position: 'relative',
                        minWidth: '10px',
                        backgroundColor: isMapped ? '#e8f5e8' : '#dddddd',
                        color: isMapped ? '#2d5a2d' : '#3b3b3b',
                        opacity: draggedColumn === visibleHeaders.indexOf(header) ? 0.5 : 1,
                        border: dragOverColumn === visibleHeaders.indexOf(header) ? '2px solid #3498db' : '1px solid #bbb',
                        padding: 0
                      }}
                      onDragOver={(e) => handleDragOver(e, visibleHeaders.indexOf(header))}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, visibleHeaders.indexOf(header))}
                    >                      <div
                        className="header-content"
                        style={{
                          padding: '6px 8px',
                          cursor: 'move',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          paddingRight: '12px' // Make room for resize handle
                        }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, visibleHeaders.indexOf(header))}
                        onDragEnd={handleDragEnd}
                      >
                        {displayName}
                      </div>
                      <ResizeHandle column={header} width={columnWidths[header] || 200} />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleData.map((row, index) => {
                const actualRowIndex = currentPage * rowsToShow + index;
                const isSelected = index === visibleSelectedRow;
                const isExpanded = expandedRow === index;

                return (
                  <tr
                    key={row.id || index}
                    className={`table-row ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => handleRowClick(index)}
                    style={{ height: `${calculatedRowHeight}px` }}
                  >
                    {visibleHeaders.map((header) => {
                      const cellKey = `${index}-${header}`;
                      const isExpandedCell = expandedCell === cellKey;
                      
                      return (
                        <td key={header} className="table-cell" style={{ width: columnWidths[header] || 200 }}>
                          <textarea
                            className={`cell-input ${editedCells.has(`${actualRowIndex}-${header}`) ? 'edited' : ''}`}
                            value={row[header] || ''}
                            onChange={(e) => handleCellChange(index, header, e.target.value)}
                            onFocus={() => handleCellFocus(index, header)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleCellKeyDown}
                            onWheel={(e) => {
                              if (expandedCell !== cellKey) {
                                e.preventDefault();
                              }
                            }}
                            style={{
                              height: isExpandedCell ? `${window.innerHeight * 0.3}px` : `${calculatedRowHeight - 8}px`,
                              minHeight: `${calculatedRowHeight - 8}px`,
                              transition: 'height 0.2s ease-in-out',
                              overflow: isExpandedCell ? 'auto' : 'hidden',
                              resize: isExpandedCell ? 'vertical' : 'none'
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableView;
