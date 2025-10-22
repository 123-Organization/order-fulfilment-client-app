import React, { useEffect, useState } from "react";
import {
  Button,
  PaginationProps,
  Spin,
  notification,
  Pagination,
  Skeleton,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import {
  saveOrder,
  updateOrderStatus,
  updateOrdersInfo,
} from "../store/features/orderSlice";
import { listVirtualInventory } from "../store/features/InventorySlice";
import { getImportOrders } from "../store/features/ecommerceSlice";
import NotificationAlert from "./notification";
import ShippingPreference from "../pages/ShippingPreference";
import UpdatePopup from "./UpdatePopup";
import { updateCompanyInfo } from "../store/features/companySlice";
import { resetRecipientStatus } from "../store/features/orderSlice";
import style from "./Components.module.css";
import { fetchWporder } from "../store/features/orderSlice";
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

const BottomIcon: React.FC<bottomIconProps> = ({ collapsed, setCollapsed }) => {
  const orders = useAppSelector((state) => state.order.orders);
  const product_details = useAppSelector(
    (state) => state.ProductSlice.product_details
  );

  const currentorderFullFillment = useAppSelector((state) => state.order.currentOrderFullFillmentId);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);

  const orderEdited = useAppSelector((state) => state.order.orderEdited);
  const wordpressConnectionId = useAppSelector((state) => state.company.wordpress_connection_id);

  const recipientStatus = useAppSelector(
    (state) => state.order.recipientStatus
  );

  const { product_list } = product_details?.data || {};

  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);

  const ecommerceGetImportOrders = useAppSelector(
    (state) => state.Ecommerce.ecommerceGetImportOrders
  );
  let listVirtualInventoryDataCount = useAppSelector(
    (state) => state.Inventory.listVirtualInventory?.count
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
  const [currentStep, setCurrentStep] = useState(1);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(12);
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
  const myCompanyInfoFilled = useAppSelector(
    (state) => state.company.myCompanyInfoFilled
  );

  const myImport = useAppSelector((state) => state.order.myImport);
  const importStatus = useAppSelector((state) => state.order.importStatus);

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
  const onChange: PaginationProps["onChange"] | any = (
    filterPageNumber: number
  ) => {
    setCurrent(filterPageNumber);
    dispatch(
      listVirtualInventory({
        search_filter: "",
        sort_field: "id",
        sort_direction: "DESC",
        per_page: 12,
        page_number: filterPageNumber,
      })
    );
  };

  const onNextHandler = async () => {
    try {
      if (location.pathname === "/mycompany") {
        if (
          myCompanyInfoFilled?.business_info &&
          !isNaN(myCompanyInfoFilled?.business_info?.zip_postal_code) &&
          !isNaN(myCompanyInfoFilled?.business_info?.phone)
        ) {
          setNextSpinning(true);
          await dispatch(updateCompanyInfo(myCompanyInfoFilled));
          navigate("/billingaddress");
        } else {
          alert("Billing info missing");
        }
      }

      if (location.pathname === "/importfilter") {
        if (wporder.length > 0) {
          setNextSpinning(true);
          const orderIds = wporder.split(",");

          try {
            const result = await dispatch(
              fetchWporder({
                orderId: orderIds,
                platformName: "woocommerce",
                accountId: customerInfo?.data?.account_id,
                domainName: wordpressConnectionId
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

                const sendData = {
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
                setTimeout(()=>{
                  navigate("/importlist");
                },2000)
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

      if (location.pathname === "/billingaddress") {
        if (
          myBillingInfoFilled.billing_info &&
          !isNaN(myBillingInfoFilled.billing_info.zip_postal_code) &&
          !isNaN(myBillingInfoFilled.billing_info.phone)
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

  const onDeleteHandler = () => {};
  console.log("loc",location.pathname);
  const onBackHandler = () => {
    switch (location.pathname) {
      case "/billingaddress":
        navigate("/mycompany");
        break;
      case "/paymentaddress":
        navigate("/billingaddress");
        break;
      case `/editorder/${currentorderFullFillment}`:
        navigate("/importlist");

        break;
      case "/shippingpreference":
        navigate("/billingaddress");
        break;
      case "/importlist":
        navigate("/shippingpreference");
        break;
      case "/checkout":
        navigate("/importlist");
        break;
      default:
        navigate("/");
        break;
    }
  };

  const onDownloadHandler = () => {};
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
      !isNaN(myBillingInfoFilled.billing_info.zip_postal_code) &&
      !isNaN(myBillingInfoFilled.billing_info.phone)
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
              navigate("/importlist");
            } else {
              // No duplicates found, proceed with normal import
              dispatch(saveOrder(ecommerceGetImportOrders));
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
          openNotificationWithIcon({
            type: "success",
            message: "Success",
            description: "Import and Export have been done successfully",
          });

          navigate("/importlist");
        } else if (saveOrderInfo?.statusCode === 400) {
          openNotificationWithIcon({
            type: "error",
            message: "Error",
            description: saveOrderInfo.message,
          });
          setNextSpinning(false);
          !nextVisiable && setNextVisiable(true);
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
  console.log("orders", orders)

  useEffect(() => {
    if (orders && checkedOrders) {
      let newTotalPrice = 0;

      checkedOrders?.forEach((order: any) => {
        const product = orders?.data?.find(
          (product: any) => product?.order_po == order?.order_po
        );
        console.log("product", product)

        if (product) {
          newTotalPrice += order.Product_price?.grand_total
            ? order.Product_price?.grand_total
            : order.Product_price?.credit_charge;
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
                {product_details?.totalPrice && (
                  <>
                    <div className="h-8 w-px bg-white/40"></div>
                    <span className="flex items-center gap-3 bg-white/90 backdrop-blur-sm px-5 py-2 rounded-xl shadow-lg">
                      <span className="text-gray-700 font-semibold">Total:</span>
                      <span className="font-bold text-blue-600 text-xl">${grandTotal.toFixed(2)}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {!!(location.pathname === "/virtualinventory" && listVirtualInventoryDataCount) && (
            <div className="flex-1 mx-4 backdrop-blur-xl bg-white/70 border border-white/40 rounded-3xl shadow-2xl px-6 py-3.5 flex items-center justify-center">
              <Pagination
                simple
                showSizeChanger={false}
                onChange={onChange}
                current={current}
                pageSize={pageSize}
                total={listVirtualInventoryDataCount}
              />
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
