import React from 'react';
import style from '../pages/Pgaes.module.css';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message = 'Processing...' }) => {
  if (!isLoading) return null;
  
  return (
    <div className={style.loadingOverlay}>
      <div className={style.spinnerContainer}>
        <div className={style.spinner}></div>
        <div className={style.loadingText}>{message}</div>
      </div>
    </div>
  );
};

export default LoadingOverlay; 