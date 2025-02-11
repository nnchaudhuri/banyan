import PropTypes from 'prop-types';
import '../styles/index.css';

const Blank = ({ count }) => {
  const blanks = Array.from({ length: count }, (_, index) => (
    <div key={index} className="blank"></div>
  ));

  return <>{blanks}</>;
};

Blank.propTypes = {
  count: PropTypes.number,
};

Blank.defaultProps = {
  count: 1,
};

export default Blank;