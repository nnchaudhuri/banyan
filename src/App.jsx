import React from 'react';
import Scene from './Scene';
import './index.css';

const App = () => {
  return (
    <div style={{ height: '100vh', width: '100vw',
      display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Scene />
    </div>
  );
};

export default App;
