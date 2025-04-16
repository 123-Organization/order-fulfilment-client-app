import React, { useState, useRef, useEffect } from "react";
import { Modal, Button } from "antd";
import { FullscreenOutlined, CompressOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../store";
import { updateIframeState } from "../store/features/companySlice";
import  styles  from "./Components.module.css";   
import {
  setSelectedImage,
  setSendProduct,
} from "../store/features/productSlice";
import { AddProductToOrder, resetProductDataStatus } from "../store/features/orderSlice";
import { clearProductData } from "../store/features/productSlice";
import { clearSelectedImage } from "../store/features/productSlice";

export default function FileManagementIframe({ iframe, setIframe }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const iframeContainerRef = useRef(null);
  const dispatch = useAppDispatch();
  const SelectedImage = useAppSelector(
    (state) => state.ProductSlice.SelectedImage
  );
  console.log("SelectedImage", SelectedImage);
  const { iframeState } = useAppSelector((state) => state.company.iframeState);
  const productData = useAppSelector((state) => state.ProductSlice.productData);
  const ordersStatus = useAppSelector((state) => state.order.status);
  const productDataStatus = useAppSelector(
    (state) => state.order.productDataStatus
  );
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
  console.log("dada", productData);

  const handleAddProduct = () => {
    console.log("dada", productData);
  
      // Process images one by one with sequential delays
      const data = {
        ...productData,
        product_url_file: productData?.product_url_file,
        product_url_thumbnail: productData?.product_url_file,
      };
      dispatch(AddProductToOrder(data));
    
  };
  useEffect(() => {
    if (productDataStatus === "succeeded") {
      dispatch(updateIframeState({ iframeState: false }));
      dispatch(clearSelectedImage());
      dispatch(resetProductDataStatus());
    }
  }, [productDataStatus]);

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
            src="https://prod1-filemanger-app.finerworks.com/#/thumbnail"
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="File Management"
          />
        {productData?.product_url_file?.length &&  <button
            style={{
              position: "absolute",
              border: "none",
              top: isFullScreen ? 10 : 15,
              right: isFullScreen ? 100 : 200,
              zIndex: 1000,
            }}
            className={`${styles.btngrad}`}
            onClick={handleAddProduct}
          >
            Add product
          </button>}
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
