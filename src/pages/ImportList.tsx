import React, { useEffect, useState, useRef } from "react";
import { Button, Form, Select, Skeleton, Tooltip, Modal } from "antd";
import { InfoCircleOutlined, FullscreenOutlined } from "@ant-design/icons";
import Spinner from "../components/Spinner";
import shoppingCart from "../assets/images/shopping-cart-228.svg";
import {
  resetOrderStatus,
  resetReplaceCodeResult,
  resetReplaceCodeStatus,
  updateCheckedOrders,
} from "../store/features/orderSlice";
import locked_Shipment from "../assets/images/package-delivery-box-8-svgrepo-com.svg";
import { fetchOrder } from "../store/features/orderSlice";
import { fetchShippingOption } from "../store/features/shippingSlice";
import { clearProductData, clearSelectedImage, fetchProductDetails } from "../store/features/productSlice";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { useNavigate } from "react-router-dom";
import parse from "html-react-parser";
import SelectShippingOption from "../components/SelectShippingOption";
import style from "./Pgaes.module.css";
import DeleteMessage from "../components/DeleteMessage";
import { deleteOrder } from "../store/features/orderSlice";
import Loading from "../components/Loading";
import { useNotificationContext } from "../context/NotificationContext";
import styles from "../components/ToggleButtons.module.css";
import { resetDeleteOrderStatus } from "../store/features/orderSlice";
import { resetSubmitedOrders } from "../store/features/orderSlice";
import SkeletonOrderCard from "../components/SkeletonOrderCard";
import {
  resetExcludedOrders,
  updateExcludedOrders,
} from "../store/features/orderSlice";
import { updateValidSKU, resetValidSKU } from "../store/features/orderSlice";
import PopupModal from "../components/PopupModal";
import ReplacingCode from "../components/ReplacingCode";
import { updateIframeState } from "../store/features/companySlice";
import { setProductData } from "../store/features/productSlice";

const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]["size"];
type NotificationType = "success" | "info" | "warning" | "error";
const ImportList: React.FC = () => {
  interface Product {
    sku: string;
    image_url_1: string;
    description_long: string;
  }
  interface NotificationAlertProps {
    type: NotificationType;
    message: string;
    description: string;
  }

  const firstTimeRender = useRef(true);
  const isFirstRender = useRef(true);

  // Utility function to truncate text with character count control
  const truncateText = (htmlString: string, maxLength: number): string => {
    if (!htmlString) return "";

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;

    // Get the text content without HTML tags
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    // Return the full HTML if text is shorter than max length
    if (textContent.length <= maxLength) {
      return htmlString;
    }

    // For longer content, return truncated text with ellipsis
    // Strip HTML tags for consistent display
    return textContent.substring(0, maxLength) + "...";
  };

  const [productData, setProductData] = useState<{ [key: string]: Product }>(
    {}
  );
  const [productCode, setProductCode] = useState(false);

  const [orderPostData, setOrderPostData] = useState([]);
  const [DeleteMessageVisible, setDeleteMessageVisible] = useState(false);
  const [orderFullFillmentId, setOrderFullFillmentId] = useState("");
  const [order_po, setOrder_po] = useState("");
  const [descriptionCharLimit, setDescriptionCharLimit] = useState(100);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [invalidSKuOrderFullilment, setInvalidSKuOrderFullilment] = useState(
    []
  );
  const [skuOrderFullilment, setSkuOrderFullilment] = useState();
  const [skuModal, setSkuModal] = useState(false);
  const [replacingModal, setReplacingModal] = useState(false);
  const [skuToReplace, setSkuToReplace] = useState("");
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const excludedOrders = useAppSelector((state) => state.order.excludedOrders);
  const validSKUs = useAppSelector((state) => state.order.validSKU);
  console.log("excludedOrders", excludedOrders);
  // Add ref to track if notification has been shown
  const deleteNotificationShown = useRef({
    succeeded: false,
    failed: false,
  });

  const orders = useAppSelector((state) => state.order.orders || []);
  const ordersStatus = useAppSelector((state) => state.order.status);
  const deleteOrderStatus = useAppSelector(
    (state) => state.order.deleteOrderStatus
  );
  const product_details = useAppSelector(
    (state) => state.ProductSlice.product_details?.data?.product_list || []
  );
  const product_status = useAppSelector((state) => state.ProductSlice.status);
  const myImport = useAppSelector((state) => state.order.myImport);
  const wporder = useAppSelector((state) => state.order.Wporder);
  const notificationApi = useNotificationContext();
  console.log("orderPostData", orderPostData);
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  const customer_info = useAppSelector((state) => state.Customer.customer_info);
  const iframeState = useAppSelector((state) => state.company.iframeState);
  console.log("product_details...", product_details);
  const dispatch = useAppDispatch();
  console.log("productdata", productData);
  const shipping_option = useAppSelector(
    (state) => state.Shipping.shippingOptions || []
  );
  const SelectedImage = useAppSelector(
    (state) => state.ProductSlice.SelectedImage
  );
  const replaceCodeResult = useAppSelector(
    (state) => state.order.replaceCodeResult
  );
  const currentOption = useAppSelector(
    (state) => state.Shipping.currentOption
  );
  console.log("replaceCodeResult", replaceCodeResult);
  console.log("excludedOrders", excludedOrders);
  const navigate = useNavigate();

  const AddProductsTemplate = () => {
    return (
      <div className="flex-col justify-center  content-center w-full  h-full text-center border ">
        <h1 className="w-full text-base font-medium text-gray-400 mb-2">
          {" "}
          There are currently no products in this order
        </h1>
        <Button
          key="submit"
          className="   w-36 h-6 text-gray-500"
          size={"small"}
          type="default"
          href="#/editorder"
        >
          Add Products
        </Button>
      </div>
    );
  };
  const onProductCodeReplace = (productCode: string) => {
    dispatch(fetchOrder(customerInfo?.data?.account_id));
    setTimeout(() => {
      setOrderPostData([]);
      dispatch(updateValidSKU([...validSKUs, productCode]));
      dispatch(resetReplaceCodeStatus());
      dispatch(resetReplaceCodeResult());
    }, 2000);
  };

  useEffect(() => {
    // Only show notifications if we have attempted to replace a code
    if (replaceCodeResult !== undefined) { // Check if we have a result (success or failure)
      if (replaceCodeResult?.data && skuToReplace.length > 0) { 
        setTimeout(() => {
          notificationApi.success({
            message: "Product Code Replaced",
            description: "Product code has been successfully replaced.",
          });
          dispatch(clearSelectedImage());
          // setReplacingModal(false);
          dispatch(resetReplaceCodeResult());
          dispatch(fetchOrder(customerInfo?.data?.account_id));
          dispatch(clearProductData());
          if(iframeState){
            dispatch(updateIframeState({ iframeState: false }));
          }
          setOrderPostData([]);
          // setReplacingModal(false);
        }, 2000);
      } else if (replaceCodeResult === null && skuToReplace.length > 0) {
        notificationApi.error({
          message: "Product Code not found",
          description: "Product code not found in the database.",
        });
      }
    }
  }, [replaceCodeResult, skuToReplace, iframeState]);

  

  useEffect(() => {
    // Skip the first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only update if product_details has changed and is valid
    if (
      product_details &&
      Array.isArray(product_details) &&
      product_details.length > 0
    ) {
      const validCodes = product_details
        .filter((product: any) => product?.sku || product.product_code)
        .map((product: any) =>
          (product?.sku || product.product_code).toString()
        );

      // Only dispatch if validCodes is different from current validSKUs
      if (JSON.stringify(validCodes) !== JSON.stringify(validSKUs)) {
        dispatch(updateValidSKU(validCodes));
      }
    }
  }, [product_details, validSKUs]); // Keep only product_details as dependency

  // Keep your second useEffect separate
  useEffect(() => {
    if (orders?.data && validSKUs.length > 0) {
      const invalidSkus = Array.isArray(orders.data)
        ? orders.data.reduce((acc: any[], order: any) => {
            const invalidItems = order?.order_items?.filter(
              (item: any) => !validSKUs.includes(item?.product_sku?.toString())
            );

            if (invalidItems?.length > 0) {
              invalidItems.forEach((item: any) => {
                acc.push({
                  sku: item.product_sku,
                  orderFullFillmentId: order?.orderFullFillmentId,
                });
              });
            }
            return acc;
          }, [])
        : [];

      setInvalidSKuOrderFullilment(invalidSkus);
    }
  }, [orders?.data, validSKUs]);
  console.log("validd", validSKUs);

  useEffect(() => {
    dispatch(resetSubmitedOrders());
  }, []);
  console.log("wporder", wporder);

  // useEffect(() => {
  //   if (orders && !orders?.data?.length) {
  //     dispatch(fetchOrder(customerInfo?.data?.account_id));
  //   }
  // }, [orders]);

  useEffect(() => {
    setTimeout(() => {
      dispatch(fetchOrder(customerInfo?.data?.account_id));
    }, 1000);
  }, [customerInfo?.data?.account_id, dispatch]);
  console.log("oo", customerInfo?.data?.account_id);

  // Add responsive character limit based on screen size
  useEffect(() => {
    const adjustCharLimit = () => {
      const width = window.innerWidth;
      if (width > 1200) {
        setDescriptionCharLimit(200);
      } else if (width > 992) {
        setDescriptionCharLimit(120);
      } else if (width > 768) {
        setDescriptionCharLimit(200);
      } else if (width > 576) {
        setDescriptionCharLimit(200);
      } else {
        setDescriptionCharLimit(200);
      }
    };

    // Set initial value
    adjustCharLimit();

    // Add event listener
    window.addEventListener("resize", adjustCharLimit);

    // Cleanup
    return () => {
      window.removeEventListener("resize", adjustCharLimit);
    };
  }, []);

  let products: any = {};
  useEffect(() => {
    if (product_details && product_details?.length) {
      product_details?.map((product, index) => {
        products[product.sku] = product;
        products[product?.product_code] = product;
        products[product?.product_guid] = product;
      });

      console.log("products", products);
      setProductData(products);
    }
  }, [product_details]);
  console.log("productData", productData);

  const onDeleteOrder = async (
    orderFullFillmentId: string,
    order_po: string
  ) => {
    await dispatch(
      deleteOrder({
        orderFullFillmentId,
        accountId: customerInfo?.data?.account_id,
      })
    );
    // Reset notification tracking when initiating a new delete
    deleteNotificationShown.current = {
      succeeded: false,
      failed: false,
    };
    dispatch(
      updateCheckedOrders(
        checkedOrders.filter((order) => order.order_po !== order_po)
      )
    );
  };
  const onProductCodeUpdate = (productCode: string) => {
    dispatch(fetchOrder(customerInfo?.data?.account_id));
  };

  useEffect(() => {
    if (
      deleteOrderStatus === "succeeded" &&
      !deleteNotificationShown.current.succeeded
    ) {
      notificationApi.success({
        message: "Order Deleted",
        description: "Order has been successfully deleted.",
      });
      deleteNotificationShown.current.succeeded = true;
      // Reset status after showing notification
      dispatch(resetDeleteOrderStatus());
      dispatch(fetchOrder(customerInfo?.data?.account_id));
    } else if (
      deleteOrderStatus === "failed" &&
      !deleteNotificationShown.current.failed
    ) {
      notificationApi.error({
        message: "Failed to Delete Order",
        description: "An error occurred while deleting the order.",
      });
      deleteNotificationShown.current.failed = true;
      // Reset status after showing notification
      dispatch(resetDeleteOrderStatus());
    }
  }, [deleteOrderStatus, notificationApi, dispatch]);

  const getShippingPrice = (order_po) => {
    const shippingForOrder = currentOption?.allOptions?.find(
      (option) => option.order_po == order_po
    );
    console.log("shippingForOrder", shippingForOrder);
    if (shippingForOrder ) {
      const selectedOption = shippingForOrder?.selectedOption;
      const charges = {
        grand_total: selectedOption?.calculated_total?.order_grand_total,
        credit_charge: selectedOption?.calculated_total?.order_credits_used,
      }; // or apply logic to select a specific shipping option
      return charges;
    } else return 0; // Default value if no shipping option is found
  };

  useEffect(() => {
    if (orders?.data?.length && !orderPostData.length) {
      const validOrders = orders?.data?.filter(
        (order) => order?.order_items && order?.order_items?.length > 0
      );
      console.log("validOrders", validOrders);
      const orderPostDataList = validOrders
        ?.map((order) => ({
          order_po: order?.order_po,
          order_items: order.order_items?.map((item) => ({
            product_order_po: item.product_order_po,
            product_qty: item.product_qty,
            product_sku: item.product_sku,
            product_image: {
              product_url_file: "https://via.placeholder.com/150",
              product_url_thumbnail: "https://via.placeholder.com/150",
            },
          })),
        }))
        ?.flat();

      const ProductDetails = orders?.data?.flatMap((order) =>
        order.order_items?.map((item) => ({
          order_po: order.order_po,
          product_sku: item.product_sku,
          product_guid: item.product_guid,
          product_qty: item.product_qty,
          product_image: {
            product_url_file: "https://via.placeholder.com/150",
            product_url_thumbnail: "https://via.placeholder.com/150",
          },
        }))
      );

      dispatch(fetchShippingOption(orderPostDataList));
      setOrderPostData(orderPostDataList);
      dispatch(fetchProductDetails(ProductDetails));
    }
  }, [orders, product_details, orderPostData, dispatch]);

  // Update the useEffect that handles setting checked orders
  useEffect(() => {
    // Only proceed if we have both orders and shipping options
    if (orders?.data && shipping_option.length > 0) {
      const CheckedOrders = Array.isArray(orders.data)
        ? orders.data
            .filter(
              (order) =>
                // Only include orders that:
                // 1. Have items
                // 2. Are not in the excluded orders list
                order.order_items &&
                order.order_items.length > 0 &&
                validSKUs.includes(
                  order.order_items[0]?.product_sku?.toString()
                ) &&
                !excludedOrders.includes(order.order_po)
            )
            .map((order) => ({
              order_po: order.order_po,
              Product_price: getShippingPrice(order.order_po),
              productData: order.order_items,
              productImage:
                productData[order.order_items[0]?.product_sku]?.image_url_1,
            }))
        : [];

      dispatch(updateCheckedOrders(CheckedOrders));
    }
  }, [orders?.data, productData, excludedOrders , shipping_option]); // Add excludedOrders to dependencies

  const handleCheckboxChange = (e: any) => {
    const { value, checked } = e.target;
    const parsedValue = JSON.parse(value);
    console.log("vava", parsedValue);

    if (checked) {
      dispatch(updateCheckedOrders([...checkedOrders, parsedValue]));
      dispatch(
        updateExcludedOrders(
          excludedOrders.filter((order) => order !== parsedValue.order_po)
        )
      );
    } else {
      dispatch(
        updateCheckedOrders(
          checkedOrders.filter(
            (order) => order.order_po !== parsedValue.order_po
          )
        )
      );
    }
  };
  console.log("checkedOrders", checkedOrders);

  const handleShippingOptionChange = (order_po: string, updatedPrice: any) => {
    let updatedOrders = [...checkedOrders];
    console.log("updatedOrders", updatedOrders);

    // Check if the order is already in checkedOrders
    const orderIndex = updatedOrders.findIndex(
      (order) => order.order_po == order_po
    );

    if (orderIndex !== -1) {
      // Update the shipping price for the existing order
      updatedOrders[orderIndex] = {
        ...updatedOrders[orderIndex],
        Product_price: {
          grand_total: updatedPrice?.order_grand_total,
          credit_charge: updatedPrice?.order_credits_used,
        },
      };
    } else {
      // Add the order with the updated shipping price
      updatedOrders.push({
        order_po,
        Product_price: {
          grand_total: updatedPrice?.order_grand_total,
          credit_charge: updatedPrice?.order_credits_used,
        },
      });
    }

    dispatch(updateCheckedOrders(updatedOrders));
  };

  const hasInvalidSKUs = (orderItems: any[]) => {
    return orderItems?.some(item => !validSKUs.includes(item.product_sku?.toString()));
  };

  // Function to show modal with full description
  const showFullDescription = (
    title: string,
    content: string,
    sku?: string
  ): void => {
    setModalTitle(title || "Product Description");
    setModalContent(content || "");
    setModalVisible(true);
  };

  return (
    <div
      className={`flex justify-end items-center  h-full p-8 ${style.overAll_box}`}
    >
      <div
        className={`h-auto bg-gray-100 pt-4 mt-10 w-full ${style.overAll_box}`}
      >
        <div className="flex justify-between items-center mb-10 px-9">
          <h1 className="text-left text-2xl font-bold mt-2">Orders</h1>
        </div>
        <div
          className={`mx-auto max-w-7xl justify-center px-6 md:flex md:space-x-6 xl:px-0 ${style.orderes_box}`}
        >
          <div className="rounded-lg md:w-full">
            {orders?.data && orders.data.length > 0 ? (
              orders?.data?.map((order, index) => (
                <div
                  key={index}
                  className="justify-between mb-6  rounded-lg bg-white p-6 shadow-md sm:flex-row sm:justify-start space-y-2 "
                >
                  <ul className="grid w-100  md:grid-cols-2 md:grid-rows-1 items-start ">
                    <li className="w-8">
                      {shipping_option.length > 0 &&
                      order?.order_items.length > 0 ? (
                        <fieldset
                          id="switch"
                          className={`${styles.radio} flex`}
                        >
                          <input
                            name={`switch-${order.order_po}`}
                            id={`on-${order.order_po}`}
                            type="radio"
                            value={JSON.stringify({
                              order_po: order?.order_po,
                              Product_price: getShippingPrice(order?.order_po),
                              productData: order?.order_items,
                              productImage:
                                productData[order?.order_items[0]?.product_sku]
                                  ?.image_url_1,
                            })}
                            onChange={(e) => handleCheckboxChange(e)}
                            checked={checkedOrders.some(
                              (checkedOrder: { order_po: string }) =>
                                checkedOrder.order_po == order.order_po
                            )}
                          />
                          <label htmlFor={`on-${order.order_po}`}>
                            Include
                          </label>
                          <input
                            name={`switch-${order.order_po}`}
                            id={`off-${order.order_po}`}
                            type="radio"
                            value="disclude"
                            className="off"
                            style={{ display: "none" }}
                            onChange={() => {
                              // Remove the order from checked orders if it exists
                              if (
                                checkedOrders.some(
                                  (checkedOrder: { order_po: string }) =>
                                    checkedOrder.order_po == order.order_po
                                )
                              ) {
                                dispatch(
                                  updateCheckedOrders(
                                    checkedOrders.filter(
                                      (checkedOrder) =>
                                        checkedOrder.order_po !== order.order_po
                                    )
                                  )
                                );
                                dispatch(
                                  updateExcludedOrders([
                                    ...excludedOrders,
                                    order.order_po,
                                  ])
                                );
                              }
                            }}
                            checked={
                              !checkedOrders.some(
                                (checkedOrder: { order_po: string }) =>
                                  checkedOrder.order_po == order.order_po
                              )
                            }
                          />
                          <label
                            htmlFor={`off-${order.order_po}`}
                            className="off"
                          >
                            Exclude
                          </label>
                        </fieldset>
                      ) : null}
                    </li>

                    <div className="w-100%   text-end">
                      <button
                        data-tooltip-target="tooltip-document"
                        type="button"
                        className="max-md:pl-2  inline-flex  flex-col justify-start items-start  hover:bg-gray-50 dark:hover:bg-gray-800 group"
                        onClick={() => {
                          setDeleteMessageVisible(true);
                          setOrderFullFillmentId(order?.orderFullFillmentId);
                          setOrder_po(order?.order_po);
                        }}
                      >
                        <svg
                          className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-blue-500"
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
                      </button>
                    </div>
                  </ul>

                  <ul
                    className="grid w-full gap-6 md:grid-cols-3  "
                    key={index}
                  >
                    <li className="">
                      <label className="h-[220px] inline-flex items-center justify-between w-full p-5 text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                        <div className="block">
                          <div className="w-full text-sm text-red-800">
                            {order?.order_po}
                          </div>
                          <div className="w-full text-sm pt-2 pb-2 font-semibold">
                            Ship To
                          </div>
                          <div className="w-full text-sm">
                            {order?.recipient?.first_name}{" "}
                            {order?.recipient?.last_name}
                          </div>
                          <div className="w-full text-sm">
                            {order?.recipient?.address_1}
                          </div>
                          <div className="w-full text-sm">
                            {order?.recipient?.city},{order?.recipient?.state}
                            {order?.recipient?.province}{" "}
                            {order?.recipient?.zip_postal_code}
                          </div>
                          <div className="w-full text-sm">
                            {order?.recipient?.country_code}
                          </div>
                          <div className="w-full pt-3">
                            <Button
                              key="submit"
                              className="   w-full text-gray-500"
                              size={"small"}
                              type="default"
                            >
                              <Link
                                to={"/editorder/" + order?.orderFullFillmentId}
                              >
                                Edit order
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </label>
                    </li>

                    <li className="h-400px">
                      <input
                        type="checkbox"
                        id="flowbite-option"
                        value=""
                        className="hidden peer"
                      />
                      {order?.order_items.length > 0 ? (
                        order?.order_items?.map((order) =>
                          product_details.length > 0 &&
                          !validSKUs.includes(order.product_sku.toString()) ? (
                            <div className="mb-4 p-4 border-2 border-red-200 rounded-lg bg-red-50 h-[220px]">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <svg
                                      className="w-5 h-5 text-red-500 mr-2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <h2 className="text-lg font-semibold text-red-700">
                                      Invalid SKU Detected
                                    </h2>
                                  </div>
                                  <div className="ml-7">
                                    <p className="text-red-600 mb-2">
                                      Current SKU:{" "}
                                      <span className="font-mono bg-red-100 px-2 py-1 rounded">
                                        {order?.product_sku}
                                      </span>
                                    </p>
                                    <p className="text-sm text-red-600">
                                      This SKU is not recognized in the system.
                                      Please add a valid SKU to proceed.
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 ml-7">
                                <button
                                  className="h-9 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                  onClick={() => {
                                    setReplacingModal(true);
                                    setSkuToReplace(order?.product_sku);
                                    setSkuOrderFullilment(
                                      invalidSKuOrderFullilment?.find(
                                        (item: any) =>
                                          order?.product_sku === item.sku
                                      )?.orderFullFillmentId || ""
                                    );
                                  }}
                                >
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                  </svg>
                                  Replace SKU
                                </button>
                              </div>
                              {replacingModal && (
                                
                                <ReplacingCode
                                  visible={replacingModal}
                                  onClose={() => setReplacingModal(false)}
                                  orderFullFillmentId={skuOrderFullilment}
                                  toReplace={skuToReplace}
                                  accountId={customerInfo?.data?.account_id}
                                  onProductCodeUpdate={onProductCodeReplace}
                                />
                              )}
                            </div>
                          ) : (
                            <label
                              className={`h-[220px] inline-flex mb-2 justify-between w-full hover:border-gray-600 transition-all duration-75 pt-5 pb-5 px-2 text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 overflow-hidden ${style.orderes_lable}`}
                            >
                              <div className="block relative pb-4 w-full overflow-hidden ">
                                <img
                                  src={shoppingCart}
                                  width="26"
                                  alt="product"
                                  height="26"
                                />
                                {productData[order?.product_sku]
                                  ?.description_long && (
                                  <Tooltip
                                    title={
                                      <div>
                                        <div className="text-right mb-2">
                                          <span
                                            className="cursor-pointer text-blue-600 hover:text-blue-800 flex items-center justify-end"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              showFullDescription(
                                                "Product Details",
                                                productData[order?.product_sku]
                                                  ?.description_long || "",
                                                order?.product_sku
                                              );
                                            }}
                                          >
                                            <FullscreenOutlined className="mr-1" />{" "}
                                            View full description
                                          </span>
                                        </div>
                                        <div className="">
                                          {parse(
                                            productData[order?.product_sku]
                                              ?.description_long || ""
                                          )}
                                        </div>
                                      </div>
                                    }
                                    color="#fff"
                                    overlayInnerStyle={{
                                      color: "#333",
                                      maxWidth: "400px",
                                      maxHeight: "300px",
                                      overflow: "auto",
                                      padding: "12px",
                                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                      borderRadius: "8px",
                                    }}
                                    placement="rightTop"
                                    overlayClassName="description-tooltip"
                                    mouseEnterDelay={0.3}
                                  >
                                    <div
                                      className={`absolute top-1 right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center cursor-help text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 z-10 ${style["info-button-pulse"]}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showFullDescription(
                                          "Product Details",
                                          productData[order?.product_sku]
                                            ?.description_long || "",
                                          order?.product_sku
                                        );
                                      }}
                                    >
                                      <InfoCircleOutlined
                                        style={{ fontSize: "16px" }}
                                      />
                                    </div>
                                  </Tooltip>
                                )}
                                <div
                                  className={`justify-between pt-4 rounded-lg sm:flex sm:justify-start flex  ${style.description_box}`}
                                >
                                  <div
                                    className={`w-[50%]  ${style.importlist_pic}`}
                                  >
                                    {productData[order?.product_sku]
                                      ?.image_url_1 ? (
                                      <img
                                        src={
                                          order?.product_url_thumbnail
                                            ? order?.product_url_thumbnail
                                            : productData[order?.product_sku]
                                                .image_url_1
                                        }
                                        alt="product"
                                        className=" max-md:w-40 w-32 h-[120px]"
                                        width={125}
                                        height={26}
                                      />
                                    ) : (
                                      <Skeleton.Image active />
                                    )}
                                  </div>

                                  <div className="w-[100%]">
                                    {(Object.keys(productData)?.length && (
                                      <div className="flex flex-col w-full sm:justify-between p-2 max-lg:p-2">
                                        <div
                                          className={`w-full text-sm ${style.order_description} font-seri `}
                                        >
                                          {parse(
                                            truncateText(
                                              productData[order?.product_sku]
                                                ?.description_long || "",
                                              descriptionCharLimit
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )) || <Skeleton active />}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-0">
                                  <div></div>
                                  <div className="text-sm text-right h-4">
                                    {order?.product_qty || 1}@ ${(productData[order?.product_guid]?.total_price / (order?.product_qty || 1)).toFixed(2)} ea
                                  </div>
                                </div>
                              </div>
                            </label>
                          )
                        )
                      ) : (
                        <AddProductsTemplate />
                      )}
                    </li>
                    <li>
                      <label className={`h-[220px] inline-flex justify-between w-full p-5 text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 ${hasInvalidSKUs(order?.order_items) ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="block w-full relative">
                          {order?.order_items.length > 0 ? (
                            hasInvalidSKUs(order?.order_items) ? (
                              <div className="flex flex-col items-center justify-center h-full">
                                <img
                                  src={locked_Shipment}
                                  width="80"
                                  height="80"
                                  className="opacity-40 mb-3"
                                  alt="Locked shipping"
                                />
                                <p className="text-gray-400 text-center text-sm">
                                  Shipping options unavailable
                                  <br />
                                  <span className="text-xs">
                                    Please fix invalid SKUs first
                                  </span>
                                </p>
                              </div>
                            ) : (
                              <SelectShippingOption
                                poNumber={order?.order_po.toString()}
                                orderItems={order?.order_items}
                                onShippingOptionChange={handleShippingOptionChange}
                              />
                            )
                          ) : (
                            <div className="flex justify-center">
                              <img
                                src={locked_Shipment}
                                width="120"
                                height="120"
                                className="mt-4"
                              />
                            </div>
                          )}
                        </div>
                      </label>
                    </li>
                  </ul>
                </div>
              ))
            ) : orders?.data && orders.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md p-6 mb-20">
                <img
                  src={shoppingCart}
                  alt="Empty Orders"
                  className="w-20 h-20 mb-4 opacity-40"
                />
                <h3 className="text-xl font-medium text-gray-500 mb-2">
                  No Orders Found
                </h3>
                <p className="text-gray-400 text-center mb-4">
                  There are currently no orders to display.
                </p>
                <Button
                  type="primary"
                  onClick={() => navigate("/")}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Import Orders
                </Button>
              </div>
            ) : (
              <SkeletonOrderCard count={3} />
            )}

            <DeleteMessage
              visible={DeleteMessageVisible}
              onClose={setDeleteMessageVisible}
              onDeleteProduct={onDeleteOrder}
              deleteItem={orderFullFillmentId}
              order_po={order_po}
            />
          </div>
        </div>
      </div>

      <Modal
        title={
          <div className="text-lg text-blue-700 font-medium border-b pb-2">
            {modalTitle}
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setModalVisible(false)}
            type="primary"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Close
          </Button>,
        ]}
        width={800}
        centered
        bodyStyle={{ padding: "20px" }}
        className="product-description-modal"
      >
        <div className="max-h-[60vh] overflow-auto p-4 bg-gray-50 rounded-lg">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            {parse(modalContent)}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ImportList;
