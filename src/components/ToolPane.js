import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const ToolPane = ({
  isCollapsed,
  activeTab,
  onToggleCollapse,
  onTabChange,
  onDataImport,
  onExport,
  data,
  headers,
  columnMapping,
  visibleColumns,
  onVisibleColumnsChange,
  onRowsToShowChange,
  rowsToShow = 10,
  addRemarkColumn = false,
  onAddRemarkColumnChange
}) => {  const [fileHeaders, setFileHeaders] = useState([]);
  const [skipRows, setSkipRows] = useState(0);  const [localColumnMapping, setLocalColumnMapping] = useState({
    question: '',
    golden: '',
    bot: ''
  });
  const [exportMode, setExportMode] = useState('all'); // 'all' or 'selected'
  const [exportFilename, setExportFilename] = useState('evaluation_data_exported.xlsx');
  const fileInputRef = useRef();

  // Generate sample data for testing
  const generateSampleData = () => {
    const sampleQuestions = [
      "What is the capital of France?",
      "How do you calculate the area of a circle?",
      "What is photosynthesis?",
      "Who wrote Romeo and Juliet?",
      "What is the largest planet in our solar system?",
      "How many bones are in the human body?",
      "What is the chemical symbol for gold?",
      "When did World War II end?",
      "What is the speed of light?",
      "Who invented the telephone?",
      "What is the smallest unit of matter?",
      "How many continents are there?",
      "What is the boiling point of water?",
      "Who painted the Mona Lisa?",
      "What is the largest ocean?",
      "How many chambers does a human heart have?",
      "What is the currency of Japan?",
      "Who developed the theory of relativity?",
      "What is the hardest natural substance?",
      "How many seconds are in a minute?"
    ];

    const sampleTruthAnswers = [
      "Paris",
      "π × r² (pi times radius squared)",
      "The process by which plants convert sunlight into energy",
      "William Shakespeare",
      "Jupiter",
      "206 bones",
      "Au",
      "1945",
      "299,792,458 meters per second",
      "Alexander Graham Bell",
      "Atom",
      "7 continents",
      "100°C or 212°F",
      "Leonardo da Vinci",
      "Pacific Ocean",
      "4 chambers",
      "Yen",
      "Albert Einstein",
      "Diamond",
      "60 seconds"
    ];

    const sampleBotAnswers = [
      "The capital of France is Paris.",
      "Area = π × radius²",
      `# What Is Photosynthesis?

Photosynthesis is a fundamental biological process that sustains life on Earth. It is the method by which green plants, algae, and certain bacteria convert light energy—usually from the sun—into chemical energy stored in glucose, a type of sugar. This process not only provides energy for the organisms that perform it but also produces oxygen, which is essential for the survival of most living beings.

## The Basics of Photosynthesis

Photosynthesis primarily occurs in the chloroplasts of plant cells, which contain a green pigment called chlorophyll. Chlorophyll absorbs sunlight and uses its energy to drive the chemical reactions that transform carbon dioxide (CO₂) from the air and water (H₂O) from the soil into glucose (C₆H₁₂O₆). The overall chemical equation for photosynthesis can be summarized as:

6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂

This means that six molecules of carbon dioxide and six molecules of water, in the presence of sunlight, are transformed into one molecule of glucose (a type of sugar) and six molecules of oxygen.

Photosynthesis consists of two main stages:

1. **Light-dependent reactions**  
   - Sunlight is absorbed by chlorophyll.
   - Water molecules are split into oxygen, protons, and electrons.
   - Oxygen is released into the atmosphere.
   - Energy-rich molecules ATP and NADPH are produced.

2. **Light-independent reactions (Calvin Cycle)**  
   - ATP and NADPH are used to fix carbon dioxide.
   - Glucose is synthesized from carbon dioxide.

This process is vital for several reasons:

- It provides the oxygen necessary for aerobic respiration in animals and humans.
- It forms the basis of the food web, as plants produce the organic compounds that herbivores and omnivores consume.
- It helps regulate atmospheric carbon dioxide levels, playing a role in climate stability.

In summary, photosynthesis is nature’s way of harnessing solar energy to sustain life. It is a beautifully efficient system that not only fuels plant growth but also supports ecosystems and maintains the balance of gases in our atmosphere.
`,
      "Shakespeare wrote Romeo and Juliet.",
      "**Jupiter** is the largest planet.",
      "Adults have 206 bones in their body.",
      "Gold's chemical symbol is Au.",
      "World War II ended in 1945.",
      "Light travels at approximately 300,000 km/s.",
      "Alexander Graham Bell invented the telephone.",
      "The atom is the smallest unit of matter.",
      "There are 7 continents on Earth.",
      "Water boils at 100 degrees Celsius.",
      "Leonardo da Vinci painted the Mona Lisa.",
      "The Pacific is the largest ocean.",
      "The human heart has 4 chambers.",
      "Japan uses the Yen currency.",
      "Einstein developed relativity theory.",
      "Diamond is the hardest natural substance.",
      "There are 60 seconds in one minute."
    ];    const sampleData = [];
    for (let i = 0; i < 20; i++) {
      const score = Math.floor(Math.random() * 5) + 1; // Random score 1-5
      sampleData.push({
        id: i,
        ID: `Q${String(i + 1).padStart(3, '0')}`,
        Question: sampleQuestions[i],
        'Truth Answer': sampleTruthAnswers[i],
        'Bot Answer': sampleBotAnswers[i],
        Score: score,
        // Map to standard column names for DetailView
        question: sampleQuestions[i],
        golden: sampleTruthAnswers[i],
        bot: sampleBotAnswers[i]
      });
    }

    const sampleHeaders = ['ID', 'Question', 'Truth Answer', 'Bot Answer', 'Score'];
    const sampleMapping = {
      question: 'Question',
      golden: 'Truth Answer',
      bot: 'Bot Answer'
    };

    // Import the sample data
    onDataImport(sampleData, sampleHeaders, sampleMapping, false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      if (jsonData.length > skipRows) {
        const headerRow = jsonData[skipRows];
        setFileHeaders(headerRow.filter(h => h && h.trim()));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleShow = () => {
    const file = fileInputRef.current.files[0];
    if (!file || !localColumnMapping.question || !localColumnMapping.golden || !localColumnMapping.bot) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      // Skip header rows and get data
      const dataRows = jsonData.slice(skipRows + 1);
      const headerRow = jsonData[skipRows];
      
      // Find column indices
      const questionIndex = headerRow.indexOf(localColumnMapping.question);
      const goldenIndex = headerRow.indexOf(localColumnMapping.golden);
      const botIndex = headerRow.indexOf(localColumnMapping.bot);      // Transform data to our format - include ALL columns from Excel
      const transformedData = dataRows.map((row, index) => {
        const rowData = { id: index };
        
        // Add all columns from the Excel file
        headerRow.forEach((header, headerIndex) => {
          if (header && header.trim()) {
            rowData[header] = row[headerIndex] || '';
          }
        });
        
        // Map the specific columns to our standard names for DetailView (only if they don't already exist)
        if (!rowData.question) {
          rowData.question = row[questionIndex] || '';
        }
        if (!rowData.golden) {
          rowData.golden = row[goldenIndex] || '';
        }
        if (!rowData.bot) {
          rowData.bot = row[botIndex] || '';
        }
        
        // Add remark column if enabled and doesn't exist
        if (addRemarkColumn && !rowData.remark) {
          rowData.remark = '';
        }
        
        return rowData;
      });

      // Headers should include ALL Excel columns plus remark if enabled (avoid duplicates)
      const allHeaders = headerRow.filter(h => h && h.trim());
      const uniqueHeaders = [...new Set(allHeaders)]; // Remove duplicates
      const transformedHeaders = addRemarkColumn && !uniqueHeaders.includes('remark') ? 
        [...uniqueHeaders, 'remark'] : 
        uniqueHeaders;
      
      onDataImport(transformedData, transformedHeaders, localColumnMapping, addRemarkColumn);
    };
    reader.readAsArrayBuffer(file);
  };  const handleExportClick = () => {
    if (data.length === 0) return;

    // Determine which columns to export based on mode
    let exportHeaders;
    if (exportMode === 'all') {
      // Export all columns including Remark if it exists
      exportHeaders = headers.filter(h => h !== 'id'); // Exclude 'id' as it's internal
    } else {
      // Export only visible columns plus Remark if it exists
      exportHeaders = headers.filter(h => h !== 'id' && (visibleColumns[h] || h === 'remark'));
    }
    
    // Create worksheet data
    const wsData = [
      exportHeaders, // Column headers
      ...data.map(row => {
        return exportHeaders.map(header => row[header] || '');
      })
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Auto-size columns
    const colWidths = [];
    wsData.forEach(row => {
      row.forEach((cell, i) => {
        const cellLength = cell ? cell.toString().length : 0;
        colWidths[i] = Math.max(colWidths[i] || 0, cellLength, 10);
      });
    });
    ws['!cols'] = colWidths.map(w => ({ width: Math.min(w + 2, 50) }));

    XLSX.utils.book_append_sheet(wb, ws, 'Evaluation Data');
    
    // Export file with user-specified filename
    const filename = exportFilename.endsWith('.xlsx') ? exportFilename : `${exportFilename}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const isShowButtonEnabled = () => {
    return fileHeaders.length > 0 && 
           localColumnMapping.question && 
           localColumnMapping.golden && 
           localColumnMapping.bot;
  };

  const ToggleIcon = () => (
    <svg className="icon" viewBox="0 0 24 24">
      <path d={isCollapsed ? 
        "M9 18l6-6-6-6v12z" : 
        "M15 18l-6-6 6-6v12z"
      } />
    </svg>
  );

  const ImportIcon = () => (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
    </svg>
  );

  const ExportIcon = () => (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      <path d="M12,11L8,15H10.5V19H13.5V15H16L12,11Z" />
    </svg>
  );  const ColumnSelectIcon = () => (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M3,3V21H21V3H3M5,5H9V19H5V5M11,5H19V10H11V5M11,12H19V19H11V12Z" />
    </svg>
  );

  const truncateColumnName = (name, maxLength = 50) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };
  const handleIconClick = (tabName) => {
    if (isCollapsed) {
      // If collapsed, expand and set the tab
      onToggleCollapse();
      onTabChange(tabName);
    } else {
      // If expanded and clicking the same tab, collapse the panel
      if (activeTab === tabName) {
        onToggleCollapse(); // Collapse the panel
        onTabChange(''); // Clear the active tab
      } else {
        // If expanded and clicking a different tab, just switch tabs
        onTabChange(tabName);
      }
    }
  };

  return (
    <div className={`tool-pane ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="tool-icons-container">
        <div className="tool-icon" onClick={onToggleCollapse}>
          <ToggleIcon />
        </div>
        
        <div 
          className={`tool-icon ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => handleIconClick('import')}
        >
          <ImportIcon />
        </div>
        
        <div 
          className={`tool-icon ${activeTab === 'columns' ? 'active' : ''}`}
          onClick={() => handleIconClick('columns')}
        >
          <ColumnSelectIcon />
        </div>
        
        <div 
          className={`tool-icon ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => handleIconClick('export')}
        >
          <ExportIcon />
        </div>
      </div>

      <div className={`tool-content ${isCollapsed ? 'hidden' : ''}`}>        {activeTab === 'import' && (
          <div className="import-section">
            <h3>Import Excel File</h3>
            
            {/* Sample Data Button */}
            <button
              onClick={generateSampleData}
              className="show-button"
              style={{ 
                backgroundColor: '#3498db',
                marginBottom: '15px'
              }}
            >
              Start with Sample Data
            </button>
            
            {/* OR Divider */}
            <div style={{ 
              textAlign: 'center', 
              margin: '15px 0', 
              color: '#bdc3c7',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              OR
            </div>
            
            <div className="file-input-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="file-input"
              />
            </div><div>
              <label>Skip header rows:</label>
              <input
                type="number"
                min="0"
                value={skipRows}
                onChange={(e) => setSkipRows(parseInt(e.target.value) || 0)}
                className="skip-rows-input"
              />
            </div>

            {fileHeaders.length > 0 && (
              <div className="column-mapping">
                <h4 style={{ color: '#ecf0f1', marginBottom: '15px' }}>Map Columns:</h4>
                  <div className="mapping-row">
                  <div className="mapping-label">Question:</div>
                  <select
                    value={localColumnMapping.question}
                    onChange={(e) => setLocalColumnMapping(prev => ({ ...prev, question: e.target.value }))}
                    className="mapping-select"
                    title={localColumnMapping.question || "Select a column for questions"}
                  >
                    <option value="">Select column...</option>
                    {fileHeaders.map((header, index) => (
                      <option key={index} value={header} title={header}>
                        {truncateColumnName(header)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <div className="mapping-label">Golden:</div>
                  <select
                    value={localColumnMapping.golden}
                    onChange={(e) => setLocalColumnMapping(prev => ({ ...prev, golden: e.target.value }))}
                    className="mapping-select"
                    title={localColumnMapping.golden || "Select a column for golden answers"}
                  >
                    <option value="">Select column...</option>
                    {fileHeaders.map((header, index) => (
                      <option key={index} value={header} title={header}>
                        {truncateColumnName(header)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <div className="mapping-label">Bot:</div>
                  <select
                    value={localColumnMapping.bot}
                    onChange={(e) => setLocalColumnMapping(prev => ({ ...prev, bot: e.target.value }))}
                    className="mapping-select"
                    title={localColumnMapping.bot || "Select a column for bot answers"}
                  >
                    <option value="">Select column...</option>
                    {fileHeaders.map((header, index) => (
                      <option key={index} value={header} title={header}>
                        {truncateColumnName(header)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleShow}
                  disabled={!isShowButtonEnabled()}
                  className="show-button"
                >
                  Show Data
                </button>
              </div>
            )}
          </div>
        )}        {activeTab === 'export' && (
          <div className="import-section">
            <h3>Export Data</h3>
            <p style={{ color: '#bdc3c7', marginBottom: '20px' }}>
              Export the current table data (including any edits) to an Excel file.
            </p>
            
            <div className="export-options">
              <div className="form-group">
                <label style={{ color: '#ecf0f1', marginBottom: '8px', display: 'block' }}>
                  Export Options:
                </label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      value="all"
                      checked={exportMode === 'all'}
                      onChange={(e) => setExportMode(e.target.value)}
                    />
                    <span>All columns (including Remark if present)</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      value="selected"
                      checked={exportMode === 'selected'}
                      onChange={(e) => setExportMode(e.target.value)}
                    />
                    <span>Only selected columns (plus Remark if present)</span>
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="exportFilename" style={{ color: '#ecf0f1', marginBottom: '8px', display: 'block' }}>
                  File Name:
                </label>
                <input
                  id="exportFilename"
                  type="text"
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  className="filename-input"
                  placeholder="Enter filename (without .xlsx)"
                />
                <small style={{ color: '#95a5a6', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  .xlsx extension will be added automatically if not included
                </small>
              </div>
            </div>
            
            <button
              onClick={handleExportClick}
              disabled={data.length === 0}
              className="export-button"
            >
              Export to Excel
            </button>
          </div>
        )}{activeTab === 'columns' && (
          <div className="import-section">
            <h3>Column Visibility</h3>
            <p style={{ color: '#bdc3c7', marginBottom: '20px' }}>
              Select which columns to display in the table view. All Excel columns are available.
            </p>
              {/* Rows to Show Control */}
            <div className="row-height-control" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#2c3e50', borderRadius: '4px', border: '1px solid #34495e' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#ecf0f1', fontSize: '14px' }}>Viewport Row Count</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <label style={{ color: '#bdc3c7', fontSize: '13px', minWidth: '100px' }}>Rows to show:</label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="1"
                  value={rowsToShow}
                  onChange={(e) => onRowsToShowChange(parseInt(e.target.value))}
                  style={{
                    width: '80px',
                    padding: '5px',
                    border: '1px solid #555',
                    borderRadius: '3px',
                    backgroundColor: '#34495e',
                    color: 'white',
                    fontSize: '13px'
                  }}
                />
                <span style={{ color: '#95a5a6', fontSize: '12px' }}>rows</span>
              </div>              <p style={{ color: '#95a5a6', fontSize: '11px', margin: '0', lineHeight: '1.3' }}>
                Sets how many rows to display in the viewport. Cell height will automatically adjust to fit exactly this many rows.
              </p>
            </div>            {/* Add Remark Column Control */}
            <div className="checkbox-wrapper" style={{ marginBottom: '20px' }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={addRemarkColumn}
                  onChange={(e) => onAddRemarkColumnChange && onAddRemarkColumnChange(e.target.checked)}
                  className="checkbox-input"
                />
                Add empty "Remark" column for notes
              </label>
            </div>
            
            {headers.length > 0 ? (
              <div className="column-selection">                {headers.map((column) => {
                  const isMappedColumn = 
                    column === columnMapping.question || 
                    column === columnMapping.golden || 
                    column === columnMapping.bot ||
                    column === 'question' ||
                    column === 'golden' ||
                    column === 'bot' ||
                    column === 'remark';
                  
                  return (
                    <div key={column} className={`column-checkbox ${isMappedColumn ? 'mapped' : ''}`}>
                      <label>
                        <input
                          type="checkbox"
                          checked={visibleColumns[column] !== false}
                          onChange={(e) => {
                            onVisibleColumnsChange({
                              ...visibleColumns,
                              [column]: e.target.checked
                            });
                          }}
                        />
                        <span className="column-name">
                          {column}
                          {isMappedColumn && <span className="mapped-indicator"> (mapped)</span>}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#95a5a6', fontStyle: 'italic' }}>
                No data loaded. Import data first to see available columns.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolPane;
