import React from 'react';
import '../styles/index.css';

const IntInput = ({ value, onChange, min, max }) => {
  const handleChange = (event) => {
    const newValue = parseInt(event.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={handleChange}
      className="int-input"
      inputMode="numeric"
      pattern="[0-9]*"
    />
  );
};

export default IntInput;