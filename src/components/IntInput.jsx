import PropTypes from 'prop-types';
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
      type='number'
      min={min}
      max={max}
      value={value}
      onChange={handleChange}
      className='int-input'
      inputMode='numeric'
      pattern='[0-9]*'
    />
  );
};

IntInput.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
};

export default IntInput;