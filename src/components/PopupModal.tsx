import React, { useState, useEffect } from "react";
import { Modal, Button, Input, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../store";
import { AddProductToOrder } from "../store/features/orderSlice";
import { useNotificationContext } from "../context/NotificationContext";
import { updateIframeState } from "../store/features/companySlice";
import { getAllImages, setSelectedImage, setProductData, clearSelectedImage } from "../store/features/productSlice";
import { resetOrderStatus } from "../store/features/orderSlice";


interface PopupModalProps {
  visible: boolean;
  onClose: () => void;
  setProductCode: (productCode: boolean) => void;
  orderFullFillmentId: string;
  onProductCodeUpdate: () => void;
}

const PopupModal: React.FC<PopupModalProps> = ({
  visible,
  onClose,
  setProductCode,
  orderFullFillmentId,
  onProductCodeUpdate,
}) => {
  const dispatch = useAppDispatch();
  // const code = useAppSelector((state) => state.order.productCode);
  // Access the productCode from the Redux store
  const notificationApi = useNotificationContext();
  const productCode = useAppSelector((state) => state.order.productCode);
  const images = useAppSelector((state) => state.ProductSlice.images);
  console.log("images", images);

  // State to track the input value
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const productDataStatus = useAppSelector((state) => state.order.productDataStatus);
  
  const SelectedImage = useAppSelector(
    (state) => state.ProductSlice.SelectedImage
  );
  console.log("SelectedImage", SelectedImage);
  // Update state when the input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const filterImages = (data: any) => {
    return data?.data?.fileSelected.map(
      (image: any) => image?.public_thumbnail_uri
    );
  };

  const handleMessage = (event: any) => {
    console.log("Message event:", event.type);

    try {
      const data = event.data;
      console.log("dataaa", data);
      const filteredImages = filterImages(data);
      console.log("filteredImages", filteredImages);
      dispatch(setSelectedImage(filteredImages));
    } catch (error) {
      console.error("Error parsing message data:", error);
    }
  }
  ;

  const handleProductCodeChange = () => {
    setIsLoading(true);

    
    if (inputValue.startsWith("AP")) {
      const data = {
      skuCode: "",
      productCode: "",
      orderFullFillmentId,
      product_url_file: [],
      product_url_thumbnail: [],
    };

      data.skuCode = inputValue;
      dispatch(AddProductToOrder(data));
      setTimeout(() => {
        setInputValue("");

        onProductCodeUpdate();
        setIsLoading(false);
        onClose();
      }, 1000);
    } else {
     
      
      
      dispatch(updateIframeState({ iframeState: true }));
    }

    console.log("stat", productDataStatus); 
  };

  useEffect(() => {
    if (SelectedImage) {
      const data = {
        skuCode: "",
        productCode: inputValue,
        orderFullFillmentId,
        pixel_width: 1200,
        pixel_height: 900,
        product_url_file: SelectedImage,
        product_url_thumbnail: SelectedImage,
      };
      dispatch(setProductData(data));
    }
  }, [SelectedImage, inputValue, orderFullFillmentId]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    window.addEventListener("message", (event) => {
      if (event.data.type === "REFERRER_UPDATE") {
        console.log("Received referrer update:", event.data.data);
      }
    });
    dispatch(getAllImages());
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (productDataStatus === "succeeded") {
      notificationApi.success({
        message: "Product Added",
        description: "Product has been successfully added to the order.",
      });
      onClose();
      onProductCodeUpdate();
      dispatch(resetOrderStatus());
    } else if (productDataStatus === "failed") {
      notificationApi.error({
        message: "Failed to Add Product",
        description: "An error occurred while adding the product.",
      });
  
      setIsLoading(false);
    }
  }, [productDataStatus, notificationApi]);

  // UseEffect to handle changes in productCode
  useEffect(() => {
    if (productCode) {
      // Reset the input field and loading state when productCode updates
      setInputValue("");
      setIsLoading(false);

      // Call setProductCode to indicate the update is complete
      setProductCode(false);
    }
  }, [productCode, setProductCode]);

  return (
    <Modal
      title="Enter Product Code"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleProductCodeChange}
          disabled={isLoading}
        >
          Submit
        </Button>,
      ]}
    >
      <Input
        placeholder="Enter product code here"
        value={inputValue}
        onChange={handleInputChange}
        disabled={isLoading}
      />
      {isLoading && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Spin indicator={<LoadingOutlined spin />} size="large" />
        </div>
      )}
    </Modal>
  );
};

export default PopupModal;
