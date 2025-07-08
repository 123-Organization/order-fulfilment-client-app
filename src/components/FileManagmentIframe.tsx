import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Modal, Button } from "antd";
import { FullscreenOutlined, CompressOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../store";
import {
  updateCompanyInfo,
  updateIframeState,
} from "../store/features/companySlice";
import styles from "./Components.module.css";
import { useCookies } from "react-cookie";

import {
  AddProductToOrder,
  resetProductDataStatus,
} from "../store/features/orderSlice";
import { clearProductData, clearSelectedImage, setProductData, setSelectedImage } from "../store/features/productSlice";
import { updateProductValidSKU } from "../store/features/orderSlice";

export default function FileManagementIframe({ iframe, setIframe }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [iframeLink, setIframeLink] = useState("");
  const [logo, setLogo] = useState("");
  const [logoUpdate, setLogoUpdate] = useState(false);
  const iframeContainerRef = useRef(null);
  const dispatch = useAppDispatch();
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  const SelectedImage = useAppSelector(
    (state) => state.ProductSlice.SelectedImage
  );
  console.log("lolo", logo);

  const location = useLocation();
  console.log("SelectedImage", SelectedImage);
  const { iframeState } = useAppSelector((state) => state.company.iframeState);
  const productData = useAppSelector((state) => state.ProductSlice.productData);
  const ordersStatus = useAppSelector((state) => state.order.status);
  const companyinfoStatus = useAppSelector(
    (state) => state.company.companyinfoStatus
  );
  const companyinfo=useAppSelector((state)=>state.company.company_info)
  console.log("comcom", companyinfo);
  const productDataStatus = useAppSelector(
    (state) => state.order.productDataStatus
  );

  const iframee = document.getElementById("file-manager-iframe");

  useEffect(() => {
    if(iframeState){
    if (SelectedImage) {
      const data = {
        ...productData,
        product_url_file: [SelectedImage],
        product_url_thumbnail: [SelectedImage],
      };
      console.log("deeeedo", data);
      dispatch(setProductData(data)); 
    }
  }
  }, [SelectedImage]);
  
  useEffect(() => {
    setIframeLink("https://prod1-filemanger-app.finerworks.com/#/thumbnail");
    const settings = {
      settings: {
        guid: null,
        session_id: "null",
        account_key: companyinfo?.data?.account_key,
        multiselect: false,
        libraries: ["inventory", "temporary"],
        domain: "finerworks.com",
        terms_of_service_url: "/terms.aspx",
        button_text: "Use Selected",
        account_id: companyinfo?.data?.account_id,
      },
    };
    console.log("sotsot", settings);

    // Add an event listener for the iframe load event
    const handleIframeLoad = () => {
      const iframeElement = document.getElementById("file-manager-iframe");
      if (iframeElement?.contentWindow) {
        iframeElement.contentWindow.postMessage(settings, "*");
      }
    };

    const iframeElement = document.getElementById("file-manager-iframe");
    if (iframeElement) {
      iframeElement.addEventListener("load", handleIframeLoad);
    }

    return () => {
      const iframeElement = document.getElementById("file-manager-iframe");
      if (iframeElement) {
        iframeElement.removeEventListener("load", handleIframeLoad);
      }
    };
  }, []); // Empty dependency array since we only want this to run once on mount

  const [buttonPosition, setButtonPosition] = useState({
    top: 0,
    right: 0,
  });
  const mobileSize = window.innerWidth < 820;

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
  useEffect(() => {
    if (companyinfoStatus === "success") {
    }
  }, [companyinfoStatus]);

  useEffect(() => {
    if (isFullScreen && !mobileSize) {
      setButtonPosition({
        top: 10,
        right: 100,
      });
    } else if (!isFullScreen && !mobileSize) {
      setButtonPosition({
        top: 15,
        right: 200,
      });
    } else if (mobileSize) {
      setButtonPosition({
        top: 150,
        right: 55,
      });
    }
  }, [isFullScreen, mobileSize]);

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
      dispatch(setSelectedImage(filteredImages[0]));
      setLogo(filteredImages[0]);
    } catch (error) {
      console.error("Error parsing message data:", error);
    }
  };
  console.log("logo", logo);

  useEffect(() => {
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleAddProduct = () => {
    console.log("dada", productData);
    if (productData?.toReplace) {
      const data = {
        ...productData,
        product_url_file: productData?.product_url_file,
        product_url_thumbnail: productData?.product_url_file,
        };
      dispatch(updateProductValidSKU(data));
    } else {
      // Process images one by one with sequential delays
    // Process images one by one with sequential delays
    const data = {
      ...productData,
      product_url_file: productData?.product_url_file,
      product_url_thumbnail: productData?.product_url_file,
      };
      dispatch(AddProductToOrder(data));
    }
  };
  useEffect(() => {
    if (productDataStatus === "succeeded") {
      dispatch(updateIframeState({ iframeState: false }));
      dispatch(clearSelectedImage());
      dispatch(resetProductDataStatus());
    }
  }, [productDataStatus]);
  const handleUpdateLogo = () => {
    dispatch(
      updateCompanyInfo({
        logo_url: logo,
      })
    );

    // Set logoUpdate to true to trigger refresh
    setLogoUpdate(true);
    dispatch(updateIframeState({ iframeState: false }));
    setLogo("");
  };

  useEffect(() => {
    if (iframeState === false || iframe === false) {
      const iframeElement = document.getElementById("file-manager-iframe");
      if (iframeElement) {
        // Store the current src
        const currentSrc = iframeElement.src;
        // Set src to empty string first
        iframeElement.src = "";
        // Then set it back to the original src
        setTimeout(() => {
          iframeElement.src = currentSrc;
          // Reset logoUpdate after refresh is complete
          setLogoUpdate(false);
        }, 100); // Increased timeout to ensure proper refresh
      }
    }
  }, [logoUpdate, iframeState, iframe]);

  // Add a new useEffect to handle iframe visibility
  useEffect(() => {
    if (iframe === true || iframeState === true) {
      // Reset logoUpdate when iframe is opened
      setLogoUpdate(false);
      // Ensure iframeLink is set
      setIframeLink("https://prod1-filemanger-app.finerworks.com/#/thumbnail");
    }
  }, [iframe, iframeState]);
  console.log("wee", productData?.product_url_file)

  return (
    <div className="z-100">
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
          background: isMaximized || isSmallScreen ? "transparent" : "initial",
          zIndex: 1500
        }}
        bodyStyle={{
          padding: 0,
          height: isMaximized || isSmallScreen ? "100vh" : "550px",
        }}
        className="z-50"
        onCancel={() => {
          setIframe(false);
          setLogoUpdate(false); // Reset logoUpdate when closing
          dispatch(updateIframeState({ iframeState: false }));
          dispatch(clearProductData());
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
            src={iframeLink}
            width="100%"
            height="100%"
            id="file-manager-iframe"
            style={{ border: "none" }}
            title="File Management"
            onLoad={() => {
              const settings = {
                settings: {
                  guid: null,
                  session_id: cookies.Session,
                  account_key: cookies.AccountGUID,
                  multiselect: location.pathname.includes("/mycompany")
                    ? false
                    : true,
                  libraries: ["inventory", "temporary"],
                  domain: "finerworks.com",
                  terms_of_service_url: "/terms.aspx",
                  button_text: "Use Selected",
                  account_id: null,
                },
              };
              const iframeElement = document.getElementById(
                "file-manager-iframe"
              );
              if (iframeElement?.contentWindow) {
                iframeElement.contentWindow.postMessage(settings, "*");
              }
            }}
          />
          {productData?.product_url_file?.length  &&
            (location.pathname.includes("/editorder") ||
              location.pathname.includes("/importlist")) && (
              <button
                style={{
                  position: "absolute",
                  border: "none",
                  top: buttonPosition.top,
                  right: buttonPosition.right,
                  zIndex: 1000,
                }}
                className={`${styles.btngrad}`}
                onClick={handleAddProduct}
              >
                Add product
              </button>
            )}
          {location.pathname === "/mycompany" && logo?.length > 0 && (
            <button
              style={{
                position: "absolute",
                border: "none",
                top: buttonPosition.top,
                right: buttonPosition.right,
                zIndex: 1000,
              }}
              className={`${styles.btngrad}`}
              onClick={handleUpdateLogo}
            >
              Update Logo
            </button>
          )}
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
