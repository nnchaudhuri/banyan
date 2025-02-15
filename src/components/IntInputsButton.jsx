import { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/index.css';
import IntInput from './IntInput';

const IntInputsButton = ({ eventType, title, min, max, initialValues }) => {
  const [values, setValues] = useState(initialValues);

  const handleChange = (index, newValue) => {
    if (newValue >= min && newValue <= max) {
      const newValues = [...values];
      newValues[index] = newValue;
      setValues(newValues);
    }
  };

  const handleClick = () => {
    const event = new CustomEvent(eventType, { detail: { values } });
    window.dispatchEvent(event);
  };

  return (
    <div className="int-inputs-button">
      <button onClick={handleClick} className="button">{title}</button>
      {values.map((value, index) => (
        <IntInput
          key={index}
          value={value}
          onChange={(newValue) => handleChange(index, newValue)}
          min={min}
          max={max}
        />
      ))}
    </div>
  );
};

IntInputsButton.propTypes = {
  eventType: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  initialValues: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default IntInputsButton;