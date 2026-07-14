import React, { useEffect, useState } from "react";
import {
  Button,
  Spin,
  notification,
  Skeleton,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import {
  saveOrder,
  saveShopifyOrder,
  updateOrderStatus,
  updateOrdersInfo,
  resetSaveOrderInfo,
  resetImport,
} from "../store/features/orderSlice";
import config from '../config/configs';
import { listVirtualInventory } from "../store/features/InventorySlice";
import { getImportOrders, resetEcommerceGetImportOrders } from "../store/features/ecommerceSlice";
import NotificationAlert from "./notification";
import ShippingPreference from "../pages/ShippingPreference";
import UpdatePopup from "./UpdatePopup";
import { updateCompanyInfo } from "../store/features/companySlice";
import { resetRecipientStatus } from "../store/features/orderSlice";
import { clearOrderErrors } from "../store/features/shippingSlice";
import style from "./Components.module.css";
import { fetchWporder, fetchShopifyOrders, fetchShopifyOrderByName, fetchSquarespaceOrders, fetchSquarespaceOrderByNumber, resetSquarespaceImportStatus, updateWporder, fetchWixOrders, fetchWixOrderByNumber, resetWixImportStatus, fetchShippoOrders, resetShippoImportStatus, fetchSquareOrders, resetSquareImportStatus } from "../store/features/orderSlice";
type NotificationType = "success" | "info" | "warning" | "error";
interface NotificationAlertProps {
  type: NotificationType;
  message: string;
  description: string;
}

type bottomIconProps = {
  //bolean or null or undefined
  collapsed: boolean | null | undefined;
  setCollapsed:
  | React.Dispatch<React.SetStateAction<boolean>>
  | undefined
  | null;
};

const BASE_URL = config.SERVER_BASE_URL;

// Helper function to validate phone numbers (allows formatted input like "(585) 729-4716")
const isValidPhone = (phone: string | number | undefined): boolean => {
  if (!phone) return false;
  // Remove all non-numeric characters and check if there are at least 10 digits
  const digitsOnly = String(phone).replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

const BottomIcon: React.FC<bottomIconProps> = ({ collapsed, setCollapsed }) => {
  const orders = useAppSelector((state) => state.order.orders);
  const product_details = useAppSelector(
    (state) => state.ProductSlice.product_details
  );

  const currentorderFullFillment = useAppSelector((state) => state.order.currentOrderFullFillmentId);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);

  const orderEdited = useAppSelector((state) => state.order.orderEdited);
  const wordpressConnectionId = useAppSelector((state) => state.company.wordpress_connection_id);
  const shopifyShop = useAppSelector((state) => state.company.shopify_shop);
  const shopifyAccessToken = useAppSelector((state) => state.company.shopify_access_token);
  const shippoAccountKey = useAppSelector((state) => state.company.shippo_account_key);

  const recipientStatus = useAppSelector(
    (state) => state.order.recipientStatus
  );

  const { product_list } = product_details?.data || {};

  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);

  const ecommerceGetImportOrders = useAppSelector(
    (state) => state.Ecommerce.ecommerceGetImportOrders
  );
  const updatedValues =
    useAppSelector((state) => state.order.updatedValues) || {};

  const shipping_preferences = useAppSelector(
    (state) => state.Shipping.shipping_preferences
  );

  const [backVisiable, setBackVisiable] = useState<boolean>(true);
  const [nextVisiable, setNextVisiable] = useState<boolean>(false);
  const [totalVisiable, setTotalVisiable] = useState<boolean>(false);
  const [nextSpinning, setNextSpinning] = useState<boolean>(false);
  const [grandTotal, setGrandtotal] = useState<number>(0);
  const [api, contextHolder] = notification.useNotification();

  const openNotificationWithIcon = ({
    type,
    message,
    description,
  }: NotificationAlertProps) => {
    api[type]({
      message,
      description,
    });
  };

  const pathNameAvoidBackButton = [
    // "/mycompany",
    "/virtualinventory",
    "/importfilter",
    "/paymentaddress",
  ];
  const pathNameAvoidUpdateProfile = ["/importfilter"];
  const wporder = useAppSelector((state) => state.order.Wporder);
  const isShippingLoading = useAppSelector((state) => state.order.isShippingLoading);
  const myCompanyInfoFilled = useAppSelector(
    (state) => state.company.myCompanyInfoFilled
  );

  const myImport = useAppSelector((state) => state.order.myImport);
  const importStatus = useAppSelector((state) => state.order.importStatus);
  const squarespaceImportStatus = useAppSelector((state) => state.order.squarespaceImportStatus);

  const saveOrderInfo = useAppSelector((state) => state.order.saveOrderInfo);

  const myBillingInfoFilled = useAppSelector(
    (state) => state.company.myBillingInfoFilled
  );

  const companyInfo = useAppSelector((state) => state.company.company_info);

  const [stateData, setStateData] = useState<Boolean>(false);
  const dispatch = useAppDispatch();
  let isLoadingImgDelete = false;
  const location = useLocation();

  if (pathNameAvoidBackButton.includes(location.pathname)) {
    backVisiable && setBackVisiable(false);
  } else {
    !backVisiable && setBackVisiable(true);
  }

  if (location.pathname === "/importlist") {
    !totalVisiable && setTotalVisiable(true);
  } else {
    totalVisiable && setTotalVisiable(false);
  }

  const navigate = useNavigate();

  const onNextHandler = async () => {
    if (nextSpinning) return;
    try {
      if (location.pathname === "/mycompany") {
        if (
          myCompanyInfoFilled?.business_info &&
          !isNaN(myCompanyInfoFilled?.business_info?.zip_postal_code) &&
          isValidPhone(myCompanyInfoFilled?.business_info?.phone)
        ) {
          setNextSpinning(true);
          await dispatch(updateCompanyInfo(myCompanyInfoFilled));
          navigate("/billingaddress");
        } else {
          alert("Billing info missing");
        }
      }

      if (location.pathname === "/importfilter") {
        const queryParams = new URLSearchParams(location.search);
        const platformType = queryParams.get("type");

        // Handle Shopify orders
        if (platformType === "Shopify") {
          console.log('Shopify Import Data:', {
            myImport,
            shopifyShop,
            shopifyAccessToken,
            wporder,
            hasStartDate: !!myImport?.start_date,
            hasEndDate: !!myImport?.end_date,
            hasShop: !!shopifyShop,
            hasToken: !!shopifyAccessToken,
            hasOrderNumbers: wporder.length > 0
          });

          // Check if user is trying to import by order number (single orders)
          if (wporder.length > 0) {
            if (!shopifyShop || !shopifyAccessToken) {
              notification.error({
                message: "Missing Configuration",
                description: "Shopify shop or access token is not configured",
              });
              return;
            }

            setNextSpinning(true);
            const orderNames = wporder.split(",").map((name: string) => name.trim());

            try {
              // Fetch each order by name
              const orderPromises = orderNames.map((orderName: string) =>
                dispatch(
                  fetchShopifyOrderByName({
                    shop: shopifyShop,
                    access_token: shopifyAccessToken,
                    orderName: orderName,
                  })
                )
              );

              const results = await Promise.all(orderPromises);

              // Collect all successfully fetched orders
              const allOrders: any[] = [];
              let hasErrors = false;

              results.forEach((result, index) => {
                if (result.payload && result.payload.order) {
                  allOrders.push(result.payload.order);
                } else {
                  hasErrors = true;
                  console.error(`Failed to fetch order ${orderNames[index]}:`, result.payload);
                }
              });

              if (allOrders.length > 0) {
                // Transform Shopify orders to the format expected by upload-orders API
                const transformedOrders = allOrders.map((shopifyOrder: any, orderIndex: number) => {
                  // Extract and transform line items to match the expected format
                  const orderItems = shopifyOrder.lineItems?.edges?.map((edge: any, itemIndex: number) => ({
                    product_order_po: `SHOPIFY_P_${orderIndex}_${itemIndex}`,
                    product_qty: edge.node.quantity || 1,
                    product_sku: edge.node.sku || "",
                    product_title: edge.node.title || "",
                    product_id: edge.node.variant?.product?.product_guid || "",
                  })) || [];

                  // Get shipping address or fall back to billing address
                  const shippingAddr = shopifyOrder.shippingAddress || shopifyOrder.billingAddress || {};

                  // Transform to the expected order format
                  return {
                    order_po: `SHOPIFY_${shopifyOrder.name.replace('#', '')}`,
                    order_key: shopifyOrder.id,
                    recipient: {
                      first_name: shippingAddr.firstName || "",
                      last_name: shippingAddr.lastName || "",
                      company_name: shippingAddr.company || "",
                      address_1: shippingAddr.address1 || "",
                      address_2: shippingAddr.address2 || "",
                      address_3: "",
                      city: shippingAddr.city || "",
                      state_code: shippingAddr.provinceCode || "",
                      province: shippingAddr.province || "",
                      zip_postal_code: shippingAddr.zip || "",
                      country_code: shippingAddr.countryCodeV2 || "US",
                      phone: shippingAddr.phone || shopifyOrder.customer?.phone || "",
                      email: shopifyOrder.customer?.email || "",
                      address_order_po: "",
                    },
                    order_items: orderItems,
                    order_status: shopifyOrder.displayFulfillmentStatus === "UNFULFILLED" ? "Processing" : "Completed",
                    shipping_code: "GD",
                    test_mode: false,
                  };
                });

                const sendData = {
                  accountId: customerInfo?.data?.account_id,
                  payment_token: customerInfo?.data?.account_key,
                  orders: transformedOrders,
                };

                dispatch(saveShopifyOrder(sendData));

                notification.success({
                  message: "Success",
                  description: `${allOrders.length} Shopify order(s) imported successfully${hasErrors ? ' (some orders failed)' : ''}`,
                });

                setTimeout(() => {
                  dispatch(resetSaveOrderInfo());
                  dispatch(resetImport());
                  dispatch(updateWporder('' as any));
                  navigate("/importlist");
                }, 2000);
              } else {
                notification.error({
                  message: "Error",
                  description: "Failed to fetch any Shopify orders",
                });
              }
            } catch (error) {
              console.error("Error fetching Shopify orders:", error);
              notification.error({
                message: "Error",
                description: "An error occurred while fetching Shopify order details",
              });
            } finally {
              setNextSpinning(false);
            }
          }
          // Check if user is trying to import by date range (bulk orders)
          else if (myImport?.start_date || myImport?.end_date) {
            // If importing by date range, both dates are required
            if (!myImport?.start_date || !myImport?.end_date) {
              notification.warning({
                message: "Missing Information",
                description: "Please select both start and end dates for bulk import",
              });
              return;
            }

            if (
              shopifyShop &&
              shopifyAccessToken &&
              (myImport?.start_date && myImport?.end_date)
            ) {
              setNextSpinning(true);
              try {
                const result = await dispatch(
                  fetchShopifyOrders({
                    shop: shopifyShop,
                    access_token: shopifyAccessToken,
                    startDate: myImport.start_date,
                    endDate: myImport.end_date,
                    status: myImport.status,
                  })
                );

                if (result.payload) {


                  // Check if we have orders in the Shopify response
                  if (result.payload.success && result.payload.orders && result.payload.orders.length > 0) {
                    // Transform Shopify orders to the format expected by upload-orders API
                    const transformedOrders = result.payload.orders.map((shopifyOrder: any, orderIndex: number) => {
                      // Extract and transform line items to match the expected format
                      const orderItems = shopifyOrder.lineItems?.edges?.map((edge: any, itemIndex: number) => ({
                        product_order_po: `SHOPIFY_P_${orderIndex}_${itemIndex}`,
                        product_qty: edge.node.quantity || 1,
                        product_sku: edge.node.sku || "",
                        product_title: edge.node.title || "",
                        product_guid: edge.node.variant?.product?.product_guid || crypto.randomUUID(),
                      })) || [];

                      // Get shipping address or fall back to billing address
                      const shippingAddr = shopifyOrder.shippingAddress || shopifyOrder.billingAddress || {};

                      // Transform to the expected order format
                      return {
                        order_po: `SHOPIFY_${shopifyOrder.name.replace('#', '')}`, // e.g., "SHOPIFY_1005"
                        order_key: shopifyOrder.id, // Shopify's unique order ID
                        recipient: {
                          first_name: shippingAddr.firstName || "",
                          last_name: shippingAddr.lastName || "",
                          company_name: shippingAddr.company || "",
                          address_1: shippingAddr.address1 || "",
                          address_2: shippingAddr.address2 || "",
                          address_3: "",
                          city: shippingAddr.city || "",
                          state_code: shippingAddr.provinceCode || "",
                          province: shippingAddr.province || "",
                          zip_postal_code: shippingAddr.zip || "",
                          country_code: shippingAddr.countryCodeV2 || "US",
                          phone: shippingAddr.phone || shopifyOrder.customer?.phone || "",
                          email: shopifyOrder.customer?.email || "",
                          address_order_po: "",
                        },
                        order_items: orderItems,
                        order_status: shopifyOrder.displayFulfillmentStatus === "UNFULFILLED" ? "Processing" : "Completed",
                        shipping_code: "GD", // Default shipping code, you may want to map this from Shopify shipping lines
                        test_mode: false, // Set based on your environment
                      };
                    });

                    const sendData = {
                      accountId: customerInfo?.data?.account_id,
                      payment_token: customerInfo?.data?.account_key,
                      orders: transformedOrders,
                    };


                    dispatch(saveShopifyOrder(sendData));

                    notification.success({
                      message: "Success",
                      description: `${result.payload.count} Shopify order(s) imported successfully`,
                    });

                    setTimeout(() => {
                      dispatch(resetSaveOrderInfo());
                      dispatch(resetImport());
                      dispatch(updateWporder('' as any));
                      navigate("/importlist");
                    }, 2000);
                  } else {
                    notification.warning({
                      message: "Warning",
                      description: result.payload.message || "No orders found for the selected criteria",
                    });
                    console.error("No orders in response:", result.payload);
                  }
                } else {
                  notification.error({
                    message: "Error",
                    description: "Failed to fetch Shopify orders",
                  });
                }
              } catch (error) {
                console.error("Error fetching Shopify orders:", error);
                notification.error({
                  message: "Error",
                  description: "An error occurred while fetching Shopify orders",
                });
              } finally {
                setNextSpinning(false);
              }
            }
          }
        }

        // ── Handle Squarespace orders ─────────────────────────────────────────
        else if (platformType === "Squarespace") {
          // Attempt to get token from localStorage first, then fallback to API connections
          let squarespaceToken: string =
            (localStorage.getItem('squarespace_token') ||
              localStorage.getItem('squarespace_access_token')) as string;
          let squarespaceRefreshToken = '';
          const accountKey = customerInfo?.data?.account_key || localStorage.getItem('squarespace_account_key');

          if (companyInfo?.data?.connections) {
            const sqConnection = companyInfo.data.connections.find(
              (conn: any) => conn.name === "Squarespace"
            );

            if (sqConnection && sqConnection.data) {
              try {
                const parsedData = JSON.parse(sqConnection.data);
                if (!squarespaceToken) {
                  squarespaceToken = parsedData.access_token || parsedData.token || sqConnection.id;
                }
                squarespaceRefreshToken = parsedData.refresh_token;
              } catch (e) {
                if (!squarespaceToken) squarespaceToken = sqConnection.id;
              }
            } else if (sqConnection && sqConnection.id && !squarespaceToken) {
              squarespaceToken = sqConnection.id;
            }
          }

          if (!squarespaceToken) {
            notification.error({
              message: 'Not Connected',
              description: 'No Squarespace token found. Please reconnect your store.',
            });
            setTimeout(() => navigate('/'), 1500);
            return;
          }

          setNextSpinning(true);

          let isTokenValid = true;
          try {
            // Validate token before fetching orders
            const validateRes = await fetch(`${BASE_URL}squarespace/validate-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: squarespaceToken })
            });
            const validateData = await validateRes.json();

            if (!validateRes.ok || validateData.valid === false || validateData.error || validateData?.message?.toLowerCase().includes("expired")) {
              isTokenValid = false;
            }
          } catch (e) {
            console.error("Error validating token", e);
            // Continue and let the actual API calls fail
          }

          if (!isTokenValid) {
            if (squarespaceRefreshToken && accountKey) {
              try {
                const refreshRes = await fetch(`${BASE_URL}squarespace/refresh-token`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ account_key: accountKey, refresh_token: squarespaceRefreshToken })
                });
                if (refreshRes.ok) {
                  const refreshData = await refreshRes.json();
                  // User said the system will be updated, but try to use the returned token if present
                  if (refreshData.access_token || refreshData.token) {
                    squarespaceToken = refreshData.access_token || refreshData.token;
                    localStorage.setItem('squarespace_token', squarespaceToken);
                  } else if (refreshData?.data?.access_token) {
                    squarespaceToken = refreshData.data.access_token;
                    localStorage.setItem('squarespace_token', squarespaceToken);
                  } else {
                    // If we don't get the new access token back, wait for the backend update
                    // and reload the window so the app will fetch the updated connections 
                    notification.info({
                      message: 'Token Refreshed',
                      description: 'Applying updated Squarespace authorization...'
                    });
                    dispatch(updateCompanyInfo(companyInfo)); // Reload company info
                    setTimeout(() => window.location.reload(), 1500);
                    return;
                  }
                } else {
                  throw new Error("Refresh token rejected");
                }
              } catch (e) {
                localStorage.removeItem('squarespace_token');
                localStorage.removeItem('squarespace_access_token');
                localStorage.removeItem('squarespace_account_key');
                notification.error({
                  message: 'Squarespace Token Expired',
                  description: 'Your Squarespace access token has expired and refresh failed. Please reconnect your store.',
                });
                dispatch(resetSquarespaceImportStatus());
                setTimeout(() => {
                  window.location.href = `${BASE_URL}squarespace/auth?account_key=${accountKey}`;
                }, 2000);
                setNextSpinning(false);
                return;
              }
            } else {
              localStorage.removeItem('squarespace_token');
              localStorage.removeItem('squarespace_access_token');
              localStorage.removeItem('squarespace_account_key');
              notification.error({
                message: 'Squarespace Token Expired',
                description: 'Your Squarespace access token has expired. Please reconnect your store.',
              });
              dispatch(resetSquarespaceImportStatus());
              setTimeout(() => {
                window.location.href = `${BASE_URL}squarespace/auth?account_key=${accountKey}`;
              }, 2000);
              setNextSpinning(false);
              return;
            }
          }

          // Check if user is trying to import by order number (single orders)
          if (wporder.length > 0) {
            const orderNames = wporder.split(",").map((name: string) => name.trim());

            try {
              const orderPromises = orderNames.map((orderName: string) =>
                dispatch(
                  fetchSquarespaceOrderByNumber({
                    access_token: squarespaceToken,
                    orderNumber: orderName,
                  })
                )
              );

              const results = await Promise.all(orderPromises);

              const allOrders: any[] = [];
              let hasErrors = false;
              let hasTokenExpired = false;

              results.forEach((result, index) => {
                const payload = result.payload as any;
                if (payload?.tokenExpired) {
                  hasTokenExpired = true;
                } else if (payload && (payload.id || payload.orderNumber || payload.lineItems)) {
                  allOrders.push(payload);
                } else if (payload && payload.order) {
                  allOrders.push(payload.order);
                } else if (payload && payload.orders && payload.orders.length > 0) {
                  allOrders.push(...payload.orders);
                } else {
                  hasErrors = true;
                  console.error(`Failed to fetch Squarespace order ${orderNames[index]}:`, payload);
                }
              });

              if (hasTokenExpired) {
                if (squarespaceRefreshToken && accountKey) {
                  // Ignore error since we tried validate-token earlier
                  notification.error({
                    message: 'Error fetching orders',
                    description: 'Failed to import. Please try again.',
                  });
                } else {
                  localStorage.removeItem('squarespace_token');
                  localStorage.removeItem('squarespace_account_key');
                  notification.error({
                    message: 'Squarespace Token Expired',
                    description: 'Your Squarespace access token has expired. Please reconnect your store.',
                  });
                  dispatch(resetSquarespaceImportStatus());
                  setTimeout(() => {
                    const redirectKey = customerInfo?.data?.account_key || localStorage.getItem('squarespace_account_key') || '';
                    window.location.href = `${BASE_URL}squarespace/auth?account_key=${redirectKey}`;
                  }, 2000);
                }
                return;
              }

              if (allOrders.length > 0) {
                // Transform Squarespace orders to Finerworks format
                const transformedOrders = allOrders.map((sqOrder: any, orderIndex: number) => {
                  const addr = sqOrder.shippingAddress || sqOrder.billingAddress || {};
                  const lineItems: any[] = sqOrder.lineItems || sqOrder.order_items || [];

                  return {
                    order_po: `${sqOrder.orderNumber || sqOrder.id || orderIndex}`,
                    order_key: sqOrder.id || '',
                    source: sqOrder.channelName || 'squarespace',
                    recipient: {
                      first_name: addr.firstName || addr.first_name || '',
                      last_name: addr.lastName || addr.last_name || '',
                      company_name: addr.company || addr.company_name || '',
                      address_1: addr.address1 || addr.address_1 || '',
                      address_2: addr.address2 || addr.address_2 || '',
                      address_3: '',
                      city: addr.city || '',
                      state_code: addr.state || addr.state_code || '',
                      province: addr.state || '',
                      zip_postal_code: addr.zip || addr.postalCode || '',
                      country_code: addr.countryCode || addr.country_code || 'US',
                      phone: addr.phone || sqOrder.customerEmail || '',
                      email: sqOrder.customerEmail || '',
                      address_order_po: '',
                    },
                    order_items: lineItems.map((item: any, itemIndex: number) => ({
                      product_order_po: `SQ_P_${orderIndex}_${itemIndex}`,
                      product_qty: item.quantity || 1,
                      product_sku: item.sku || item.variantId || '',
                      product_title: item.productName || item.name || '',
                      product_guid: item.variantId || crypto.randomUUID(),
                    })),
                    order_status: 'Processing',
                    shipping_code: 'GD',
                    test_mode: false,
                  };
                });

                const sendData = {
                  accountId: customerInfo?.data?.account_id,
                  payment_token: customerInfo?.data?.account_key,
                  orders: transformedOrders,
                };

                dispatch(saveShopifyOrder(sendData));

                notification.success({
                  message: 'Success',
                  description: `${transformedOrders.length} Squarespace order(s) imported successfully${hasErrors ? ' (some failed)' : ''}`,
                });

                setTimeout(() => {
                  dispatch(resetSaveOrderInfo());
                  dispatch(resetImport());
                  dispatch(updateWporder('' as any));
                  navigate('/importlist');
                }, 2000);
              } else {
                notification.error({
                  message: 'Error',
                  description: 'Failed to fetch any specified Squarespace orders.',
                });
              }
            } catch (error) {
              console.error("Error fetching Squarespace orders by number:", error);
              notification.error({
                message: "Error",
                description: "An error occurred while fetching Squarespace order details",
              });
            } finally {
              setNextSpinning(false);
            }
          }
          // Require date range for bulk import
          else if (!myImport?.start_date || !myImport?.end_date) {
            notification.warning({
              message: 'Missing Information',
              description: 'Please select a start and end date to import Squarespace orders.',
            });
            return;
          } else {
            try {
              const startISO = `${myImport.start_date}T00:00:00Z`;
              const endISO = `${myImport.end_date}T23:59:59Z`;

              const result = await dispatch(
                fetchSquarespaceOrders({
                  access_token: squarespaceToken,
                  startDate: startISO,
                  endDate: endISO,
                  fulfillmentStatus: myImport.status || 'PENDING',
                })
              );

              // Token expired — clear stored credentials and redirect to reconnect
              if ((result.payload as any)?.tokenExpired) {
                if (squarespaceRefreshToken && accountKey) {
                  notification.error({
                    message: 'Error fetching orders',
                    description: 'Failed to import. Please try again.',
                  });
                } else {
                  localStorage.removeItem('squarespace_token');
                  localStorage.removeItem('squarespace_account_key');
                  notification.error({
                    message: 'Squarespace Token Expired',
                    description: 'Your Squarespace access token has expired. Please reconnect your store.',
                  });
                  dispatch(resetSquarespaceImportStatus());
                  setTimeout(() => {
                    const redirectKey =
                      customerInfo?.data?.account_key ||
                      localStorage.getItem('squarespace_account_key') ||
                      '';
                    window.location.href = `${BASE_URL}squarespace/auth?account_key=${redirectKey}`;
                  }, 2000);
                }
                return;
              }

              const payload = result.payload as any;

              if (payload?.orders && payload.orders.length > 0) {
                // Transform Squarespace orders to Finerworks format
                const transformedOrders = payload.orders.map(
                  (sqOrder: any, orderIndex: number) => {
                    const addr = sqOrder.shippingAddress || sqOrder.billingAddress || {};
                    const lineItems: any[] = sqOrder.lineItems || sqOrder.order_items || [];
                    console.log(sqOrder, 'addr')

                    return {
                      order_po: `${sqOrder.orderNumber || sqOrder.id || orderIndex}`,
                      order_key: sqOrder.id || '',
                      source: sqOrder.channelName || 'squarespace',
                      recipient: {
                        first_name: addr.firstName || addr.first_name || '',
                        last_name: addr.lastName || addr.last_name || '',
                        company_name: addr.company || addr.company_name || '',
                        address_1: addr.address1 || addr.address_1 || '',
                        address_2: addr.address2 || addr.address_2 || '',
                        address_3: '',
                        city: addr.city || '',
                        state_code: addr.state || addr.state_code || '',
                        province: addr.state || '',
                        zip_postal_code: addr.zip || addr.postalCode || '',
                        country_code: addr.countryCode || addr.country_code || 'US',
                        phone: addr.phone || sqOrder.customerEmail || '',
                        email: sqOrder.customerEmail || '',
                        address_order_po: '',
                      },
                      order_items: lineItems.map((item: any, itemIndex: number) => ({
                        product_order_po: `SQ_P_${orderIndex}_${itemIndex}`,
                        product_qty: item.quantity || 1,
                        product_sku: item.sku || item.variantId || '',
                        product_title: item.productName || item.name || '',
                        product_guid: item.variantId || crypto.randomUUID(),
                      })),
                      order_status: 'Processing',
                      shipping_code: 'GD',
                      test_mode: false,
                    };
                  }
                );

                const sendData = {
                  accountId: customerInfo?.data?.account_id,
                  payment_token: customerInfo?.data?.account_key,
                  orders: transformedOrders,
                };

                dispatch(saveShopifyOrder(sendData)); // reuse the generic save endpoint

                notification.success({
                  message: 'Success',
                  description: `${transformedOrders.length} Squarespace order(s) imported successfully`,
                });

                setTimeout(() => {
                  dispatch(resetSaveOrderInfo());
                  dispatch(resetImport());
                  dispatch(updateWporder('' as any));
                  navigate('/importlist');
                }, 2000);
              } else {
                notification.warning({
                  message: 'No Orders Found',
                  description:
                    payload?.message ||
                    'No Squarespace orders matched the selected criteria.',
                });
              }
            } catch (error) {
              console.error('Error fetching Squarespace orders:', error);
              notification.error({
                message: 'Error',
                description: 'An error occurred while fetching Squarespace orders.',
              });
            } finally {
              setNextSpinning(false);
            }
          }
        }

        // Handle WooCommerce orders
        else if (platformType === "WooCommerce") {
          if (wporder.length > 0) {
            setNextSpinning(true);
            const orderIds = wporder.split(",");

            try {
              const result = await dispatch(
                fetchWporder({
                  orderId: orderIds,
                  platformName: "woocommerce",
                  accountId: customerInfo?.data?.account_id,
                  domainName: wordpressConnectionId,
                })
              );

              if (result.payload) {
                if (result.payload.orderDetails) {
                  const orderDetails = result.payload.orderDetails.map(
                    (order: any) => ({
                      orders: order.orders.map((order: any) => ({
                        order: order,
                      })),
                    })
                  );

                  let sendData = {
                    orders: orderDetails.map(
                      (order: any) => order.orders[0]?.order
                    ),
                    accountId: result.payload.orderDetails[0].accountId,
                    payment_token: result.payload.orderDetails[0].payment_token,
                  };
                  dispatch(saveOrder(sendData));
                  notification.success({
                    message: "Success",
                    description: "Order imported successfully",
                  });
                  setTimeout(() => {
                    navigate("/importlist");
                  }, 2000);
                } else {
                  notification.warning({
                    message: "Warning",
                    description: result.payload.message,
                  });
                  console.error("Invalid payload format:", result.payload);
                }
              } else {
                notification.error({
                  message: "Error",
                  description: "Failed to fetch order details",
                });
              }
            } catch (error) {
              console.error("Error fetching WP order:", error);
              notification.error({
                message: "Error",
                description: "An error occurred while fetching order details",
              });
            } finally {
              setNextSpinning(false);
            }
          } else if (
            myImport?.start_date ||
            myImport?.end_date ||
            myImport?.status
          ) {
            setNextSpinning(true);
            await dispatch(
              getImportOrders({
                account_key: customerInfo?.data?.account_id,
                domainName: wordpressConnectionId,
                ...myImport,
              })
            );
          }
        }

        // ── Handle Wix orders ────────────────────────────────────────────────
        else if (platformType === "Wix") {
          // Resolve Wix credentials from companyInfo connections
          let wixAccessToken = '';
          const wixAccountKey = customerInfo?.data?.account_key || '';

          if (companyInfo?.data?.connections) {
            const wixConnection = companyInfo.data.connections.find(
              (conn: any) => conn.name === 'Wix'
            );
            if (wixConnection?.data) {
              try {
                const parsed = JSON.parse(wixConnection.data);
                wixAccessToken = parsed.access_token || '';
              } catch {
                wixAccessToken = wixConnection.id || '';
              }
            } else if (wixConnection?.id) {
              wixAccessToken = wixConnection.id;
            }
          }

          if (!wixAccessToken || !wixAccountKey) {
            notification.error({
              message: 'Not Connected',
              description: 'No Wix credentials found. Please reconnect your store.',
            });
            setTimeout(() => navigate('/'), 1500);
            return;
          }

          setNextSpinning(true);

          // ── Import by order number (individual orders) ──
          if (wporder.length > 0) {
            const orderNumbers = wporder.split(',').map((n: string) => n.trim());

            try {
              const result = await dispatch(
                fetchWixOrderByNumber({
                  account_key: wixAccountKey,
                  access_token: wixAccessToken,
                  order_numbers: orderNumbers,
                })
              );

              const payload = result.payload as any;
              const rawOrders: any[] =
                Array.isArray(payload?.orders) ? payload.orders
                  : Array.isArray(payload) ? payload
                    : payload?.order ? [payload.order]
                      : [];

              if (rawOrders.length > 0) {
                const transformedOrders = rawOrders.map((wixOrder: any, orderIndex: number) => {
                  const addr =
                    wixOrder.shippingInfo?.shipmentDetails?.address ||
                    wixOrder.billingInfo?.address ||
                    {};
                  const lineItems: any[] = wixOrder.lineItems || [];

                  return {
                    order_po: `WIX_${wixOrder.number || wixOrder.id || orderIndex}`,
                    order_key: wixOrder.id || '',
                    source: 'wix',
                    recipient: {
                      first_name: addr.firstName || addr.first_name || wixOrder.billingInfo?.contactDetails?.firstName || '',
                      last_name: addr.lastName || addr.last_name || wixOrder.billingInfo?.contactDetails?.lastName || '',
                      company_name: addr.company || addr.company_name || '',
                      address_1: addr.addressLine || addr.address1 || addr.address_1 || '',
                      address_2: addr.addressLine2 || addr.address2 || addr.address_2 || '',
                      address_3: '',
                      city: addr.city || '',
                      state_code: addr.subdivision || addr.state_code || '',
                      province: addr.subdivision || '',
                      zip_postal_code: addr.postalCode || addr.zipCode || '',
                      country_code: addr.country || addr.country_code || 'US',
                      phone: wixOrder.billingInfo?.contactDetails?.phone || '',
                      email: wixOrder.buyerInfo?.email || '',
                      address_order_po: '',
                    },
                    order_items: lineItems.map((item: any, itemIndex: number) => ({
                      product_order_po: `WIX_P_${orderIndex}_${itemIndex}`,
                      product_qty: item.quantity || 1,
                      product_sku: item.catalogReference?.catalogItemId || item.sku || '',
                      product_title: item.productName?.original || item.name || '',
                      product_guid: item.id || crypto.randomUUID(),
                    })),
                    order_status: 'Processing',
                    shipping_code: 'GD',
                    test_mode: false,
                  };
                });

                const sendData = {
                  accountId: customerInfo?.data?.account_id,
                  payment_token: customerInfo?.data?.account_key,
                  orders: transformedOrders,
                };

                dispatch(saveShopifyOrder(sendData));

                notification.success({
                  message: 'Success',
                  description: `${transformedOrders.length} Wix order(s) imported successfully`,
                });

                setTimeout(() => {
                  dispatch(resetSaveOrderInfo());
                  dispatch(resetImport());
                  dispatch(updateWporder('' as any));
                  navigate('/importlist');
                }, 2000);
              } else {
                notification.error({
                  message: 'Error',
                  description: 'Failed to fetch the specified Wix order(s). Please check the order numbers.',
                });
              }
            } catch (error) {
              console.error('Error fetching Wix orders by number:', error);
              notification.error({
                message: 'Error',
                description: 'An error occurred while fetching Wix order details.',
              });
            } finally {
              setNextSpinning(false);
            }
          }

          // ── Import by date range (bulk orders) ──
          else if (!myImport?.start_date || !myImport?.end_date) {
            notification.warning({
              message: 'Missing Information',
              description: 'Please select a start and end date to import Wix orders.',
            });
            setNextSpinning(false);
          } else {
            try {
              const result = await dispatch(
                fetchWixOrders({
                  account_key: wixAccountKey,
                  access_token: wixAccessToken,
                  start_date: myImport.start_date,
                  end_date: myImport.end_date,
                  fulfillmentStatus: myImport.status,
                })
              );

              const payload = result.payload as any;
              const rawOrders: any[] =
                Array.isArray(payload?.orders) ? payload.orders
                  : Array.isArray(payload) ? payload
                    : [];

              if (rawOrders.length > 0) {
                const transformedOrders = rawOrders.map((wixOrder: any, orderIndex: number) => {
                  const addr =
                    wixOrder.shippingInfo?.shipmentDetails?.address ||
                    wixOrder.billingInfo?.address ||
                    {};
                  const lineItems: any[] = wixOrder.lineItems || [];

                  return {
                    order_po: `WIX_${wixOrder.number || wixOrder.id || orderIndex}`,
                    order_key: wixOrder.id || '',
                    source: 'wix',
                    recipient: {
                      first_name: addr.firstName || addr.first_name || wixOrder.billingInfo?.contactDetails?.firstName || '',
                      last_name: addr.lastName || addr.last_name || wixOrder.billingInfo?.contactDetails?.lastName || '',
                      company_name: addr.company || addr.company_name || '',
                      address_1: addr.addressLine || addr.address1 || addr.address_1 || '',
                      address_2: addr.addressLine2 || addr.address2 || addr.address_2 || '',
                      address_3: '',
                      city: addr.city || '',
                      state_code: addr.subdivision || addr.state_code || '',
                      province: addr.subdivision || '',
                      zip_postal_code: addr.postalCode || addr.zipCode || '',
                      country_code: addr.country || addr.country_code || 'US',
                      phone: wixOrder.billingInfo?.contactDetails?.phone || '',
                      email: wixOrder.buyerInfo?.email || '',
                      address_order_po: '',
                    },
                    order_items: lineItems.map((item: any, itemIndex: number) => ({
                      product_order_po: `WIX_P_${orderIndex}_${itemIndex}`,
                      product_qty: item.quantity || 1,
                      product_sku: item.catalogReference?.catalogItemId || item.sku || '',
                      product_title: item.productName?.original || item.name || '',
                      product_guid: item.id || crypto.randomUUID(),
                    })),
                    order_status: 'Processing',
                    shipping_code: 'GD',
                    test_mode: false,
                  };
                });

                const sendData = {
                  accountId: customerInfo?.data?.account_id,
                  payment_token: customerInfo?.data?.account_key,
                  orders: transformedOrders,
                };

                dispatch(saveShopifyOrder(sendData));

                notification.success({
                  message: 'Success',
                  description: `${transformedOrders.length} Wix order(s) imported successfully`,
                });

                setTimeout(() => {
                  dispatch(resetSaveOrderInfo());
                  dispatch(resetImport());
                  dispatch(updateWporder('' as any));
                  navigate('/importlist');
                }, 2000);
              } else {
                notification.warning({
                  message: 'No Orders Found',
                  description: payload?.message || 'No Wix orders matched the selected date range.',
                });
              }
            } catch (error) {
              console.error('Error fetching Wix orders:', error);
              notification.error({
                message: 'Error',
                description: 'An error occurred while fetching Wix orders.',
              });
            } finally {
              setNextSpinning(false);
            }
          }
        }

        // ── Handle Etsy / Shippo orders ─────────────────────────────────────────
        else if (platformType === 'Etsy') {
          // The Shippo orders API needs the FinerWorks account_key — the backend
          // uses it to look up the Shippo credentials stored for this account.
          // Priority: Redux (set from companyInfo.connections) → companyInfo fallback → customerInfo

          // 1. Try Redux (set by Landing.tsx when it detects isConnected: true)
          let resolvedShippoKey: string = shippoAccountKey || '';

          // 2. Fallback: parse companyInfo.connections directly
          //    Connection is stored as name: "Shippo" (id: null, keys in data field)
          if (!resolvedShippoKey && companyInfo?.data?.connections) {
            const etsyConn = companyInfo.data.connections.find(
              (c: any) => c.name === 'Shippo' || c.name === 'Etsy'
            );
            if (etsyConn?.data) {
              try {
                const parsed = JSON.parse(etsyConn.data);
                // The data field stores live_key/test_key but NOT the FW account_key
                // — use the connection id if non-null, otherwise fall through
                resolvedShippoKey = parsed.account_key || etsyConn.id || '';
              } catch {
                resolvedShippoKey = etsyConn.id || '';
              }
            } else if (etsyConn?.id) {
              resolvedShippoKey = etsyConn.id;
            }
          }

          // 3. Final fallback: the FinerWorks account_key from customerInfo
          //    This is the correct value for the /api/shippo/orders endpoint
          if (!resolvedShippoKey) {
            resolvedShippoKey = customerInfo?.data?.account_key || '';
          }

          if (!resolvedShippoKey) {
            notification.error({
              message: 'Not Connected',
              description: 'No Shippo credentials found. Please reconnect your Etsy store.',
            });
            setTimeout(() => navigate('/'), 1500);
            return;
          }

          // Determine status filter — default to PAID
          const shippoStatus = myImport?.status || 'PAID';

          setNextSpinning(true);

          try {
            const result = await dispatch(
              fetchShippoOrders({
                account_key: resolvedShippoKey,
                status: shippoStatus,
                page: 1,
                results: 25,
              })
            );

            const payload = result.payload as any;

            // Handle various response shapes from the Shippo API.
            // The backend may wrap the Shippo response differently, so we
            // try every known key before giving up.
            const rawOrders: any[] =
              Array.isArray(payload?.orders) ? payload.orders
                : Array.isArray(payload?.results) ? payload.results
                  : Array.isArray(payload?.data) ? payload.data
                    : Array.isArray(payload) ? payload
                      : [];

            if (rawOrders.length > 0) {
              const transformedOrders = rawOrders.map((shippoOrder: any, orderIndex: number) => {
                // Shippo order structure: order.to_address for shipping, order.line_items for items
                const addr = shippoOrder.to_address || {};
                const lineItems: any[] = shippoOrder.line_items || [];

                return {
                  order_po: String(shippoOrder.order_number || shippoOrder.object_id || orderIndex).replace(/^ETSY[-_]?/i, ''),
                  order_key: shippoOrder.object_id || '',
                  source: 'etsy',
                  recipient: {
                    first_name: addr.name?.split(' ')[0] || addr.first_name || '',
                    last_name: addr.name?.split(' ').slice(1).join(' ') || addr.last_name || '',
                    company_name: addr.company || addr.company_name || '',
                    address_1: addr.street1 || addr.address1 || addr.address_1 || '',
                    address_2: addr.street2 || addr.address2 || addr.address_2 || '',
                    address_3: '',
                    city: addr.city || '',
                    state_code: addr.state || addr.state_code || '',
                    province: addr.state || '',
                    zip_postal_code: addr.zip || addr.postal_code || '',
                    country_code: addr.country || addr.country_code || 'US',
                    phone: addr.phone || '',
                    email: shippoOrder.to_email || shippoOrder.buyer_email || '',
                    address_order_po: '',
                  },
                  order_items: lineItems.map((item: any, itemIndex: number) => ({
                    product_order_po: `ETSY_P_${orderIndex}_${itemIndex}`,
                    product_qty: item.quantity || 1,
                    product_sku: item.sku || '',
                    product_title: item.title || item.description || '',
                    product_guid: item.object_id || crypto.randomUUID(),
                  })),
                  order_status: 'Processing',
                  shipping_code: 'GD',
                  test_mode: false,
                };
              });

              const sendData = {
                accountId: customerInfo?.data?.account_id,
                payment_token: customerInfo?.data?.account_key,
                orders: transformedOrders,
              };

              const saveResult = await dispatch(saveShopifyOrder(sendData));
              console.log('[Etsy] saveShopifyOrder result:', saveResult);

              if ((saveResult as any).meta?.requestStatus === 'rejected') {
                notification.error({
                  message: 'Upload Failed',
                  description: 'Orders were fetched from Etsy but could not be uploaded to pending orders. Please try again.',
                });
                return;
              }

              notification.success({
                message: 'Success',
                description: `${transformedOrders.length} Etsy order(s) imported successfully`,
              });

              setTimeout(() => {
                dispatch(resetSaveOrderInfo());
                dispatch(resetImport());
                dispatch(updateWporder('' as any));
                navigate('/importlist');
              }, 2000);
            } else {
              // Log the full payload so we can diagnose unexpected response shapes
              console.warn('[Etsy] No orders extracted from Shippo payload:', payload);
              notification.warning({
                message: 'No Orders Found',
                description:
                  (payload as any)?.message ||
                  `No Etsy (Shippo) orders found with status "${shippoStatus}".`,
              });
            }
          } catch (error) {
            console.error('Error fetching Etsy/Shippo orders:', error);
            notification.error({
              message: 'Error',
              description: 'An error occurred while fetching Etsy orders.',
            });
          } finally {
            dispatch(resetShippoImportStatus());
            setNextSpinning(false);
          }
        }

        // ── Handle Square orders ────────────────────────────────────────────────
        else if (platformType === 'Square') {
          const accountKey = customerInfo?.data?.account_key || '';

          if (!accountKey) {
            notification.error({
              message: 'Not Connected',
              description: 'No Square credentials found. Please reconnect your Square store.',
            });
            setTimeout(() => navigate('/'), 1500);
            return;
          }

          setNextSpinning(true);

          try {
            const result = await dispatch(
              fetchSquareOrders({
                account_key: accountKey,
                start_date: myImport?.start_date,
                end_date: myImport?.end_date,
                status: myImport?.status,
              })
            );

            const payload = result.payload as any;

            // Square API may return { orders: [...] } or { items: [...] } or a plain array
            const rawOrders: any[] =
              Array.isArray(payload?.orders) ? payload.orders
                : Array.isArray(payload?.items) ? payload.items
                  : Array.isArray(payload?.data) ? payload.data
                    : Array.isArray(payload) ? payload
                      : [];

            if (rawOrders.length > 0) {
              const transformedOrders = rawOrders.map((sqOrder: any, orderIndex: number) => {
                // Square order structure uses fulfillments for shipping address
                const fulfillment = sqOrder.fulfillments?.[0] || {};
                const addr = fulfillment.shipment_details?.recipient?.address
                  || sqOrder.shipping_address
                  || {};
                const recipient = fulfillment.shipment_details?.recipient || {};
                const lineItems: any[] = sqOrder.line_items || sqOrder.lineItems || [];

                return {
                  order_po: `SQUARE_${sqOrder.id || orderIndex}`,
                  order_key: sqOrder.id || '',
                  source: 'square',
                  recipient: {
                    first_name: recipient.display_name?.split(' ')[0] || addr.first_name || '',
                    last_name: recipient.display_name?.split(' ').slice(1).join(' ') || addr.last_name || '',
                    company_name: addr.company || '',
                    address_1: addr.address_line_1 || addr.street1 || '',
                    address_2: addr.address_line_2 || addr.street2 || '',
                    address_3: '',
                    city: addr.locality || addr.city || '',
                    state_code: addr.administrative_district_level_1 || addr.state || '',
                    province: addr.administrative_district_level_1 || '',
                    zip_postal_code: addr.postal_code || addr.zip || '',
                    country_code: addr.country || 'US',
                    phone: recipient.phone_number || sqOrder.customer?.phone_number || '',
                    email: recipient.email_address || sqOrder.customer?.email_address || '',
                    address_order_po: '',
                  },
                  order_items: lineItems.map((item: any, itemIndex: number) => ({
                    product_order_po: `SQUARE_P_${orderIndex}_${itemIndex}`,
                    product_qty: item.quantity ? parseInt(item.quantity, 10) : 1,
                    product_sku: item.catalog_object_id || item.sku || '',
                    product_title: item.name || item.title || '',
                    product_guid: item.uid || item.id || crypto.randomUUID(),
                  })),
                  order_status: 'Processing',
                  shipping_code: 'GD',
                  test_mode: false,
                };
              });

              const sendData = {
                accountId: customerInfo?.data?.account_id,
                payment_token: customerInfo?.data?.account_key,
                orders: transformedOrders,
              };

              const saveResult = await dispatch(saveShopifyOrder(sendData));
              console.log('[Square] saveShopifyOrder result:', saveResult);

              if ((saveResult as any).meta?.requestStatus === 'rejected') {
                notification.error({
                  message: 'Upload Failed',
                  description: 'Orders were fetched from Square but could not be uploaded to pending orders. Please try again.',
                });
                return;
              }

              notification.success({
                message: 'Success',
                description: `${transformedOrders.length} Square order(s) imported successfully`,
              });

              setTimeout(() => {
                dispatch(resetSaveOrderInfo());
                dispatch(resetImport());
                dispatch(updateWporder('' as any));
                navigate('/importlist');
              }, 2000);
            } else {
              console.warn('[Square] No orders extracted from Square payload:', payload);
              notification.warning({
                message: 'No Orders Found',
                description:
                  (payload as any)?.message ||
                  'No Square orders matched the selected criteria.',
              });
            }
          } catch (error) {
            console.error('Error fetching Square orders:', error);
            notification.error({
              message: 'Error',
              description: 'An error occurred while fetching Square orders.',
            });
          } finally {
            dispatch(resetSquareImportStatus());
            setNextSpinning(false);
          }
        }
      }

      if (location.pathname === "/billingaddress") {
        if (
          myBillingInfoFilled.billing_info &&
          !isNaN(myBillingInfoFilled.billing_info.zip_postal_code)
        ) {
          setNextSpinning(true);
          await dispatch(updateCompanyInfo(myBillingInfoFilled));
          navigate("/shippingpreference");
        } else {
          alert("Billing info missing");
        }
      }
      if (location.pathname === "/shippingpreference") {
        if (shipping_preferences?.length) {
          setNextSpinning(true);
          await dispatch(updateCompanyInfo({ shipping_preferences }));
          notification.success({
            message: "Success",
            description: "Information has been saved",
          });
          navigate("/importlist");
        } else {
          alert("Shipping info missing");
        }
      }

      if (location.pathname === "/importlist" && checkedOrders.length) {
        navigate("/checkout");
      }

      if (
        location.pathname.includes("/editorder") &&
        !orderEdited.clicked &&
        updatedValues
      ) {
        try {
          // Log customer info for debugging

          // Make sure updatedValues is proper format
          if (
            !updatedValues.recipient &&
            Object.keys(updatedValues).length === 0
          ) {
            console.error("No updated values to send");
            openNotificationWithIcon({
              type: "error",
              message: "Error",
              description: "No data to update. Please make changes first.",
            });
            return;
          }

          // Create a properly formatted data object
          const result = await dispatch(
            updateOrdersInfo([
              updatedValues, // The order with updates
              { customerId: customerInfo?.data?.account_id }, // Customer ID in expected format
            ])
          );

          // Check if successful
          if (result.meta.requestStatus === "fulfilled") {
            dispatch(updateOrderStatus({ status: true, clicked: true }));
            if (updatedValues?.order_po) {
              dispatch(clearOrderErrors(updatedValues.order_po));
            }
          } else {
            console.error("Failed to update order:", result.payload);
            openNotificationWithIcon({
              type: "error",
              message: "Error",
              description: "Failed to update order information",
            });
          }
        } catch (error) {
          console.error("Error dispatching updateOrdersInfo:", error);
          openNotificationWithIcon({
            type: "error",
            message: "Error",
            description: "An error occurred while updating order",
          });
        }
      }
    } catch (error) {
      console.error("Error in onNextHandler:", error);
      notification.error({
        message: "Error",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setNextSpinning(false); // Ensure this is reset
    }
  };

  // useEffect(() => {
  //   if (recipientStatus === "succeeded") {
  //     openNotificationWithIcon({
  //       type: "success",
  //       message: "Success",
  //       description: "Information has been updated",
  //     });
  //     dispatch(resetRecipientStatus());
  //     setNextVisiable(false);
  //   }
  // }, [recipientStatus]);

  const onDeleteHandler = () => { };

  const onBackHandler = () => {
    if (location.pathname.startsWith("/editorder/")) {
      navigate("/importlist");
      return;
    }

    switch (location.pathname) {
      case "/billingaddress":
        navigate("/mycompany");
        break;
      case "/paymentaddress":
        navigate("/billingaddress");
        break;
      case "/shippingpreference":
        navigate("/billingaddress");
        break;
      case "/importlist":
        navigate("/");
        break;
      case "/checkout":
        navigate("/importlist");
        break;
      default:
        navigate("/");
        break;
    }
  };

  const onDownloadHandler = () => { };
  useEffect(() => {
    if (
      myCompanyInfoFilled?.business_info &&
      !isNaN(myCompanyInfoFilled?.business_info?.zip_postal_code) &&
      !isNaN(myCompanyInfoFilled?.business_info?.phone)
    ) {
      !nextVisiable && setNextVisiable(true);
    } else {
      nextVisiable && setNextVisiable(false);
    }
  }, [myCompanyInfoFilled]);

  useEffect(() => {
    if (
      myBillingInfoFilled.billing_info &&
      !isNaN(myBillingInfoFilled.billing_info.zip_postal_code)
    ) {
      !nextVisiable && setNextVisiable(true);
    } else {
      nextVisiable && setNextVisiable(false);
    }
  }, [myBillingInfoFilled]);

  useEffect(() => {
    if (location.pathname === "/importfilter") {
      !nextVisiable && setNextVisiable(true);
    }
  }, [myImport, wporder, nextVisiable, location]);

  useEffect(() => {
    if (location.pathname === "/importfilter") {
      if (myImport?.start_date || myImport?.end_date || myImport?.status) {
        if (ecommerceGetImportOrders?.accountId) {
          if (!ecommerceGetImportOrders?.orders?.length) {
            openNotificationWithIcon({
              type: "error",
              message: "Error",
              description:
                "We couldn't find any records matching your search criteria. Please check the information you've entered and try again.",
            });

            setNextSpinning(false);
            !nextVisiable && setNextVisiable(true);
          } else {
            // Check if any of the new orders are already imported
            const alreadyImportedOrders =
              ecommerceGetImportOrders?.orders?.filter((importOrder: any) => {
                return orders?.data?.some((existingOrder: any) => {
                  return existingOrder.order_po === importOrder.order_po;
                });
              });

            // Get only new orders that aren't already imported
            const newOrders = ecommerceGetImportOrders?.orders?.filter(
              (importOrder: any) => {
                return !orders?.data?.some((existingOrder: any) => {
                  return existingOrder.order_po === importOrder.order_po;
                });
              }
            );

            if (alreadyImportedOrders?.length > 0 && newOrders?.length > 0) {
              // Some orders already imported, but we have new ones to import
              openNotificationWithIcon({
                type: "info",
                message: "Partial Import",
                description: `${alreadyImportedOrders.length} order(s) already exist in the system. Importing ${newOrders.length} new order(s).`,
              });

              // Create a modified version of ecommerceGetImportOrders with only the new orders
              const filteredImportData = {
                ...ecommerceGetImportOrders,
                orders: newOrders,
              };

              // Import only the new orders
              dispatch(saveOrder(filteredImportData));
              // Reset ecommerceGetImportOrders to prevent re-triggering
              dispatch(resetEcommerceGetImportOrders());
            } else if (
              alreadyImportedOrders?.length > 0 &&
              newOrders?.length === 0
            ) {
              // All orders are already imported
              openNotificationWithIcon({
                type: "warning",
                message: "Already Imported",
                description:
                  "All selected orders are already imported into the system.",
              });
              // Reset states before navigating to prevent re-triggering on return
              dispatch(resetEcommerceGetImportOrders());
              dispatch(resetImport());
              navigate("/importlist");
            } else {
              // No duplicates found, proceed with normal import
              dispatch(saveOrder(ecommerceGetImportOrders));
              // Reset ecommerceGetImportOrders to prevent re-triggering
              dispatch(resetEcommerceGetImportOrders());
            }
          }
        } else if (
          ecommerceGetImportOrders?.data?.status === 400 ||
          ecommerceGetImportOrders?.data?.status >= 500
        ) {
          openNotificationWithIcon({
            type: "error",
            message: "Error",
            description: ecommerceGetImportOrders?.message
              ? ecommerceGetImportOrders?.message
              : "Something went wrong",
          });
          setNextSpinning(false);
          !nextVisiable && setNextVisiable(true);
        } else {
          nextVisiable && setNextVisiable(false);
        }
      }
    }
  }, [ecommerceGetImportOrders]);

  useEffect(() => {
    if (location.pathname === "/importfilter") {
      if (myImport?.start_date || myImport?.end_date || myImport?.status) {
        if (saveOrderInfo?.statusCode === 200) {
          // Note: Platform-specific functions (Shopify, Etsy, Wix, etc.) 
          // manually display success notifications and navigate after a timeout.
          // We no longer trigger a duplicate notification or early navigation here.
        } else if (saveOrderInfo?.statusCode === 400) {
          openNotificationWithIcon({
            type: "error",
            message: "Error",
            description: saveOrderInfo.message,
          });
          setNextSpinning(false);
          !nextVisiable && setNextVisiable(true);
          // Also reset on error so user can try again
          dispatch(resetSaveOrderInfo());
        } else {
          nextVisiable && setNextVisiable(false);
        }
      }
    }
  }, [saveOrderInfo]);

  useEffect(() => {
    if (location.pathname === "/shippingpreference") {
      setNextVisiable(true);
    }
  }, [companyInfo, location.pathname]);

  useEffect(() => {
    if (
      companyInfo?.data?.account_id &&
      nextVisiable &&
      location.pathname !== "/shippingpreference" &&
      !location.pathname.includes("/editorder") &&
      location.pathname !== "/importlist" &&
      location.pathname !== "/importfilter" &&
      location.pathname !== "/mycompany" &&
      location.pathname !== "/billingaddress" &&
      location.pathname !== "/confirmation"
    ) {
      // if (location.pathname === "/paymentaddress")
      //   navigate('/')
      setNextSpinning(false);
      setNextVisiable(false);
      // openNotificationWithIcon({
      //   type: "success",
      //   message: "Success",
      //   description: "Information has been saved",
      // });
    } else if (companyInfo?.statusCode === 400) {
      setNextSpinning(false);
      setNextVisiable(false);
      openNotificationWithIcon({
        type: "error",
        message: "Error",
        description: "Something went wrong",
      });
    }
  }, [companyInfo, location.pathname, nextVisiable]);

  useEffect(() => {
    if (!pathNameAvoidBackButton.includes(location.pathname)) {
      dispatch(updateCompanyInfo({}));
    }
  }, []);


  useEffect(() => {
    if (orders && checkedOrders) {
      let newTotalPrice = 0;

      checkedOrders?.forEach((order: any) => {
        const product = orders?.data?.find(
          (product: any) => product?.order_po == order?.order_po
        );

        if (product) {
          const price = order.Product_price?.grand_total ?? order.Product_price?.credit_charge ?? 0;
          newTotalPrice += Number(price) || 0;
        }
      });
      setGrandtotal(newTotalPrice);
    }
  }, [checkedOrders, orders]);

  useEffect(() => {
    if (
      location.pathname.includes("/editorder") &&
      orderEdited.status === true
    ) {
      setNextVisiable(true);
    } else if (
      location.pathname.includes("/editorder") &&
      orderEdited.status === false
    ) {
      setNextVisiable(false);
    }
  }, [location.pathname, orderEdited.status]);

  useEffect(() => {
    if (location.pathname === "/importlist" && checkedOrders.length) {
      setNextVisiable(true);
      // product_details?.totalPrice && setGrandtotal(product_details?.totalPrice);
    } else if (location.pathname === "/importlist" && !checkedOrders.length) {
      setNextVisiable(false);
    }
  }, [location.pathname, checkedOrders, product_details?.totalPrice]);

  useEffect(() => {
    if (
      location.pathname === "/mycompany" &&
      myCompanyInfoFilled?.validFields &&
      Object?.keys(myCompanyInfoFilled?.validFields)?.length === 0
    ) {
      setNextVisiable(true);
    } else if (
      location.pathname === "/mycompany" &&
      myCompanyInfoFilled?.validFields &&
      Object?.keys(myCompanyInfoFilled?.validFields)?.length > 0
    ) {
      setNextVisiable(false);
    }
  }, [location.pathname, myCompanyInfoFilled?.validFields]);

  useEffect(() => {
    if (
      location.pathname === "/billingaddress" &&
      myBillingInfoFilled?.validFields &&
      Object?.keys(myBillingInfoFilled?.validFields)?.length === 0
    ) {
      setNextVisiable(true);
    } else if (
      location.pathname === "/billingaddress" &&
      myBillingInfoFilled?.validFields &&
      Object?.keys(myBillingInfoFilled?.validFields)?.length > 0
    ) {
      setNextVisiable(false);
    }
  }, [
    location.pathname,
    myBillingInfoFilled.billing_info,
    myBillingInfoFilled?.validFields,
  ]);

  return isLoadingImgDelete ? (
    <div className="pt-5 pb-2">
      <Spin tip="Deleting files...">
        <></>
      </Spin>
    </div>
  ) : (
    <div className="flex">
      <div>{contextHolder}</div>

      {/* Glassmorphism Bottom Navigation */}
      <div className="fixed bottom-6 left-28 right-6 z-40 flex items-center justify-between gap-4">
        {backVisiable && (
          <div className="backdrop-blur-xl bg-white/70 border border-white/40 rounded-2xl shadow-2xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1">
            <Button
              key="submit"
              className={`min-w-[110px] h-12 rounded-2xl font-semibold bg-transparent border-0 hover:bg-white/50 ${style.backButton}`}
              size="large"
              type="default"
              onClick={onBackHandler}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
            >
              Back
            </Button>
          </div>
        )}

        {totalVisiable && (
          <div className="flex-1 mx-4 backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-white/40 rounded-3xl shadow-2xl px-6 py-3.5">
            <div className="flex items-center justify-center gap-8 text-sm font-medium">
              <span className="flex items-center gap-3">
                <div className="p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-lg">{checkedOrders.length}</span>
                  <span className="text-gray-700 font-medium">of {orders?.data?.length} selected</span>
                </div>
              </span>
              {(isShippingLoading || grandTotal > 0) && (
                <>
                  <div className="h-8 w-px bg-white/40"></div>
                  <span className="flex items-center gap-3 bg-white/90 backdrop-blur-sm px-5 py-2 rounded-xl shadow-lg">
                    <span className="text-gray-700 font-semibold">Total:</span>
                    {isShippingLoading ? (
                      <Spin size="small" className="ml-2" />
                    ) : (
                      <span className="font-bold text-blue-600 text-xl">${(Number(grandTotal) || 0).toFixed(2)}</span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {nextVisiable && (
          <div className="backdrop-blur-xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 border border-white/30 rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:scale-105">
            <Spin tip="Updating..." spinning={nextSpinning}>
              <Button
                onClick={onNextHandler}
                className={`min-w-[130px] h-12 rounded-2xl font-bold border-0 bg-transparent hover:bg-white/10 text-white ${style.bottomIcon}`}
                type="primary"
                size="large"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                }
                iconPosition="end"
              >
                {location.pathname === "/shippingpreference" || location.pathname.includes("/editorder") ? "Update" : "Next"}
              </Button>
            </Spin>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomIcon;
