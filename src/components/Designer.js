import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';

const Designer = () => {
  return (
    <div className="canvas-container">
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Box args={[1, 1, 1]} position={[0, 0, 0]}>
          <meshStandardMaterial attach="material" color="green" />
        </Box>
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default Designer;