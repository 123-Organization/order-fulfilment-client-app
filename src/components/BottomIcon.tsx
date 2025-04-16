import React, { useEffect, useState } from "react";
import { Button, PaginationProps, Spin, notification, Pagination } from "antd";
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
import { loadavg } from "os";
import { updateCompanyInfo } from "../store/features/companySlice";
import { resetRecipientStatus } from "../store/features/orderSlice";
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

  const orderEdited = useAppSelector((state) => state.order.orderEdited);
  console.log("orderEdited", orderEdited);
  const recipientStatus = useAppSelector((state) => state.order.recipientStatus);

  const { product_list } = product_details?.data || {};
  console.log("product_list", product_list);
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  console.log("checkedOrders", checkedOrders);
  const ecommerceGetImportOrders = useAppSelector(
    (state) => state.Ecommerce.ecommerceGetImportOrders
  );
  let listVirtualInventoryDataCount = useAppSelector(
    (state) => state.Inventory.listVirtualInventory?.count
  );
  const updatedValues =
    useAppSelector((state) => state.order.updatedValues) || {};

  const { shipping_preferences } = useAppSelector(
    (state) => state.Shipping.shipping_preferences
  );
  console.log("shipping_preferences", shipping_preferences);

  console.log("product_details ....", product_details);

  const [backVisiable, setBackVisiable] = useState<Boolean>(true);
  const [nextVisiable, setNextVisiable] = useState<Boolean>(false);
  const [totalVisiable, setTotalVisiable] = useState<Boolean>(false);
  const [nextSpinning, setNextSpinning] = useState<Boolean>(false);
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

  const myCompanyInfoFilled = useAppSelector(
    (state) => state.company.myCompanyInfoFilled
  );
  console.log("myCompanyInfoFilled", myCompanyInfoFilled);

  const myImport = useAppSelector((state) => state.order.myImport);

  const saveOrderInfo = useAppSelector((state) => state.order.saveOrderInfo);

  const myBillingInfoFilled = useAppSelector(
    (state) => state.company.myBillingInfoFilled
  );
  console.log("myBillingInfoFilled", myBillingInfoFilled);

  const companyInfo = useAppSelector((state) => state.company.company_info);

  const [stateData, setStateData] = useState<Boolean>(false);
  const dispatch = useAppDispatch();
  let isLoadingImgDelete = false;
  const location = useLocation();
  console.log(location.pathname);

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
    console.log("Page: ", filterPageNumber);
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
        if (myImport?.start_date || myImport?.end_date || myImport?.status) {
          setNextSpinning(true);
          await dispatch(
            getImportOrders({
              account_key: "81de5dba-0300-4988-a1cb-df97dfa4e372",
              ...myImport,
            })
          );
        } else {
          alert("Import info missing");
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
          navigate("/checkout");
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
         console.log("About to dispatch updateOrdersInfo with:", updatedValues);
         try {
            await dispatch(updateOrdersInfo([updatedValues]));
           console.log("Successfully dispatched updateOrdersInfo");
           dispatch(updateOrderStatus({ status: true, clicked: true }));
         } catch (error) {
           console.error("Error dispatching updateOrdersInfo:", error);
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

  useEffect(() => {
    if (recipientStatus === "succeeded") {
      openNotificationWithIcon({
        type: "success",
        message: "Success",
        description: "Information has been updated",
      });
      dispatch(resetRecipientStatus());
      setNextVisiable(false);
    }
  }, [recipientStatus]);

  

  const onDeleteHandler = () => {};

  const onBackHandler = () => {
    if (location.pathname === "/billingaddress") navigate("/mycompany");
    if (location.pathname === "/paymentaddress") navigate("/billingaddress");
    if (location.pathname.includes("/editorder")) navigate("/importlist");
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
    console.log("nextVisiable", nextVisiable);
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
    console.log("nextVisiable", nextVisiable);
  }, [myBillingInfoFilled]);

  useEffect(() => {
    if (location.pathname === "/importfilter") {
      if (myImport?.start_date || myImport?.end_date || myImport?.status) {
        !nextVisiable && setNextVisiable(true);
      } else {
        nextVisiable && setNextVisiable(false);
      }
      console.log("nextVisiable", nextVisiable);
    }
  }, [myImport]);

  useEffect(() => {
    if (location.pathname === "/importfilter") {
      if (myImport?.start_date || myImport?.end_date || myImport?.status) {
        console.log("ecommerceGetImportOrders", ecommerceGetImportOrders);
        if (ecommerceGetImportOrders?.accountId) {
          if (!ecommerceGetImportOrders?.orders?.length) {
            openNotificationWithIcon({
              type: "error",
              message: "Error",
              description:
                "We couldn’t find any records matching your search criteria. Please check the information you’ve entered and try again.",
            });

            
            setNextSpinning(false);
            !nextVisiable && setNextVisiable(true);
          } else {
            dispatch(saveOrder(ecommerceGetImportOrders));
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

      console.log("companyInfo", companyInfo);
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
      location.pathname !== "/billingaddress"
    ) {
      // if (location.pathname === "/paymentaddress")
      //   navigate('/')
      setNextSpinning(false);
      setNextVisiable(false);
      openNotificationWithIcon({
        type: "success",
        message: "Success",
        description: "Information has been saved",
      });
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

  console.log("next", nextVisiable);
  console.log("orders", orders);
  useEffect(() => {
    if (orders && checkedOrders) {
      let newTotalPrice = 0;

      checkedOrders?.forEach((order) => {
        const product = orders?.data?.find(
          (product) => product?.order_po == order?.order_po
        );
        if (product) {
          newTotalPrice += order.Product_price?.grand_total
            ? order.Product_price?.grand_total
            : order.Product_price?.credit_charge;
        }
      });
      setGrandtotal(newTotalPrice);
      console.log("Remaining Total Price", newTotalPrice);
    }
  }, [checkedOrders, orders]);
  console.log("location", location.pathname.includes("/editorder"));
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
    } else if (location.pathname === "/importlist" && !checkedOrders.length) {
      setNextVisiable(false);
    }
  }, [location.pathname, checkedOrders]);

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
      <div className="flex fixed bottom-0 left-0  w-full h-16 bg-white  border-b mt-2 border-gray-200 dark:bg-gray-700 dark:border-gray-600">
        <div className="grid h-full max-w-lg grid-cols-2 font-medium basis-1/2">
          {false && (
            <>
              {1 && (
                <button
                  onClick={onDownloadHandler}
                  type="button"
                  className="max-md:ml-4 inline-flex flex-col items-center ml-20 justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
                >
                  <svg
                    className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 19"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 15h.01M4 12H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-3M9.5 1v10.93m4-3.93-4 4-4-4"
                    />
                  </svg>
                  <span className="max-md:whitespace-normal text-sm whitespace-nowrap text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">
                    Download Selected
                  </span>
                </button>
              )}
              <button
                onClick={onDeleteHandler}
                data-tooltip-target="tooltip-document"
                type="button"
                className="max-md:pl-2 inline-flex ml-20 flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
              >
                <svg
                  className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 18 20"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z"
                  />
                </svg>
                {/* <span className="sr-only">New document</span> */}
                <span className="max-md:whitespace-normal text-sm text-gray-500 whitespace-nowrap dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">
                  Delete Selected
                </span>
              </button>
            </>
          )}

          {backVisiable && (
            <Button
              key="submit"
              className="  w-44 mx-8 mt-2  text-gray-500"
              size={"large"}
              type="default"
              onClick={onBackHandler}
            >
              Back
            </Button>
          )}
        </div>
        <div className="grid h-full max-w-lg grid-cols-1 font-medium basis-1/2">
          {totalVisiable && (
            <div className="flex flex-col font-bold text-gray-400 pt-2">
              <span>
                Selected orders: {checkedOrders.length} /{orders?.data?.length}
              </span>
              <span>
                Grand Total :{" "}
                {product_details?.totalPrice && "$" + grandTotal.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        <div className="grid h-full max-w-lg grid-cols-2/3 font-medium basis-1/2 relative z-50 ">
          {nextVisiable && (
            <Spin tip="Updating..." spinning={nextSpinning}>
              <Button
                onClick={onNextHandler}
                className="my-2 w-44 absolute right-2 z-50"
                type="primary"
                size="large"
              >
                {location.pathname === "/shippingpreference" ||
                location.pathname.includes("/editorder")
                  ? "Update"
                  : "Next"}
              </Button>
            </Spin>
          )}
        </div>

        {!!(
          location.pathname === "/virtualinventory" &&
          listVirtualInventoryDataCount
        ) && (
          <div className="flex w-full justify-end">
            <Pagination
              simple
              className=" mt-5 mr-3 "
              // defaultCurrent={current}
              showSizeChanger={false}
              onChange={onChange}
              current={current}
              pageSize={pageSize}
              total={listVirtualInventoryDataCount}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomIcon;
