import React from 'react';
import Scene from '../components/Scene.jsx';
import Menu from '../components/Menu.jsx';
import '../styles/index.css';

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
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '10px',
        borderRadius: '8px',
        zIndex: 1000 // Overlay
      }}>
        <Menu />
      </div>
    </div>
  );
};

export default App;
