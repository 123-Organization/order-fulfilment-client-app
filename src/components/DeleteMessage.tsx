import React from "react";
import { Modal, Button } from "antd";

interface PopupModalProps {
  visible: boolean;
  onClose: (value: boolean) => void;
  onDeleteProduct:any;
  deleteItem: any;
}

const DeleteMessage: React.FC<PopupModalProps> = ({ visible, onClose, onDeleteProduct, deleteItem }) => {
  const onCancel = () => {
    onClose(false);
  };
  const DeleteProduct = () => {
    onDeleteProduct(deleteItem);
    onClose(false);
  }
console.log("itit",deleteItem)
  return (
    <Modal
      visible={visible}
      onCancel={onCancel} // Close modal when clicking outside or on 'X'
      footer={[
        <div className="flex justify-center gap-4" key="footer">
        <Button   danger onClick={DeleteProduct}>Delete</Button>
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>
        </div>,
      ]}
      className="text-center mt-20"
    >
      <p>Are you sure you want to delete this item?</p>
    </Modal>
  );
};

export default DeleteMessage;
