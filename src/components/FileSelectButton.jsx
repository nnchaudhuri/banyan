import { useState } from 'react';
import PropTypes from 'prop-types';
import 'styles/index.css';

export const FileSelectButton = ({ eventType, title, files, path = ''}) => {
  const [selectedFile, setSelectedFile] = useState(files[0]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.value);
  };

  const handleClick = () => {
    fetch(path + '/' + selectedFile)
      .then((response) => response.text())
      .then((text) => {
        const customEvent = new CustomEvent(eventType, {
          detail: { file: selectedFile, text: text }
        });
        window.dispatchEvent(customEvent);
      })
      .catch((error) => {
        console.error('Error reading file text:', error);
      });
  };

  return (
    <div className='file-select-button'>
      <button onClick={handleClick} className='button button-wide'>
        {title}
      </button>
      <select className='file-dropdown' value={selectedFile} onChange={handleFileChange}>
        {files.map((file, index) => (
          <option key={index} value={file}>
            {file}
          </option>
        ))}
      </select>
    </div>
  );
};

FileSelectButton.propTypes = {
  eventType: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  files: PropTypes.arrayOf(PropTypes.string).isRequired,
  path: PropTypes.string,
};