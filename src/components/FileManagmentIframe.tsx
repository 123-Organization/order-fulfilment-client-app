import React, { useState, useRef, useEffect } from "react";
import { Modal, Button } from "antd";
import { FullscreenOutlined, CompressOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../store";
import { updateIframeState } from "../store/features/companySlice";

export default function FileManagementIframe({ iframe, setIframe }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const iframeContainerRef = useRef(null);
  const dispatch = useAppDispatch();
  const { iframeState } = useAppSelector((state) => state.company.iframeState);
  console.log("iframeState...", iframeState);
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
        visible={iframe === true || iframeState === true}
        onOk={() => setIframe(false)}
        onCancel={() => {
          setIframe(false);
          dispatch(updateIframeState({ iframeState: false }));
        }}
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
            src="https://dev1-filemanger-app.finerworks.com/#/thumbnail"
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="File Management"
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
            icon={
              isFullScreen ? (
                <CompressOutlined />
              ) : (
                <FullscreenOutlined className="text-gray-600" />
              )
            }
            onClick={toggleFullScreen}
          ></Button>
        </div>
      </Modal>
    </div>
  );
}
