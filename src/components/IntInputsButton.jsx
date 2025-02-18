import React, { useState } from 'react';
import PropTypes from 'prop-types';
import 'styles/index.css';
import { IntInput } from 'components/IntInput';
import { Text } from 'components/Text';

export const IntInputsButton = ({ eventType, title, labels, initialValues, min, max }) => {
  const [values, setValues] = useState(initialValues);

  const handleChange = (index, newValue) => {
    if (newValue >= min[index] && newValue <= max[index]) {
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
    <div className='int-inputs-button'>
      <button onClick={handleClick} className='button button-wide'>
        {title}
      </button>
      {values.map((value, index) => (
        <React.Fragment key={index}>
          <Text className='grid-label'>
            {labels[index]}
          </Text>
          <IntInput
            className='grid-input'
            value={value}
            onChange={(newValue) => handleChange(index, newValue)}
            min={min[index]}
            max={max[index]}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

IntInputsButton.propTypes = {
  eventType: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  initialValues: PropTypes.arrayOf(PropTypes.number).isRequired,
  min: PropTypes.arrayOf(PropTypes.number).isRequired,
  max: PropTypes.arrayOf(PropTypes.number).isRequired,
};