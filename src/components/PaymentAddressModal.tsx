import React from "react";
import { Modal, Button } from "antd";
import PaymentAddress from "../pages/PaymentAddress";
interface PaymentAddressProps {
  visible: boolean;
  onClose: () => void;
}

const PaymentAddressModal: React.FC<PaymentAddressProps> = ({ visible, onClose }) => {
  return (
    <Modal
      title="Update Payment Method"
      width={'85%'}
      visible={visible}
      onCancel={onClose}
      footer={[]}
    >
      <PaymentAddress />
    </Modal>
  );
};

export default PaymentAddressModal;