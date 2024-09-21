import React from "react";
import { Modal } from "antd";
import ShippingPreference from "../pages/ShippingPreference";
interface VirtualInvProps {
  visible: boolean;
  onClose: () => void;
}

const ShipmentModal: React.FC<VirtualInvProps> = ({ visible, onClose }) => {
  return (
    <Modal
      title="Shipment prefrence"
      width={2000}
      visible={visible}
      onCancel={onClose}
      footer={[]}
    >
      <ShippingPreference />
    </Modal>
  );
};

export default ShipmentModal;
