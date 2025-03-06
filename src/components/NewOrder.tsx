import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "antd";
import { FullscreenOutlined, CompressOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../store";
import { CreateOrder } from "../store/features/orderSlice";
import { useNotificationContext } from "../context/NotificationContext";

export default function NewOrder({ iframe, setIframe, recipient }) {
  const [addedProducts, setAddedProducts] = useState([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1200);
  const iframeContainerRef = useRef(null);
  const dispatch = useAppDispatch();
  const notificationApi = useNotificationContext();

  console.log("ee", recipient);

  const toggleMaximize = () => {
    if (isSmallScreen) {
      // If on small screen, reset the size to a normal modal
      setIsSmallScreen(false);
      setIsMaximized(false); // Reset full-screen state
    } else {
      // Otherwise toggle the maximize state
      setIsMaximized(!isMaximized);
    }
  };
  console.log("nono", isMaximized, isSmallScreen);
  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      console.log("Message event:", event.data);

      // Check if the message is coming from the expected origin
      if (event.origin !== "https://finerworks.com") return;

      try {
        const data = JSON.parse(event.data);
        if (recipient) {
          if (Array.isArray(data)) {
            setAddedProducts(data);
            setIframe(false);
            const postData = {
              data,
              recipient,
            };
            dispatch(CreateOrder(postData));
            notificationApi.success({
              message: "New Order Created",
              description: "Order has been successfully Created",
            });
          }
        }
      } catch (error) {
        console.error("Error parsing message data:", error);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [setIframe, recipient]);
  const small = isMaximized && isSmallScreen;
  const large = isMaximized && !isSmallScreen;
  return (
    <div className="z-100">
      <Modal
        title="File Management"
        open={iframe === true}
        onCancel={() => setIframe(false)}
        width={isMaximized || isSmallScreen ? "100vw" : "80%"}
        style={{
          top: isMaximized || isSmallScreen ? 0 : 50,
          left: 0,
          height: isMaximized || isSmallScreen ? "100vh" : "auto",
          maxWidth: "100vw",
          background: isMaximized || isSmallScreen ? "transparent" : "initial", // Remove background when maximizing
        }}
        footer={null}
        bodyStyle={{
          padding: 0,
          height: isMaximized || isSmallScreen ? "100vh" : "550px",
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
              top: isMaximized ? -40 : -39,
              right: isMaximized ? 30 : 20,
              zIndex: 1000,
            }}
            icon={
              isMaximized || isSmallScreen ? (
                <CompressOutlined />
              ) : (
                <FullscreenOutlined className="text-gray-800 " />
              )
            }
            onClick={toggleMaximize}
          />
        </div>
      </Modal>
    </div>
  );
}
