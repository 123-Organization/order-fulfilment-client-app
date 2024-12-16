import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "antd";
import { FullscreenOutlined, CompressOutlined } from "@ant-design/icons";

export default function NewOrder({ iframe, setIframe }) {
  const [addedProducts, setAddedProducts] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const iframeContainerRef = useRef(null);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      console.log("Message event:", event);

      // Check if the message is coming from the expected origin
      if (event.origin !== "https://finerworks.com") return;

      try {
        const data = JSON.parse(event.data);

        if (Array.isArray(data)) {
          setAddedProducts(data);
          setIframe(false);
        }
      } catch (error) {
        console.error("Error parsing message data:", error);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [setIframe]);

  // Handle full-screen change event
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
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
            position: "relative",
            width: "100%",
            height: isFullScreen ? "100vh" : "550px", // Adjust height dynamically
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
              top:  isFullScreen ?10 : -39,
              right:  isFullScreen? 100: 20,
              zIndex: 1000,
            }}
            icon={isFullScreen ? <CompressOutlined  /> : <FullscreenOutlined className="text-gray-800" />}
            onClick={toggleFullScreen}
          >
            
          </Button>
        </div>
      </Modal>
    </div>
  );
}
