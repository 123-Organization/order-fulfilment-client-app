import React from "react";
import { Modal } from "antd";
import ShippingPreference from "../pages/ShippingPreference";
import BottomIcon from "./BottomIcon";
interface VirtualInvProps {
  visible: boolean;
  onClose: () => void;
  collapsed: boolean;
  
}

const ShipmentModal: React.FC<VirtualInvProps> = ({ visible, onClose, collapsed }) => {
  return (
    <Modal
      title="Shipment prefrence"
      width={2000}
      visible={visible}
      onCancel={onClose}
      footer={[]}
    >
      <ShippingPreference />
      { <BottomIcon  />}
    </Modal>
  );
};

export default ShipmentModal;
