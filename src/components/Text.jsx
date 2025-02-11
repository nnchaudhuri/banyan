import PropTypes from 'prop-types';
import '../styles/index.css';

const Text = ({ className, children }) => {
  return (
    <div className={`text ${className}`}>
      {children}
    </div>
  );
};

Text.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Text.defaultProps = {
  className: '',
};

export default Text;