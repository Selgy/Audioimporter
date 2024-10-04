import React, { useState } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  submitText: string;
  cancelText: string;
  inputPlaceholder?: string;
  showInput?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitText,
  cancelText,
  inputPlaceholder = '',
  showInput = true
}) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInput || inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title}</h2>
        <form onSubmit={handleSubmit}>
          {showInput && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="modal-input"
            />
          )}
          <div className="modal-buttons">
            <button type="submit" className="modal-button submit">{submitText}</button>
            <button type="button" onClick={onClose} className="modal-button cancel">{cancelText}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;