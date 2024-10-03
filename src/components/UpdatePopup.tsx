import React from "react";
import { Button, Result, Modal } from "antd";

type PopupModalProps = {
  visible: boolean;
  onClose: () => void;
  ChangedValues: any; // Values passed from EditOrder component
};

const UpdatePopup: React.FC<PopupModalProps> = ({
  visible,
  onClose,
  ChangedValues,
}) => {
  if (!visible) return null; // Hide the popup when not visible

  return (
    <Modal width={1000} visible={visible} footer={[]} onCancel={onClose} centered>
      <div className="flex flex-col items-center justify-center">
        <Result
          status="success"
          title="Information Successfully Updated"
          className="p-5"
        />
        <div className="w-full max-w-60 flex flex-col items-center">
          {Object.entries(ChangedValues).map(([key, value], index) => (
            <div
              key={index}
              className="flex justify-start w-full p-1 mb-2 rounded"
            >
              <div className="font-bold">
                {key.replace("_", " ").toUpperCase()}:
              </div>
              <div className="text-red-800 ml-2">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default UpdatePopup;
