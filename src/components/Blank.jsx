import PropTypes from 'prop-types';
import '../styles/index.css';

const Blank = ({ count = 1 }) => {
  const blanks = Array.from({ length: count }, (_, index) => (
    <div key={index} className='blank'></div>
  ));

  return <>{blanks}</>;
};

Blank.propTypes = {
  count: PropTypes.number,
};

export default Blank;