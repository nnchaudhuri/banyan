import React from 'react';
import '../styles/index.css';

const IntInput = ({ label, value, onChange, min, max }) => {
  const handleChange = (event) => {
    const newValue = parseInt(event.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <label className="int-input">
      {label}:
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className="input-number"
      />
    </label>
  );
};

export default IntInput;