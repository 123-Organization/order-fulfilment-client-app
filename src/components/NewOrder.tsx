import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "antd";
import { FullscreenOutlined, CompressOutlined } from "@ant-design/icons";
import { useAppDispatch } from "../store";
import { CreateOrder } from "../store/features/orderSlice";
import { useNotificationContext } from "../context/NotificationContext";

export default function NewOrder({ iframe, setIframe, recipient }) {
  const [addedProducts, setAddedProducts] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const iframeContainerRef = useRef(null);
  const dispatch = useAppDispatch();
  const notificationApi = useNotificationContext();

  // Function to toggle full-screen mode
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      iframeContainerRef.current?.requestFullscreen?.();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullScreen(false);
    }
  };

  // Automatically enter full-screen if screen width < 1800px when modal opens
  useEffect(() => {
    if (iframe) {
      if (window.innerWidth < 1800 && !isFullScreen) {
        toggleFullScreen();
      }
    }
  }, [iframe]);

  return (
    <div>
      <Modal
        title="File Management"
        open={iframe === true}
        onCancel={() => setIframe(false)}
        width="80%"
        footer={null}
      >
        <div
          ref={iframeContainerRef}
          style={{
            position: "relative",
            width: "100%",
            height: isFullScreen ? "100vh" : "550px",
          }}
        >
          <iframe
            src="https://finerworks.com/apps/orderform/post3.aspx"
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="File Management"
            sandbox="allow-scripts allow-forms allow-same-origin"
          />
          <Button
            type="default"
            style={{
              position: "absolute",
              border: "none",
              top: isFullScreen ? 10 : -39,
              right: isFullScreen ? 100 : 20,
              zIndex: 1000,
            }}
            icon={isFullScreen ? <CompressOutlined /> : <FullscreenOutlined className="text-gray-800" />}
            onClick={toggleFullScreen}
          />
        </div>
      </Modal>
    </div>
  );
}
