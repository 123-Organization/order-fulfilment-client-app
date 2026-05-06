import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Input, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../store";
import { AddProductToOrder, fetchOrder, updateValidSKU } from "../store/features/orderSlice";
import { useNotificationContext } from "../context/NotificationContext";
import { setProductData, clearSelectedImage } from "../store/features/productSlice";
import { resetOrderStatus } from "../store/features/orderSlice";
import ImageGalleryModal from "./ImageGalleryModal";

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
  const notificationApi = useNotificationContext();
  const productCode = useAppSelector((state) => state.order.productCode);
  const companyinfo = useAppSelector((state) => state.company.company_info);
  const validSKU = useAppSelector((state) => state.order.validSKU);
  const productDataStatus = useAppSelector((state) => state.order.productDataStatus);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const isFirstRender = useRef(true);

  // Update input value
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value?.trim());
  };

  // Handler for modal close
  const handleClose = () => {
    dispatch(clearSelectedImage());
    setInputValue("");
    setGalleryVisible(false);
    onClose();
  };

  const handleProductCodeChange = () => {
    if (!inputValue) return;
    setIsLoading(true);

    if (inputValue.startsWith("AP")) {
      // Direct SKU code – add it straight to the order
      const data = {
        skuCode: inputValue,
        productCode: "",
        orderFullFillmentId,
        product_url_file: [],
        product_url_thumbnail: [],
        account_key: companyinfo?.data?.account_key,
      };
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
      // Non-SKU product code — open the image gallery
      setIsLoading(false);
      setGalleryVisible(true);
    }
  };

  // Called when user picks an image in the gallery
  const handleImageSelected = (image: any) => {
    const data = {
      skuCode: "",
      productCode: inputValue,
      orderFullFillmentId,
      pixel_width: image.pix_w || 1200,
      pixel_height: image.pix_h || 900,
      product_url_file: [image.private_hires_uri],
      product_url_thumbnail: [image.public_thumbnail_uri],
      account_key: companyinfo?.data?.account_key,
    };

    dispatch(setProductData(data));
    dispatch(AddProductToOrder(data));
    dispatch(updateValidSKU([...validSKU, inputValue]));

    notificationApi.success({
      message: "Image Selected",
      description: `"${image.title}" will be used for this product.`,
    });
    setGalleryVisible(false);
    setInputValue("");
    onProductCodeUpdate();
    onClose();
  };

  // Watch for productDataStatus
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
      dispatch(updateValidSKU([...validSKU, productCode]));
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
  }, [productDataStatus]);

  // UseEffect to handle changes in productCode
  useEffect(() => {
    if (productCode) {
      setIsLoading(false);
      setProductCode(false);
    }
  }, [productCode, setProductCode]);

  // Clear selected image when modal becomes hidden
  useEffect(() => {
    if (!visible) {
      dispatch(clearSelectedImage());
    }
  }, [visible, dispatch]);

  return (
    <>
      <Modal
        className="z-20"
        title={
          <div className="flex items-center gap-2">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              }}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </span>
            <span className="font-semibold text-gray-800">Enter Product Code</span>
          </div>
        }
        open={visible}
        onCancel={handleClose}
        footer={[
          <Button key="cancel" onClick={handleClose}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleProductCodeChange}
            disabled={isLoading || !inputValue}
            style={{
              background: inputValue && !isLoading
                ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                : undefined,
              border: "none",
            }}
          >
            {inputValue.startsWith("AP") ? "Add Product" : "Next — Choose Image"}
          </Button>,
        ]}
        centered
        width={460}
      >
        <div className="py-2">
          <p className="text-sm text-gray-500 mb-3">
            Enter an <strong>AP-SKU code</strong> to add directly, or enter any product code and you'll
            be prompted to pick an image from your library.
          </p>
          <Input
            placeholder="e.g. AP1234567891011 or MyProductCode"
            value={inputValue}
            onChange={handleInputChange}
            disabled={isLoading}
            size="large"
            prefix={
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
            onPressEnter={handleProductCodeChange}
          />
          {isLoading && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Spin indicator={<LoadingOutlined spin />} size="large" />
            </div>
          )}
        </div>
      </Modal>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        visible={galleryVisible}
        onClose={() => setGalleryVisible(false)}
        onImageSelect={handleImageSelected}
        title={`Choose Image for "${inputValue}"`}
      />
    </>
  );
};

export default PopupModal;
