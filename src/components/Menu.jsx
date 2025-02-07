import React from 'react';
import '../styles/index.css';

const Menu = () => {
    const handleLoadFile = () => {
      const event = new Event('loadFile');
      window.dispatchEvent(event);
    };
  
    return (
      <div>
        <button onClick={handleLoadFile} className="button">Load</button>
      </div>
    );
  };

export default Menu;