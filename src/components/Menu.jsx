import React from 'react';

const Menu = () => {
    const handleLoadFile = () => {
      const event = new Event('loadFile');
      window.dispatchEvent(event);
    };
  
    return (
      <div style={{
        padding: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '8px'
      }}>
        <button onClick={handleLoadFile}>Load</button>
      </div>
    );
  };

export default Menu;