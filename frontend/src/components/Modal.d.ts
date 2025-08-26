import React from 'react';

export interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

export declare const Modal: React.FC<ModalProps>;
