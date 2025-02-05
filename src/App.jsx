import React from 'react';
import Scene from './Scene.jsx';
import Menu from './Menu.jsx';
import './index.css';

const App = () => {
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      <Scene />

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000 // Overlay
      }}>
        <Menu />
      </div>
    </div>
  );
};

export default App;
