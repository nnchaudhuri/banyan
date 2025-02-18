import PropTypes from 'prop-types';
import 'styles/index.css';

export const Text = ({ className = '', children }) => {
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