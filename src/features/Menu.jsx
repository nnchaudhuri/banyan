import { useState } from 'react';
import '../styles/index.css';
import { Button, IntInput, Text, Blank, IntInputButton } from '../components';

const Menu = () => {
  // Initialize input states
  const [trunkValue, setTrunkValue] = useState(12);
  const [stemValue, setStemValue] = useState(6);
  const [leafXValue, setLeafXValue] = useState(4);
  const [leafYValue, setLeafYValue] = useState(4);

  // Render menu
  return (
    <div className="menu">
      <Button eventType="loadFile" title="L">Load</Button>
      <Button eventType="saveFile" title="S">Save</Button>
      <Button eventType="undo" title="[">Undo</Button>
      <Button eventType="redo" title="]">Redo</Button>
      <Button eventType="selectAll" className="button-wide" title="A">Select All</Button>
      <Button eventType="deselectAll" className="button-wide" title="Esc">Deselect All</Button>
      <Button eventType="copy" title="C">Copy</Button>
      <Button eventType="delete" title="Del">Delete</Button>
      <Button eventType="move" title="M">Move</Button>
      <Button eventType="reflect" title="R">Reflect</Button>
      <Button eventType="connections" className="button-wide" title="N">Connections</Button>
      <Button eventType="transparency" className="button-wide" title="T">Transparency</Button>

      <Blank count={2} />
      <Text>Add</Text>
      <Text>of Size</Text>
      <Button eventType="addTrunk">Trunk</Button>
      <IntInput value={trunkValue} onChange={setTrunkValue} min={2} max={120} />
      <IntInputButton eventType="addBranch" title="Branch" min={2} max={120} initialValue={12} />
      <Button eventType="addStem">Stem</Button>
      <IntInput value={stemValue} onChange={setStemValue} min={2} max={120} />
      <Button eventType="addLeaf">Leaf</Button>
      <IntInput value={leafXValue} onChange={setLeafXValue} min={2} max={120} />
      <Blank />
      <IntInput value={leafYValue} onChange={setLeafYValue} min={2} max={120} />
    </div>
  );
};

export default Menu;