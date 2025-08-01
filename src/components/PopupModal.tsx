import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Input, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../store";
import { AddProductToOrder, fetchOrder, updateValidSKU } from "../store/features/orderSlice";
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
  const order = useAppSelector((state)=> state.order.orders)
const iframeState = useAppSelector((state)=> state.company.iframeState)
  // State to track the input value
  const [inputValue, setInputValue] = useState("");
  const validSKU = useAppSelector((state) => state.order.validSKU);
  const [isLoading, setIsLoading] = useState(false);
  const productDataStatus = useAppSelector((state) => state.order.productDataStatus);
  console.log("datastatus", productDataStatus)
  const isFirstRender = useRef(true);
  const SelectedImage = useAppSelector(
    (state) => state.ProductSlice.SelectedImage
  );
  console.log("SelectedImage", SelectedImage);
  // Update state when the input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value?.trim())
  };
  console.log("inputvalue ",inputValue)

  const filterImages = (data: any) => {
    return data?.data?.fileSelected?.map(
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

  // Handler for modal close
  const handleClose = () => {
    // Clear selected image when modal is closed
    dispatch(clearSelectedImage());
    setInputValue("");
    onClose();
  };

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
        dispatch(clearSelectedImage());
        onProductCodeUpdate();
        dispatch(updateValidSKU([...validSKU, inputValue]));
        setIsLoading(false);
        onClose();
      }, 1000);
    } else {
     
      
      
      dispatch(updateIframeState({ iframeState: true }));
      notificationApi.success({
        message: "Choose A Product Image",
        description: "Please choose the product image want to add to the order.",
      });
      onClose();
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
      console.log("dbdb", data);
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
    if(iframeState){
    dispatch(getAllImages());
    }
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (productDataStatus === "succeeded") {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      notificationApi.success({
        message: "Product Added",
        description: "Product has been successfully added to the order.",
      });

      // Clear selected image on successful add
      dispatch(clearSelectedImage());
      onClose();
      setInputValue("");
      setIsLoading(false);
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

  // Clear selected image when modal becomes visible or invisible
  useEffect(() => {
    if (!visible) {
      dispatch(clearSelectedImage());
    }
  }, [visible, dispatch]);

  return (
    <Modal
    className="z-20"
      title="Enter Product Code"
      visible={visible}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
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
