import React from "react";
import { Modal, Button } from "antd";
import VirtualInventory from "../pages/VirtualInventory";
interface VirtualInvProps {
  visible: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
}

const VirtualInvModal: React.FC<VirtualInvProps> = ({ visible, onClose, onProductAdded }) => {
  return (
    <Modal
      title="Select from Inventory"
      width={1000}
      visible={visible}
      onCancel={onClose}
      footer={[]}
    >
      <VirtualInventory onClose={onClose} onProductAdded={onProductAdded} />
    </Modal>
  );
};

export default VirtualInvModal;
