import React, { ReactNode, useEffect } from "react";
import ReactDOM from "react-dom";

interface ModalProps {
  show: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ show, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!show) {
    return null;
  }

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/75"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
