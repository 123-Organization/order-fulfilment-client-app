import React from "react";
import { Modal, Button } from "antd";
import PaymentAddress from "../pages/PaymentAddress";
interface PaymentAddressProps {
  visible: boolean;
  onClose: () => void;
  remainingTotal: number;
}

const PaymentAddressModal: React.FC<PaymentAddressProps> = ({ visible, onClose, remainingTotal= 0 }) => {
  return (
    <Modal
      title="Update Payment Method"
      width={'85%'}
      visible={visible}
      onCancel={onClose}
      footer={[]}
    >
      <PaymentAddress
      remainingTotal = {remainingTotal}
      />
    </Modal>
  );
};

export default PaymentAddressModal;