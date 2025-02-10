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

  // Detect if the user is on iOS
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Function to enable "fullscreen"
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (!isIOS) {
        // On desktop/Android, use native fullscreen API
        iframeContainerRef.current?.requestFullscreen?.();
      }
      setIsFullScreen(true);
    } else {
      if (!isIOS) {
        document.exitFullscreen?.();
      }
      setIsFullScreen(false);
    }
  };

  // Automatically enter "fullscreen" if screen width < 1800px when modal opens
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
        width={isFullScreen ? "100%" : "80%"}
        style={{
          top: isFullScreen ? 0 : 50, // Move modal to top if fullscreen
          left: 0,
          height: isFullScreen ? "100vh" : "auto",
          maxWidth: "100vw",
        }}
        footer={null}
        bodyStyle={{
          padding: 0,
          height: isFullScreen ? "100vh" : "550px",
          overflow: "hidden",
        }}
      >
        <div
          ref={iframeContainerRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          <iframe
            src="https://finerworks.com/apps/orderform/post3.aspx"
            width="100%"
            height="100%"
            style={{
              border: "none",
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
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
