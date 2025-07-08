import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Input, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../store";
import {
  AddProductToOrder,
  fetchOrder,
  resetReplaceCodeStatus,
  updateProductValidSKU,
} from "../store/features/orderSlice";
import { useNotificationContext } from "../context/NotificationContext";
import { updateIframeState } from "../store/features/companySlice";
import {
  getAllImages,
  setSelectedImage,
  setProductData,
  clearSelectedImage,
} from "../store/features/productSlice";
import { resetOrderStatus } from "../store/features/orderSlice";

interface ReplacingCodeProps {
  visible: boolean;
  onClose: () => void;
  orderFullFillmentId: string;
  toReplace: string;
  accountId: number;
  onProductCodeUpdate: (productCode: string | undefined) => void;
}

const ReplacingCode: React.FC<ReplacingCodeProps> = ({
  visible,
  onClose,
  orderFullFillmentId,
  toReplace,
  accountId,
  onProductCodeUpdate,
}) => {
  const dispatch = useAppDispatch();
  const notificationApi = useNotificationContext();
  const images = useAppSelector((state) => state.ProductSlice.images);
  const iframeState = useAppSelector((state) => state.company.iframeState);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const productDataStatus = useAppSelector(
    (state) => state.order.productDataStatus
  );
  const isFirstRender = useRef(true);
  const SelectedImage = useAppSelector(
    (state) => state.ProductSlice.SelectedImage
  );
  const replaceCodeResult = useAppSelector(
    (state) => state.order.replaceCodeResult
  );
  const replaceCodeStatus = useAppSelector(
    (state) => state.order.replaceCodeStatus
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value?.trim());
    console.log("inpu", e.target.value);
  };

  const filterImages = (data: any) => {
    return data?.data?.fileSelected?.map(
      (image: any) => image?.public_thumbnail_uri
    );
  };

  const handleReplace = (event: any) => {
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
  };

  const handleClose = () => {
    dispatch(clearSelectedImage());
    setInputValue("");
    onClose();
  };

  const handleReplaceSKU = () => {
    setIsLoading(true);

    if (inputValue.startsWith("AP")) {
      const data = {
        orderFullFillmentId,
        productCode: "",
        skuCode: inputValue,
        product_url_file: [],
        product_url_thumbnail: [],
        toReplace,
        accountId,
      };

      dispatch(updateProductValidSKU(data));
      setTimeout(() => {
        setInputValue("");
        dispatch(clearSelectedImage());
        onProductCodeUpdate(inputValue);
        setIsLoading(false);
        onClose();
      }, 1000);
    } else {
      dispatch(updateIframeState({ iframeState: true }));
      notificationApi.success({
        message: "Choose A Product Image",
        description:
          "Please choose the product image you want to add to the order.",
      });
      onClose();
    }
  };


  console.log("lue", inputValue);

  useEffect(() => {
    if (SelectedImage) {
      const data = {
        orderFullFillmentId,
        productCode: inputValue,
        skuCode: "",
        product_url_file: SelectedImage,
        product_url_thumbnail: SelectedImage,
        toReplace,
        accountId,
      };
      console.log("deeeedo", data);
      dispatch(setProductData(data));
    }
  }, [SelectedImage, inputValue, orderFullFillmentId]);

  useEffect(() => {
    window.addEventListener("replace", handleReplace);
    if (iframeState) {
      dispatch(getAllImages());
    }
    return () => {
      window.removeEventListener("replace", handleReplace);
    };
  }, []);

  console.log("productDataStatus", productDataStatus);
  console.log("replaceCodeStatus", replaceCodeStatus);

  // useEffect(() => {
  //   if (replaceCodeStatus === "succeeded") {
  //     if (isFirstRender.current) {
  //       isFirstRender.current = false;
  //       return;
  //     }

      
  //       notificationApi.success({
  //         message: "SKU Replaced",
  //         description: "Product SKU has been successfully replaced.",
  //       });

  //       dispatch(clearSelectedImage());
  //       onClose();
  //       setInputValue("");
  //       setIsLoading(false);
  //       onProductCodeUpdate(inputValue);
  //       dispatch(resetOrderStatus());
  //       dispatch(resetReplaceCodeStatus()); 
  //     } else if (replaceCodeStatus === "failed") {
  //       notificationApi.error({
  //         message: "Failed to Replace SKU",
  //         description: "An error occurred while replacing the SKU.",
  //       });
  //       setIsLoading(false);
  //     }

  // }, [replaceCodeStatus, toReplace, inputValue]);

  useEffect(() => {
    if (!visible) {
      dispatch(clearSelectedImage());
    }
  }, [visible, dispatch]);

  return (
    <Modal
      title="Replace Invalid SKU"
      visible={visible}
      onCancel={handleClose}
      style={{ zIndex: 10 }}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleReplaceSKU}
          disabled={isLoading}
        >
          Replace SKU
        </Button>,
      ]}
    >
      <div className="mb-4">
        <div className="text-gray-600 mb-2">Current SKU to replace:</div>
        <div className="bg-red-50 text-red-700 px-3 py-2 rounded-md font-mono">
          {toReplace}
        </div>
      </div>
      <Input
        placeholder="Enter new SKU code here"
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

export default ReplacingCode;
