import React, { useState, useEffect } from "react";
import { Modal, Switch, List, Button } from "antd";
import { ExclamationCircleFilled, ApiOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../store";
import { useCookies } from "react-cookie";
import { disconnectEcommerce, disconnectShopify, resetStatus } from "../store/features/ecommerceSlice";
import { disconnectInventory } from "../store/features/InventorySlice";
import { clearShopifyCredentials, setConnectionVerificationStatus, updateCompanyInfo } from "../store/features/companySlice";
import { useNotificationContext } from "../context/NotificationContext";
import woocommerceSvg from "../assets/images/store-woocommerce.svg";
import shopifySvg from "../assets/images/store-shopify.svg";
import squarespaceSvg from "../assets/images/store-squarespace.svg";
import wixSvg from "../assets/images/store-wix.svg";

interface Platform {
  id: string;
  name: string;
  type: string;
  isConnected: boolean;
  imgSrc: string;
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
  const shopifyShop = useAppSelector(
    (state) => state.company.shopify_shop
  );
  
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Initialize platforms based on company connections
  useEffect(() => {
    const platformList: Platform[] = [
      { id: "woocommerce", name: "WooCommerce", type: "ecommerce", isConnected: false, imgSrc: woocommerceSvg },
      { id: "shopify", name: "Shopify", type: "ecommerce", isConnected: false, imgSrc: shopifySvg },
      { id: "squarespace", name: "Squarespace", type: "ecommerce", isConnected: false, imgSrc: squarespaceSvg },
      { id: "wix", name: "Wix", type: "ecommerce", isConnected: false, imgSrc: wixSvg },
    ];

    if (companyInfo?.data?.connections?.length) {
      // WooCommerce
      const wooConnection = companyInfo.data.connections.find(
        (conn: any) => conn.name === "WooCommerce" || conn.data?.includes("woocommerce")
      );
      if (wooConnection) {
        let isWooConnected = false;
        try {
          if (wooConnection.data) {
             const parsed = JSON.parse(wooConnection.data);
             if (parsed.isConnected === true || parsed.isConnected === "true") {
                isWooConnected = true;
             }
          }
        } catch (e) {}
        if (isWooConnected || connectionVerificationStatus === "connected") {
          const p = platformList.find(p => p.id === "woocommerce");
          if (p) {
            p.isConnected = true;
            p.connectionId = wooConnection.id ? wooConnection.id.split("?")[0] : wordpressConnectionId;
          }
        }
      }

      // Shopify
      const shopifyConnection = companyInfo.data.connections.find((conn: any) => conn.name === "Shopify");
      if (shopifyConnection) {
        let isShopifyConnected = false;
        if (shopifyConnection.id) {
           isShopifyConnected = true;
           if (shopifyConnection.data) {
             try {
               const parsed = JSON.parse(shopifyConnection.data);
               if (parsed.isConnected === false || parsed.isConnected === "false") {
                 isShopifyConnected = false;
               }
             } catch (e) {}
           }
        }
        if (isShopifyConnected || shopifyShop) {
          const p = platformList.find(p => p.id === "shopify");
          if (p) {
            p.isConnected = true;
            p.connectionId = shopifyShop || shopifyConnection.id;
          }
        }
      }

      // Squarespace
      const squarespaceConnection = companyInfo.data.connections.find((conn: any) => conn.name === "Squarespace");
      if (squarespaceConnection && squarespaceConnection.id) {
        let isSqConnected = true;
        if (squarespaceConnection.data) {
          try {
            const parsed = JSON.parse(squarespaceConnection.data);
            if (parsed.isConnected === false || parsed.isConnected === "false") {
              isSqConnected = false;
            }
          } catch (e) {}
        }
        if (isSqConnected) {
          const p = platformList.find(p => p.id === "squarespace");
          if (p) {
            p.isConnected = true;
            p.connectionId = squarespaceConnection.id;
          }
        }
      }

      // Wix
      const wixConnection = companyInfo.data.connections.find((conn: any) => conn.name === "Wix");
      if (wixConnection && wixConnection.id) {
        let isWixConnected = true;
        if (wixConnection.data) {
          try {
            const parsed = JSON.parse(wixConnection.data);
            if (parsed.isConnected === false || parsed.isConnected === "false") {
              isWixConnected = false;
            }
          } catch (e) {}
        }
        if (isWixConnected) {
          const p = platformList.find(p => p.id === "wix");
          if (p) {
            p.isConnected = true;
            p.connectionId = wixConnection.id;
          }
        }
      }
    }

    // Always check shopifyShop even if no connections in array
    if (shopifyShop) {
      const p = platformList.find(p => p.id === "shopify");
      if (p && !p.isConnected) {
        p.isConnected = true;
        p.connectionId = shopifyShop;
      }
    }
    
    // Always check wordpressConnectionId if no connections in array
    if (connectionVerificationStatus === "connected" && wordpressConnectionId) {
      const p = platformList.find(p => p.id === "woocommerce");
      if (p && !p.isConnected) {
        p.isConnected = true;
        p.connectionId = wordpressConnectionId;
      }
    }

    setPlatforms(platformList);
  }, [companyInfo, connectionVerificationStatus, wordpressConnectionId, shopifyShop]);

  const handleDisconnect = async (platform: Platform, checked: boolean) => {
    if (checked) {
      notificationApi?.info({
        message: "Connect Platform",
        description: `To connect to ${platform.name}, please navigate to the Stores page.`,
      });
      return;
    }

    setDisconnecting(platform.id);

    try {
      if (platform.type === "ecommerce") {
        if (platform.id === "shopify") {
          // Disconnect Shopify
          await dispatch(disconnectShopify({
            account_key: cookies.AccountGUID,
          }));

          // Clear Shopify credentials from state
          dispatch(clearShopifyCredentials());
          
          // Reset ecommerce status
          dispatch(resetStatus());
          
          // Refresh company info to update UI state
          dispatch(updateCompanyInfo({}));

          notificationApi?.success({
            message: "Shopify Disconnected",
            description: "Shopify has been successfully disconnected.",
          });

          // Update platform status
          setPlatforms(prev =>
            prev.map(p =>
              p.id === platform.id ? { ...p, isConnected: false } : p
            )
          );
        } else {
          // Disconnect other ecommerce platforms (WooCommerce, etc.)
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
          
          // Reset ecommerce status and update connection verification
          dispatch(resetStatus());
          dispatch(setConnectionVerificationStatus('disconnected'));
          
          // Refresh company info to update UI state
          dispatch(updateCompanyInfo({}));

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

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ApiOutlined className="text-blue-500" />
          <span>Manage Platforms</span>
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
        <p className="mb-4 text-gray-600">
          Manage your platforms. Toggle off to disconnect. To connect a platform, visit the Stores page.
        </p>
          <List
            dataSource={platforms}
            renderItem={(platform) => (
              <List.Item
                className={`border rounded-lg mb-3 p-4 hover:bg-gray-50 ${!platform.isConnected ? 'opacity-70' : ''}`}
                actions={[
                  <Switch
                    key="switch"
                    checked={platform.isConnected}
                    loading={disconnecting === platform.id}
                    onChange={(checked) => handleDisconnect(platform, checked)}
                    checkedChildren="Connected"
                    unCheckedChildren="Disconnected"
                  />,
                ]}
              >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: "#f8faff",
                        border: "1px solid #e8edf5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 6,
                        flexShrink: 0,
                      }}>
                        <img
                          src={platform.imgSrc}
                          alt={platform.name}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>
                    }
                    title={
                      <span className="font-semibold text-gray-800">{platform.name}</span>
                    }
                    description={
                      <span
                        className={`text-xs font-medium ${
                          platform.isConnected ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {platform.isConnected ? "● Connected" : "○ Not connected"}
                      </span>
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
      </div>
    </Modal>
  );
};

export default DisconnectPlatformModal;
