import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { FullscreenOutlined, CompressOutlined } from '@ant-design/icons';

export default function FileManagementIframe({ iframe, setIframe }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const iframeContainerRef = useRef(null);

  // Handle full-screen change event
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Toggle full-screen mode
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      iframeContainerRef.current?.requestFullscreen?.();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullScreen(false);
    }
  };

  return (
    <div>
      <Modal
        title="File Management"
        visible={iframe === true}
        onOk={() => setIframe(false)}
        onCancel={() => setIframe(false)}
        width="80%"
        footer={null}
      >
        <div
          ref={iframeContainerRef}
          style={{
            position: 'relative',
            width: '100%',
            height: isFullScreen ? '100vh' : '550px',
          }}
        >
          <iframe
            src="https://dev1-filemanger-app.finerworks.com/#/thumbnail"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="File Management"
          />
          <Button
            type="primary"
            style={{
              position: 'absolute',
              top: !isFullScreen? -40 : 25,
              right:  !isFullScreen? 20 : 200,
              zIndex: 1000,
            }}
            icon={isFullScreen ? <CompressOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullScreen}
          >
            {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}