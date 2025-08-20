import React, { useState, useEffect } from "react";
import { Modal, Switch, List, Avatar, Button } from "antd";
import { ExclamationCircleFilled, ApiOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../store";
import { useCookies } from "react-cookie";
import { disconnectEcommerce } from "../store/features/ecommerceSlice";
import { disconnectInventory } from "../store/features/InventorySlice";
import { useNotificationContext } from "../context/NotificationContext";

interface Platform {
  id: string;
  name: string;
  type: string;
  isConnected: boolean;
  icon: string;
  connectionId?: string;
}

interface DisconnectPlatformModalProps {
  visible: boolean;
  onClose: () => void;
}

const DisconnectPlatformModal: React.FC<DisconnectPlatformModalProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  const notificationApi = useNotificationContext();
  
  const companyInfo = useAppSelector((state) => state.company.company_info);
  const connectionVerificationStatus = useAppSelector(
    (state) => state.company.connectionVerificationStatus
  );
  const wordpressConnectionId = useAppSelector(
    (state) => state.company.wordpress_connection_id
  );
  
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Initialize platforms based on company connections
  useEffect(() => {
    const platformList: Platform[] = [];

    // WooCommerce platform
    if (companyInfo?.data?.connections?.length) {
      const wooConnection = companyInfo.data.connections.find(
        (conn: any) => conn.name === "WooCommerce" || conn.data?.includes("woocommerce")
      );
      
      if (wooConnection) {
        platformList.push({
          id: "woocommerce",
          name: "WooCommerce",
          type: "ecommerce",
          isConnected: connectionVerificationStatus === "connected",
          icon: "🛒",
          connectionId: wordpressConnectionId,
        });
      }
    }

    // Future platforms can be added here
    // Example:
    // platformList.push({
    //   id: "shopify",
    //   name: "Shopify",
    //   type: "ecommerce", 
    //   isConnected: false,
    //   icon: "🛍️"
    // });

    setPlatforms(platformList);
  }, [companyInfo, connectionVerificationStatus, wordpressConnectionId]);

  const handleDisconnect = async (platform: Platform) => {
    setDisconnecting(platform.id);

    try {
      if (platform.type === "ecommerce") {
        // Disconnect ecommerce platform
        await dispatch(disconnectEcommerce({
          client_id: cookies.AccountGUID,
          platformName: platform.name.toLowerCase(),
          domainName: platform.connectionId,
        }));

        // Disconnect inventory
        await dispatch(disconnectInventory({
          data: {
            account_key: cookies.AccountGUID,
            platform: platform.name.toLowerCase(),
          },
        }));

        notificationApi?.success({
          message: `${platform.name} Disconnected`,
          description: `${platform.name} has been successfully disconnected.`,
        });

        // Update platform status
        setPlatforms(prev =>
          prev.map(p =>
            p.id === platform.id ? { ...p, isConnected: false } : p
          )
        );
      }
    } catch (error) {
      console.error(`Error disconnecting ${platform.name}:`, error);
      notificationApi?.error({
        message: "Disconnection Failed",
        description: `Failed to disconnect ${platform.name}. Please try again.`,
      });
    } finally {
      setDisconnecting(null);
    }
  };

  const connectedPlatforms = platforms.filter(p => p.isConnected);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ApiOutlined className="text-blue-500" />
          <span>Disconnect Platforms</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={500}
    >
      <div className="py-4">
        {connectedPlatforms.length === 0 ? (
          <div className="text-center py-8">
            <ApiOutlined className="text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">No platforms are currently connected.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-gray-600">
              Manage your connected platforms. Toggle off to disconnect.
            </p>
            <List
              dataSource={connectedPlatforms}
              renderItem={(platform) => (
                <List.Item
                  className="border rounded-lg mb-3 p-4 hover:bg-gray-50"
                  actions={[
                    <Switch
                      key="switch"
                      checked={platform.isConnected}
                      loading={disconnecting === platform.id}
                      onChange={() => handleDisconnect(platform)}
                      checkedChildren="Connected"
                      unCheckedChildren="Disconnected"
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: "#f0f0f0" }}
                        icon={
                          <span className="text-2xl">{platform.icon}</span>
                        }
                      />
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{platform.name}</span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          {platform.type.toUpperCase()}
                        </span>
                      </div>
                    }
                    description={
                      <div>
                        <p className="text-sm text-gray-500">
                          Status: {platform.isConnected ? "Connected" : "Disconnected"}
                        </p>
                        {platform.connectionId && (
                          <p className="text-xs text-gray-400 mt-1">
                            ID: {platform.connectionId}
                          </p>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <ExclamationCircleFilled className="text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Warning
                  </p>
                  <p className="text-sm text-yellow-700">
                    Disconnecting a platform will remove all associated media and data.
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default DisconnectPlatformModal;
