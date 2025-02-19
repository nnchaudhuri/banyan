import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export const ScaledToWindowHeight = ({ children, padding, className = '' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const scaleContainer = () => {
      if (containerRef.current) {
        const availableHeight = window.innerHeight - padding;
        const contentHeight = containerRef.current.scrollHeight;
        const scale = Math.min(1, availableHeight / contentHeight);
        containerRef.current.style.transform = `scale(${scale})`;
        containerRef.current.style.transformOrigin = 'top left';
      }
    };
    scaleContainer();
    window.addEventListener('resize', scaleContainer);
    return () => window.removeEventListener('resize', scaleContainer);
  }, [padding]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

ScaledToWindowHeight.propTypes = {
  children: PropTypes.node.isRequired,
  padding: PropTypes.number.isRequired,
  className: PropTypes.string,
};