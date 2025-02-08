import React from 'react';
import '../styles/index.css';

const Button = ({ eventType, className, title, children }) => {
  const handleEvent = () => {
    const event = new Event(eventType);
    window.dispatchEvent(event);
  };

  return (
    <button onClick={handleEvent} className={`button ${className}`} title={title}>
      {children}
    </button>
  );
};

export default Button;