import React, { useState, useRef, useEffect,  } from "react";
import { useLocation } from "react-router-dom"; 
import { Modal, Button } from "antd";
import { FullscreenOutlined, CompressOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../store";
import { updateCompanyInfo, updateIframeState } from "../store/features/companySlice";
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
  const [logo, setLogo] = useState("");
  const iframeContainerRef = useRef(null);
  const dispatch = useAppDispatch();
  const SelectedImage = useAppSelector(
    (state) => state.ProductSlice.SelectedImage
  );
  const location = useLocation();
  console.log("SelectedImage", SelectedImage);
  const { iframeState } = useAppSelector((state) => state.company.iframeState);
  const productData = useAppSelector((state) => state.ProductSlice.productData);
  const ordersStatus = useAppSelector((state) => state.order.status);
  const productDataStatus = useAppSelector(
    (state) => state.order.productDataStatus
  );

  const [isMaximized, setIsMaximized] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1200);
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

  const filterImages = (data: any) => {
    return data?.data?.fileSelected.map(
      (image: any) => image?.public_thumbnail_uri
    );
  };
  
  const handleMessage = (event: any) => {
    try {
      const data = event.data;
      console.log("dataaa", data);
      const filteredImages = filterImages(data);
      console.log("filteredImages", filteredImages);
      setLogo(filteredImages[0]);
    } catch (error) {
      console.error("Error parsing message data:", error);
    }
  }
  console.log("logo", logo);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

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
  const handleUpdateLogo = () => {
    dispatch(updateCompanyInfo({
      logo_url: logo,
    }));
  }

  return (
    <div className="z-50">
      <Modal
        title="File Management"
        visible={iframe === true || iframeState === true}
        onOk={() => setIframe(false)}
        width={isMaximized || isSmallScreen ? "100vw" : "80%"}
        style={{
          top: isMaximized || isSmallScreen ? 0 : 50,
          left: 0,
          height: isMaximized || isSmallScreen ? "100vh" : "auto",
          maxWidth: "100vw",
          background: isMaximized || isSmallScreen ? "transparent" : "initial", // Remove background when maximizing
        }}
        bodyStyle={{
          padding: 0,
          height: isMaximized || isSmallScreen ? "100vh" : "550px",
        }}
        className="z-50"
        onCancel={() => {
          setIframe(false);
          dispatch(updateIframeState({ iframeState: false }));
        }}
        
        footer={null}
      >
        <div
          ref={iframeContainerRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
          }}
          className="z-50"
        >
          <iframe
            src="https://prod1-filemanger-app.finerworks.com/#/thumbnail"
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="File Management"
          />
        {productData?.product_url_file?.length  &&  <button
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
          {location.pathname === "/mycompany" &&  <button
            style={{
              position: "absolute",
              border: "none",
              top: isFullScreen ? 10 : 15,
              right: isFullScreen ? 100 : 200,
              zIndex: 1000,
            }}
            className={`${styles.btngrad}`}
            onClick={handleUpdateLogo}
          >
            Update Logo
          </button>}
          <Button
            type="default"
            className="z-50"
            style={{
              position: "absolute",
              border: "none",
              top: isFullScreen ? 10 : -39,
              right: isFullScreen ? 100 : 20,
              zIndex: 1000,
            }}
            icon={
              isMaximized || isSmallScreen ? (
                <CompressOutlined />
              ) : (
                <FullscreenOutlined className="text-gray-600" />
              )
            }
            onClick={toggleMaximize}
          ></Button>
        </div>
      </Modal>
    </div>
  );
}
