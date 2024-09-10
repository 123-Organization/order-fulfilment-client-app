import React from "react";
import { Modal, Button, Input } from "antd";

interface PopupModalProps {
  visible: boolean;
  onClose: () => void;
}

const PopupModal: React.FC<PopupModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      title="Enter Product Code"
      visible={visible}
      onCancel={onClose}  // Close modal when clicking outside or on 'X'
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={onClose}>
          Submit
        </Button>,
      ]}
    >
      <Input placeholder="Enter product code here" />
    </Modal>
  );
};

export default PopupModal;
