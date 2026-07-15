import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import VirtualInventory from "../pages/VirtualInventory";
import { useAppDispatch } from "../store";
import { inventorySelectionClean } from "../store/features/InventorySlice";

interface VirtualInvProps {
  visible: boolean;
  onClose: () => void;
  orderFullFillmentId?: string;
  onProductAdded?: () => void;
}

const VirtualInvModal: React.FC<VirtualInvProps> = ({ visible, onClose, orderFullFillmentId, onProductAdded }) => {
  const dispatch = useAppDispatch();
  // Increment on every open so React fully remounts VirtualInventory,
  // resetting all local state (selected item, scroll position, etc.)
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    if (visible) {
      // Clear any lingering Redux selection from the previous session
      dispatch(inventorySelectionClean());
      // Force a full remount of VirtualInventory
      setMountKey(prev => prev + 1);
    }
  }, [visible, dispatch]);

  return (
    <Modal
      title="Enter Product Code"
      width={1000}
      visible={visible}
      onCancel={onClose}
      footer={[]}
      destroyOnClose
    >
      <VirtualInventory
        key={mountKey}
        onClose={onClose}
        orderFullFillmentId={orderFullFillmentId}
        onProductAdded={onProductAdded}
      />
    </Modal>
  );
};

export default VirtualInvModal;
