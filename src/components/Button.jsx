import PropTypes from 'prop-types';
import 'styles/index.css';

const Button = ({ eventType = '', className = '', title = '', children }) => {
  const handleEvent = () => {
    const event = new Event(eventType);
    window.dispatchEvent(event);
  };

  return (
    <button onClick={handleEvent} className={`button ${className}`} title={title}>
      {children}
    </button>
  );
};

Button.propTypes = {
  eventType: PropTypes.string,
  className: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Button;