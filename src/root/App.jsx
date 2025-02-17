import { Scene } from 'features/Scene.jsx';
import { Menu } from 'features/Menu.jsx';
import 'styles/index.css';

export const App = () => {
  return (
    <div className='scene'>
      <Scene />
      <div className='menu'>
        <Menu />
      </div>
    </div>
  );
};