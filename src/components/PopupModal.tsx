import React from "react";
import { Modal, Button, Input } from "antd";
import { on } from "events";

interface PopupModalProps {
  visible: boolean;
  onClose: () => void;
  setProductCode: (productCode: boolean) => void;
}

const PopupModal: React.FC<PopupModalProps> = ({ visible, onClose, setProductCode }) => {
  const handleProductCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductCode(true);
    onClose();
  }
  return (
    <Modal
      title="Enter Product Code"
      visible={visible}
      onCancel={onClose}  // Close modal when clicking outside or on 'X'
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleProductCodeChange}>
          Submit
        </Button>,
      ]}
    >
      <Input placeholder="Enter product code here" />
    </Modal>
  );
};

export default PopupModal;
