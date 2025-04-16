import React from "react";
import { Modal, Typography, Divider, Badge, Card } from "antd";

type PopupModalProps = {
  visible: boolean;
  onClose: () => void;
  ChangedValues: Record<string, string>; // Fix the type to avoid unknown error
};

const { Title, Text } = Typography;

const UpdatePopup: React.FC<PopupModalProps> = ({
  visible,
  onClose,
  ChangedValues,
}) => {
  if (!visible) return null;
  
  return (
    <Modal 
      open={visible} 
      onCancel={onClose}
      width={500}
      centered
      footer={null}
      title={null}
      bodyStyle={{ padding: '24px' }}
      className="rounded-lg shadow-lg"
    >
      <div className="flex flex-col items-center">
        <Badge.Ribbon text="Updated" color="#1890ff">
          <Card className="w-full border shadow-sm">
            <div className="text-center mb-6">
              <Title level={3} className="!mb-1 text-gray-800">Recipient Information</Title>
              <Text type="secondary">The following values have been updated</Text>
              <Divider className="my-4" />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(ChangedValues).map(([key, value], index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-md bg-gray-50 hover:bg-blue-50 transition-colors"
                >
                  <Text strong className="text-gray-700 capitalize">
                    {key.replace(/_/g, " ")}:
                  </Text>
                  <div className="flex items-center">
                    <Text className="text-blue-600 font-medium">
                      {value}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </Card>
        </Badge.Ribbon>
      </div>
    </Modal>
  );
};

export default UpdatePopup;
