import React, { useState } from 'react';
import '../styles/index.css';
import Button from './Button';
import IntInput from './IntInput';

const Menu = () => {
  const [leafValue, setLeafValue] = useState(2);
  const [stemValue, setStemValue] = useState(2);
  const [branchValue, setBranchValue] = useState(2);
  const [trunkValue, setTrunkValue] = useState(2);

  // Render menu
  return (
    <div className="menu">
      <Button eventType="loadFile" className="button" title="L">Load</Button>
      <Button eventType="saveFile" className="button" title="S">Save</Button>
      <Button eventType="undo" className="button" title="[">Undo</Button>
      <Button eventType="redo" className="button" title="]">Redo</Button>
      <Button eventType="selectAll" className="button button-wide" title="A">Select All</Button>
      <Button eventType="deselectAll" className="button button-wide" title="Esc">Deselect All</Button>
      <Button eventType="copy" className="button" title="C">Copy</Button>
      <Button eventType="delete" className="button" title="Del">Delete</Button>
      <Button eventType="move" className="button" title="M">Move</Button>
      <Button eventType="reflect" className="button" title="R">Reflect</Button>
      <Button eventType="connections" className="button button-wide" title="N">Connections</Button>
      <Button eventType="transparency" className="button button-wide" title="T">Transparency</Button>
      <IntInput label="Leaf" value={leafValue} onChange={setLeafValue} min={2} max={120} />
      <IntInput label="Stem" value={stemValue} onChange={setStemValue} min={2} max={120} />
      <IntInput label="Branch" value={branchValue} onChange={setBranchValue} min={2} max={120} />
      <IntInput label="Trunk" value={trunkValue} onChange={setTrunkValue} min={2} max={120} />
    </div>
  );
};

export default Menu;