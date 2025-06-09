import React from "react";
import { Modal, Button } from "antd";

interface PopupModalProps {
  visible: boolean;
  onClose: (value: boolean) => void;

}

const QuantityMessage: React.FC<PopupModalProps> = ({ visible, onClose, }) => {
  const onCancel = () => {
    onClose(false);
  };
 

  return (
    <Modal
      visible={visible}
      onCancel={onCancel} // Close modal when clicking outside or on 'X'
      footer={[
        <div className="flex justify-center gap-4" key="footer">
        <Button   danger >Confirm</Button>
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>
        </div>,
      ]}
      className="text-center mt-20"
    >
      <p>Would you Like to Increase the Quantity</p>
    </Modal>
  );
};

export default QuantityMessage;
