import '../styles/index.css';
import { Button, Text, Blank, IntInputsButton } from '../components';

const Menu = () => {
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
      <IntInputsButton eventType="addTrunk" title="Trunk" min={2} max={120} initialValues={[24]} />
      <IntInputsButton eventType="addBranch" title="Branch" min={2} max={120} initialValues={[12]} />
      <IntInputsButton eventType="addStem" title="Stem" min={2} max={120} initialValues={[6]} />
      <IntInputsButton eventType="addLeaf" title="Leaf" min={2} max={120} initialValues={[4, 4]} />
    </div>
  );
};

export default Menu;