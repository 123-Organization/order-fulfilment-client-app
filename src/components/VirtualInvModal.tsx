import React from "react";
import { Modal, Button } from "antd";
import VirtualInventory from "../pages/VirtualInventory";
interface VirtualInvProps {
  visible: boolean;
  onClose: () => void;
}

const VirtualInvModal: React.FC<VirtualInvProps> = ({ visible, onClose }) => {
  return (
    <Modal
      title="Enter Product Code"
      width={1000}
      visible={visible}
      onCancel={onClose}
      footer={[]}
    >
      <VirtualInventory onClose={onClose} />
    </Modal>
  );
};

export default VirtualInvModal;
