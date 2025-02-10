import React, { useState } from 'react';
import '../styles/index.css';
import Button from './Button';
import IntInput from './IntInput';
import Text from './Text';
import Blank from './Blank';

const Menu = () => {
  // Initialize input states
  const [trunkValue, setTrunkValue] = useState();
  const [branchValue, setBranchValue] = useState();
  const [stemValue, setStemValue] = useState();
  const [leafXValue, setLeafXValue] = useState();
  const [leafYValue, setLeafYValue] = useState();

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

      <Blank count={2} />
      <Text className="text">Add</Text>
      <Text className="text">of Size</Text>
      <Button eventType="addTrunk" className="button">Trunk</Button>
      <IntInput value={trunkValue} onChange={setTrunkValue} min={2} max={120} />
      <Button eventType="addBranch" className="button">Branch</Button>
      <IntInput value={branchValue} onChange={setBranchValue} min={2} max={120} />
      <Button eventType="addStem" className="button">Stem</Button>
      <IntInput value={stemValue} onChange={setStemValue} min={2} max={120} />
      <Button eventType="addLeaf" className="button">Leaf</Button>
      <IntInput value={leafXValue} onChange={setLeafXValue} min={2} max={120} />
      <Blank count={1} />
      <IntInput value={leafYValue} onChange={setLeafYValue} min={2} max={120} />
    </div>
  );
};

export default Menu;