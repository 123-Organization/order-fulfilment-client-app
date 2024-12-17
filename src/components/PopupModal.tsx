import React, { useState, useEffect } from "react";
import { Modal, Button, Input, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../store";
import { AddProductToOrder } from "../store/features/orderSlice";

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
  const productCode = useAppSelector((state) => state.order.productCode);

  // State to track the input value
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update state when the input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle submission of the product code
  const handleProductCodeChange = () => {
    setIsLoading(true);

    const data = {
      skuCode: "",
      productCode: "",
      orderFullFillmentId,
    };

    if (inputValue.startsWith("AP")) {
      data.skuCode = inputValue;
    } else {
      data.productCode = inputValue;
    }

    dispatch(AddProductToOrder(data));
   
    setTimeout(() => {
      setInputValue("");
      
      onProductCodeUpdate();
      setIsLoading(false);
      onClose();
    }, 1000);

   
    
  };

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
