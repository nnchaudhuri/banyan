import React from 'react';
import '../styles/index.css';

const Text = ({ children, className }) => {
  return (
    <div className={`text ${className}`}>
      {children}
    </div>
  );
};

export default Text;