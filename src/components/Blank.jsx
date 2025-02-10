import React from 'react';
import '../styles/index.css';

const Blank = ({ count }) => {
  const blanks = Array.from({ length: count }, (_, index) => (
    <div key={index} className="blank"></div>
  ));

  return <>{blanks}</>;
};

export default Blank;