import React, { useState, useCallback } from 'react';
import ToolPane from './components/ToolPane';
import TableView from './components/TableView';
import DetailView from './components/DetailView';
import Resizer from './components/Resizer';

const App = () => {
  const [isToolPaneCollapsed, setIsToolPaneCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('import');
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editedCells, setEditedCells] = useState(new Set());
  const [columnMapping, setColumnMapping] = useState({
    question: '',
    golden: '',
    bot: ''
  });  const [tableWidth, setTableWidth] = useState(60);
  const [hasRemarkColumn, setHasRemarkColumn] = useState(false);
  const [addRemarkColumn, setAddRemarkColumn] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [rowsToShow, setRowsToShow] = useState(10);
  const [columnOrder, setColumnOrder] = useState([]);

  const handleDataImport = useCallback((importedData, importedHeaders, mapping, includeRemark = false) => {
    setData(importedData);
    setHeaders(importedHeaders);
    setColumnMapping(mapping);
    setHasRemarkColumn(includeRemark);
    setSelectedRow(importedData.length > 0 ? 0 : null);
    setEditedCells(new Set());
    setIsToolPaneCollapsed(true);
    setActiveTab('');
    
    // Initialize all columns as visible
    const initialVisibleColumns = {};
    importedHeaders.forEach(header => {
      initialVisibleColumns[header] = true;
    });
    setVisibleColumns(initialVisibleColumns);
    
    // Initialize column order
    setColumnOrder(importedHeaders);
  }, []);

  const handleCellEdit = useCallback((rowIndex, columnKey, value) => {
    setData(prevData => {
      const newData = [...prevData];
      newData[rowIndex] = { ...newData[rowIndex], [columnKey]: value };
      return newData;
    });
    
    setEditedCells(prev => new Set([...prev, `${rowIndex}-${columnKey}`]));
  }, []);

  const handleRowSelect = useCallback((rowIndex) => {
    setSelectedRow(rowIndex);
  }, []);

  const handleExport = useCallback(() => {
    setActiveTab('export');
    setIsToolPaneCollapsed(false);
  }, []);

  const handleVisibleColumnsChange = useCallback((newVisibleColumns) => {
    setVisibleColumns(newVisibleColumns);
  }, []);  const handleRowsToShowChange = useCallback((newRowsToShow) => {
    setRowsToShow(newRowsToShow);
  }, []);

  const handleAddRemarkColumnChange = useCallback((shouldAdd) => {
    setAddRemarkColumn(shouldAdd);
    
    // If enabling remark column and data exists, add it to headers and data
    if (shouldAdd && data.length > 0 && !headers.includes('remark')) {
      const newHeaders = [...headers, 'remark'];
      setHeaders(newHeaders);
      setHasRemarkColumn(true);
      
      // Add remark column to existing data
      const newData = data.map(row => ({
        ...row,
        remark: row.remark || ''
      }));
      setData(newData);
      
      // Make remark column visible by default
      setVisibleColumns(prev => ({
        ...prev,
        remark: true
      }));
      
      // Add to column order
      setColumnOrder(prev => [...prev, 'remark']);
    }
    // If disabling remark column, remove it from headers and data
    else if (!shouldAdd && headers.includes('remark')) {
      const newHeaders = headers.filter(h => h !== 'remark');
      setHeaders(newHeaders);
      setHasRemarkColumn(false);
      
      // Remove remark column from data
      const newData = data.map(row => {
        const { remark, ...restRow } = row;
        return restRow;
      });
      setData(newData);
      
      // Remove remark column from visible columns
      setVisibleColumns(prev => {
        const { remark, ...restColumns } = prev;
        return restColumns;
      });
      
      // Remove from column order
      setColumnOrder(prev => prev.filter(col => col !== 'remark'));
    }
  }, [data, headers]);

  const handleColumnOrderChange = useCallback((newOrder) => {
    setColumnOrder(newOrder);
  }, []);

  const getSelectedRowData = () => {
    if (selectedRow === null || !data[selectedRow]) return null;
    return data[selectedRow];
  };

  return (
    <div className="app-container">
      <div className="top-bar"></div>
      <div className="main-content">        <ToolPane
          isCollapsed={isToolPaneCollapsed}
          activeTab={activeTab}
          onToggleCollapse={() => setIsToolPaneCollapsed(!isToolPaneCollapsed)}
          onTabChange={setActiveTab}
          onDataImport={handleDataImport}
          onExport={handleExport}
          data={data}
          headers={headers}
          columnMapping={columnMapping}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={handleVisibleColumnsChange}
          rowsToShow={rowsToShow}
          onRowsToShowChange={handleRowsToShowChange}
          addRemarkColumn={addRemarkColumn}
          onAddRemarkColumnChange={handleAddRemarkColumnChange}
        /><div style={{ width: `${tableWidth}%` }}>
          <TableView
            data={data}
            headers={headers}
            columnMapping={columnMapping}
            selectedRow={selectedRow}
            editedCells={editedCells}
            hasRemarkColumn={hasRemarkColumn}
            visibleColumns={visibleColumns}
            columnOrder={columnOrder}
            rowsToShow={rowsToShow}
            onCellEdit={handleCellEdit}
            onRowSelect={handleRowSelect}
            onColumnOrderChange={handleColumnOrderChange}
          />
        </div><Resizer
          onResize={(newWidth) => {
            setTableWidth(newWidth);
          }}
        />

        <div style={{ width: `${100 - tableWidth}%` }}>
          <DetailView
            rowData={getSelectedRowData()}
            columnMapping={columnMapping}
          />
        </div>
      </div>
        {/* Floating credit note */}
      <div className="credit-note">
        <span>MIT License • Created by </span>
        <em>Joshua Hui</em>
        <span> • </span>
        <a 
          href="https://github.com/c2js/LLMAnswerSplitViewer" 
          target="_blank" 
          rel="noopener noreferrer"
          className="github-link"
        >
          Github ⭐ Star if you like this
        </a>
      </div>
    </div>
  );
};

export default App;
