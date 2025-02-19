import 'styles/index.css';
import { Button, Blank, IntInputsButton, FileSelectButton, ScaledToWindowHeight } from 'components';

export const Menu = () => {
  return (
    <ScaledToWindowHeight padding={80} className="menu">
      <Button eventType='loadFile' title='L'>Load</Button>
      <Button eventType='saveFile' title='S'>Save</Button>
      <FileSelectButton
        eventType='loadExample'
        title='Load Example'
        files={['chair.txt', 'table.txt']}
        path='examples'
      />
      <Blank count={2} />
      <Button eventType='undo' title='['>Undo</Button>
      <Button eventType='redo' title=']'>Redo</Button>
      <Button eventType='selectAll' className='button-wide' title='A'>Select All</Button>
      <Button eventType='deselectAll' className='button-wide' title='Esc'>Deselect All</Button>
      <Button eventType='copy' title='C'>Copy</Button>
      <Button eventType='delete' title='Del'>Delete</Button>
      <Button eventType='move' title='M'>Move</Button>
      <Button eventType='reflect' title='R'>Reflect</Button>
      <Button eventType='connections' className='button-wide' title='N'>Connections</Button>
      <Button eventType='transparency' className='button-wide' title='T'>Transparency</Button>
      <Blank count={2} />
      <IntInputsButton
        eventType='addTrunk'
        title='Add Trunk'
        labels={['Length']}
        initialValues={[24]}
        min={[0]}
        max={[120]}
      />
      <Blank count={2} />
      <IntInputsButton
        eventType='addBranch'
        title='Add Branch'
        labels={['Length']}
        initialValues={[12]}
        min={[0]}
        max={[120]}
      />
      <Blank count={2} />
      <IntInputsButton
        eventType='addStem'
        title='Add Stem'
        labels={['Angle', 'Length']}
        initialValues={[0, 4]}
        min={[0, 1]}
        max={[90, 48]}
      />
      <Blank count={2} />
      <IntInputsButton
        eventType='addLeaf'
        title='Add Leaf'
        labels={['Length X', 'Length Y']}
        initialValues={[4, 4]}
        min={[1, 1]}
        max={[48, 48]}
      />
    </ScaledToWindowHeight>
  );
};
