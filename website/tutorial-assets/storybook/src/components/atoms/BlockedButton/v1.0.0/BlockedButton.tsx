import React from 'react';

interface BlockedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export const BlockedButton: React.FC<BlockedButtonProps> = ({ children, onClick }) => {
  return (
    <button onClick={onClick} className="px-4 py-2 bg-red-500 text-white rounded">
      {children}
    </button>
  );
};