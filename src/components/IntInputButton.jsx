import { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/index.css';
import IntInput from './IntInput';
import Button from './Button';

const IntInputButton = ({ eventType, title, min, max, initialValue }) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = (newValue) => {
    if (newValue >= min && newValue <= max) {
      setValue(newValue);
    }
  };

  const handleClick = () => {
    const event = new CustomEvent(eventType, { detail: { value } });
    window.dispatchEvent(event);
  };

  return (
    <div className="int-input-button">
      <Button onClick={handleClick}>{title}</Button>
      <IntInput value={value} onChange={handleChange} min={min} max={max} />
    </div>
  );
};

IntInputButton.propTypes = {
  eventType: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  initialValue: PropTypes.number.isRequired,
};

export default IntInputButton;