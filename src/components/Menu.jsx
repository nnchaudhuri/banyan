import React from 'react';
import '../styles/index.css';

const Menu = () => {
  // Generic event handler
  const handleEvent = (eventType) => {
    const event = new Event(eventType);
    window.dispatchEvent(event);
  };

  // Render menu
  return (
    <div>
      <div>
        <button onClick={() => handleEvent('loadFile')} className='button' 
          title='L'>Load</button>
        <button onClick={() => handleEvent('saveFile')} className='button' 
          title='S'>Save</button>
      </div>
      <div>
        <button onClick={() => handleEvent('undo')} className='button' 
          title='['>Undo</button>
        <button onClick={() => handleEvent('redo')} className='button' 
          title=']'>Redo</button>
      </div>
      <div>
        <button onClick={() => handleEvent('selectAll')} className='button wide' 
          title='A'>Select All</button>
      </div>
      <div>
        <button onClick={() => handleEvent('deselectAll')} className='button wide' 
          title='Esc'>Deselect All</button>
      </div>
      <div>
        <button onClick={() => handleEvent('copy')} className='button' 
          title='C'>Copy</button>
        <button onClick={() => handleEvent('delete')} className='button' 
          title='Del'>Delete</button>
      </div>
      <div>
        <button onClick={() => handleEvent('move')} className='button' 
          title='M'>Move</button>
        <button onClick={() => handleEvent('reflect')} className='button' 
          title='R'>Reflect</button>
      </div>
      <div>
        <button onClick={() => handleEvent('connections')} className='button wide' 
          title='N'>Connections</button>
      </div>
      <div>
        <button onClick={() => handleEvent('transparency')} className='button wide' 
          title='T'>Transparency</button>
      </div>
    </div>
  );
};

export default Menu;