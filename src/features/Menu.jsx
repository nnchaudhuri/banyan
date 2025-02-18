import { useEffect, useRef } from 'react';
import 'styles/index.css';
import { Button, Blank, IntInputsButton, FileSelectButton } from 'components';

export const Menu = () => {
  const menuRef = useRef(null);

  useEffect(() => {
    const scaleMenu = () => {
      if (menuRef.current) {
        const availableHeight = window.innerHeight - 80; // Update per desired padding
        const menuHeight = menuRef.current.scrollHeight;
        const scale = Math.min(1, availableHeight / menuHeight);
        menuRef.current.style.transform = `scale(${scale})`;
        menuRef.current.style.transformOrigin = 'top left';
      }
    };

    scaleMenu();
    window.addEventListener('resize', scaleMenu);
    return () => window.removeEventListener('resize', scaleMenu);
  }, []);

  return (
    <div className='menu' ref={menuRef}>
      <Button eventType='loadFile' title='L'>Load</Button>
      <Button eventType='saveFile' title='S'>Save</Button>
      <FileSelectButton eventType='loadExample' title='Load Example'
        files={['myTree.txt', 'myTree2.txt']} />
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
      <IntInputsButton eventType='addTrunk' title='Add Trunk' 
        labels={['Length']} initialValues={[24]} min={[2]} max={[120]} />
      <Blank count={2} />
      <IntInputsButton eventType='addBranch' title='Add Branch' 
        labels={['Length']} initialValues={[12]} min={[2]} max={[120]} />
      <Blank count={2} />
      <IntInputsButton eventType='addStem' title='Add Stem' 
        labels={['Angle','Length']} initialValues={[0, 4]} min={[0, 2]} max={[90, 48]} />
      <Blank count={2} />
      <IntInputsButton eventType='addLeaf' title='Add Leaf'
        labels={['Length X', 'Length Y']} initialValues={[4, 4]} min={[2, 2]} max={[48, 48]} />
    </div>
  );
};
