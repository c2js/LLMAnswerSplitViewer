import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const DetailView = ({ rowData, columnMapping }) => {
  const [renderGoldenAsMarkdown, setRenderGoldenAsMarkdown] = useState(true);
  const [renderBotAsMarkdown, setRenderBotAsMarkdown] = useState(true);  const ToggleButton = ({ isMarkdown, onToggle }) => (
    <div className="toggle-wrapper">
      <span className="toggle-label">MD</span>
      <button
        onClick={onToggle}
        className={`toggle-button ${isMarkdown ? 'on' : 'off'}`}
        title={`${isMarkdown ? 'Disable' : 'Enable'} markdown rendering`}
      >
        <div className="toggle-slider"></div>
        <span className="toggle-status">{isMarkdown ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  );

  if (!rowData) {
    return (
      <div className="detail-panel">
        <div className="empty-state">
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
          </svg>
          <h3>Select a Row</h3>
          <p>Click on a table row to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-panel">
      <div className="detail-question">
        <h3>Question</h3>
        <div className="detail-question-text">
          {rowData.question || 'No question provided'}
        </div>
      </div>      
      <div className="detail-answers">        <div className="detail-answer golden">          <div className="answer-header">
            <div className="header-left">
              <h4>Golden Answer</h4>
            </div>
            <div className="header-right">
              <ToggleButton 
                isMarkdown={renderGoldenAsMarkdown} 
                onToggle={() => setRenderGoldenAsMarkdown(!renderGoldenAsMarkdown)}
              />
            </div>
          </div>          <div className="detail-answer-text">
            {renderGoldenAsMarkdown ? (
              <div className="react-markdown">
                {rowData.golden ? (
                  <ReactMarkdown>{rowData.golden}</ReactMarkdown>
                ) : (
                  <span className="no-answer-text">No golden answer provided</span>
                )}
              </div>
            ) : (
              <div className="plain-text">
                {rowData.golden || <span className="no-answer-text">No golden answer provided</span>}
              </div>
            )}
          </div>
        </div>

        <div className="detail-answer bot">          <div className="answer-header">
            <div className="header-left">
              <h4>Bot Answer</h4>
            </div>
            <div className="header-right">
              <ToggleButton 
                isMarkdown={renderBotAsMarkdown} 
                onToggle={() => setRenderBotAsMarkdown(!renderBotAsMarkdown)}
              />
            </div>
          </div>          <div className="detail-answer-text">
            {renderBotAsMarkdown ? (
              <div className="react-markdown">
                {rowData.bot ? (
                  <ReactMarkdown>{rowData.bot}</ReactMarkdown>
                ) : (
                  <span className="no-answer-text">No bot answer provided</span>
                )}
              </div>
            ) : (
              <div className="plain-text">
                {rowData.bot || <span className="no-answer-text">No bot answer provided</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailView;
