import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Button, Form, Select, Skeleton, Tooltip, Modal, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { InfoCircleOutlined, FullscreenOutlined } from "@ant-design/icons";
import Spinner from "../components/Spinner";
import shoppingCart from "../assets/images/shopping-cart-228.svg";
import {
  resetOrderStatus,
  resetReplaceCodeResult,
  resetReplaceCodeStatus,
  updateCheckedOrders,
  deleteOrder,
} from "../store/features/orderSlice";
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
import VirtualInvModal from "../components/VirtualInvModal";
import ReplacingCode from "../components/ReplacingCode";
import { updateIframeState } from "../store/features/companySlice";
import { setProductData } from "../store/features/productSlice";
import { convertGoogleDriveUrl, isGoogleDriveUrl, getGoogleDriveImageUrls } from "../helpers/fileHelper";
import { useSearch } from "../context/SearchContext";
import { useCookies } from "react-cookie";

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
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [imageUrlIndex, setImageUrlIndex] = useState<{ [key: string]: number }>({});
  const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false);
  const [addProductPopupVisible, setAddProductPopupVisible] = useState(false);
  const [addProductVirtualInvVisible, setAddProductVirtualInvVisible] = useState(false);
  const [addProductDropdownVisible, setAddProductDropdownVisible] = useState<string | null>(null);
  const [currentOrderForAddProduct, setCurrentOrderForAddProduct] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const excludedOrders = useAppSelector((state) => state.order.excludedOrders);
  const validSKUs = useAppSelector((state) => state.order.validSKU);
  // console.log("excludedOrders", excludedOrders);
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
  // console.log("orderPostData", orderPostData);
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  const customer_info = useAppSelector((state) => state.Customer.customer_info);
  const iframeState = useAppSelector((state) => state.company.iframeState);
  // console.log("product_details...", product_details);
  const dispatch = useAppDispatch();
  const [cookies] = useCookies(["session_id", "AccountGUID", "ofa_product"]);
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
  const navigate = useNavigate();
  console.log("productData", productData);
  
  // Search functionality
  const { searchTerm } = useSearch();

  const getAddProductMenuItems = (orderFullFillmentId: string): MenuProps["items"] => {
    const postSettings = {
      "settings": {
        "guid": "",
        "session_id": cookies.session_id,
        "account_key": cookies.AccountGUID,
        "multiselect": true,
        "libraries": ["inventory", "temporary"],
        "domain": "finerworks.com",
        "terms_of_service_url": "/terms.aspx",
        "button_text": "Add Selected",
        "account_id": customerInfo?.data?.account_id,
        "ReturnUrl": window.location.href,
      }
    };
    const encodedURI =
      "https://finerworks.com/apps/orderform/post4.aspx?source=ofa&settings=" +
      encodeURIComponent(JSON.stringify(postSettings));

    return [
      {
        key: "1",
        label: (
          <div
            className="flex items-center gap-3 px-2 py-1.5 text-gray-700 hover:text-emerald-600 transition-colors duration-200 cursor-pointer"
            onClick={() => {
              window.open(encodedURI, "_blank");
              setAddProductDropdownVisible(null);
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Create New</span>
          </div>
        ),
      },
      {
        key: "2",
        label: (
          <div
            className="flex items-center gap-3 px-2 py-1.5 text-gray-700 hover:text-emerald-600 transition-colors duration-200 cursor-pointer"
            onClick={() => {
              setCurrentOrderForAddProduct(orderFullFillmentId);
              setAddProductPopupVisible(true);
              setAddProductDropdownVisible(null);
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm font-medium">Enter Product Code</span>
          </div>
        ),
      },
      {
        key: "3",
        label: (
          <div
            className="flex items-center gap-3 px-2 py-1.5 text-gray-700 hover:text-emerald-600 transition-colors duration-200 cursor-pointer"
            onClick={() => {
              setCurrentOrderForAddProduct(orderFullFillmentId);
              setAddProductVirtualInvVisible(true);
              setAddProductDropdownVisible(null);
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <span className="text-sm font-medium">Select from Inventory</span>
          </div>
        ),
      },
    ];
  };

  const handleAddProductCodeUpdate = async () => {
    // Set refreshing state to prevent "No Orders Found" flash
    setIsRefreshing(true);
    // Wait for the fetch to complete before clearing orderPostData
    
    // Add a small delay to ensure state is updated
    setTimeout(() => {
      setOrderPostData([]);
      setIsRefreshing(false);
    }, 500);
    
  };

  const AddProductsTemplate = ({ orderFullFillmentId }: { orderFullFillmentId: string }) => {
    return (
      <div className="flex flex-col justify-center items-center w-full h-[220px] text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-300">
        <div className="mb-4">
          <svg 
            className="w-12 h-12 text-gray-300 mx-auto"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="1.5" 
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500 mb-4 px-4">
          No products in this order yet
        </p>
        <Dropdown
          menu={{ items: getAddProductMenuItems(orderFullFillmentId) }}
          trigger={["click"]}
          placement="bottom"
          open={addProductDropdownVisible === orderFullFillmentId}
          onOpenChange={(visible) => setAddProductDropdownVisible(visible ? orderFullFillmentId : null)}
        >
          <button
            className="group relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-medium text-white transition-all duration-300 ease-out rounded-full shadow-md hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
            onClick={() => setAddProductDropdownVisible(
              addProductDropdownVisible === orderFullFillmentId ? null : orderFullFillmentId
            )}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-400 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative flex items-center gap-2">
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </span>
          </button>
        </Dropdown>
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
console.log("checkedOrders", checkedOrders);
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
            dispatch(updateIframeState(false));
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
  // console.log("validd", validSKUs);

  useEffect(() => {
    dispatch(resetSubmitedOrders());
  }, []);
  // console.log("wporder", wporder);

  // useEffect(() => {
  //   if (orders && !orders?.data?.length) {
  //     dispatch(fetchOrder(customerInfo?.data?.account_id));
  //   }
  // }, [orders]);

  useEffect(() => {
    setTimeout(() => {
      dispatch(fetchOrder(customerInfo?.data?.account_id));
    }, 1000);
  }, []);
  // console.log("oo", customerInfo?.data?.account_id);

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

      console.log("productdadsadata", productData);
      setProductData(products);
    }
  }, [product_details]);
  

  const onDeleteOrder = async (
    orderFullFillmentId: string,
    order_po: string
  ) => {
    await dispatch(
      deleteOrder({
        orderFullFillmentId: [orderFullFillmentId],
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

  const onBulkDeleteOrders = async () => {
    if (!orders?.data || orders.data.length === 0) {
      notificationApi.warning({
        message: "No Orders to Delete",
        description: "There are no orders available to delete.",
      });
      return;
    }

    const orderFullFillmentIds = orders.data.map((order: any) => order.orderFullFillmentId);
    
    await dispatch(
      deleteOrder({
        orderFullFillmentId: orderFullFillmentIds,
        accountId: customerInfo?.data?.account_id,
      })
    );

    setBulkDeleteModalVisible(false);
    // Clear checked orders
    dispatch(updateCheckedOrders([]));
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
    // console.log("shippingForOrder", shippingForOrder);
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
    if (orders?.data?.length && !orderPostData.length ) {
      const validOrders = orders?.data?.filter(
        (order) => (order?.order_items && order?.order_items?.length > 0  ) && order?.shipping_code != null && order?.shipping_code !== ""

      );
      console.log("validOrders", validOrders);
      const orderPostDataList = validOrders
        ?.map((order) => ({
          order_po: order?.order_po,
          recipient: order?.recipient,
          shipping_code: order?.shipping_code,
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
      
      dispatch(fetchShippingOption({orders: orderPostDataList,account_key: customerInfo?.data?.account_key,}));
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
                order.shipping_code != null &&
                order.shipping_code !== "" &&
                validSKUs.includes(
                  order.order_items[0]?.product_sku?.toString()
                ) &&
                !excludedOrders.includes(order.order_po)
            )
            .map((order) => ({
              order_po: order.order_po,
              order_key: order.order_key,
              Product_price: getShippingPrice(order.order_po),
              productData: order.order_items,
              source: order.source,
              productImage:
                productData[order.order_items[0]?.product_sku]?.image_url_1,
            }))
        : [];

      dispatch(updateCheckedOrders(CheckedOrders));
    }
  }, [orders?.data, excludedOrders, shipping_option, validSKUs]); // Removed productData to prevent excessive re-renders

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
  // console.log("checkedOrders", checkedOrders);

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

  // Function to get the correct image URL, handling Google Drive links
  const getImageUrl = useCallback((order: any, productSku: string): string => {
    let imageUrl = "";
    console.log(order?.product_url_thumbnail,"order?.order_items?.product_image?.product_url_thumbnail")
    // Try thumbnail first, then fallback to product data
    if (order?.product_url_thumbnail) {
      imageUrl = order.product_url_thumbnail;
    }else if(order?.product_image?.product_url_thumbnail) {
      imageUrl = order.product_image.product_url_thumbnail;
    }
     else if (productData[productSku]?.image_url_1) {
      imageUrl = productData[productSku].image_url_1;
    }
    
    // Convert Google Drive URLs to direct image URLs
    if (imageUrl && isGoogleDriveUrl(imageUrl)) {
      return convertGoogleDriveUrl(imageUrl);
    }
    
    return imageUrl;
  }, [productData]);

  // Function to handle image load errors with URL fallback
  const handleImageError = (imageKey: string, originalUrl: string) => {
    if (isGoogleDriveUrl(originalUrl)) {
      const possibleUrls = getGoogleDriveImageUrls(originalUrl);
      const currentIndex = imageUrlIndex[imageKey] || 0;
      
      if (currentIndex < possibleUrls.length - 1) {
        // Try next URL
        setImageUrlIndex(prev => ({ ...prev, [imageKey]: currentIndex + 1 }));
        return;
      }
    }
    
    // Mark as failed if all URLs tried
    setImageErrors(prev => ({ ...prev, [imageKey]: true }));
  };

  // Get current image URL for a specific image key
  const getCurrentImageUrl = useCallback((imageKey: string, originalUrl: string): string => {
    if (!originalUrl) return "";
    console.log(originalUrl,"originalUrl")
    console.log(imageKey,"imageKey")
    
    if (isGoogleDriveUrl(originalUrl)) {
      const possibleUrls = getGoogleDriveImageUrls(originalUrl);
      const currentIndex = imageUrlIndex[imageKey] || 0;
      return possibleUrls[currentIndex] || originalUrl;
    }
    
    return originalUrl;
  }, [imageUrlIndex]);

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

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    if (!orders?.data || !searchTerm.trim()) {
      return orders?.data || [];
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    return orders.data.filter((order: any) => {
      // Search by order number (order_po)
      const orderNumber = order?.order_po?.toLowerCase() || "";
      if (orderNumber.includes(searchLower)) {
        return true;
      }

      // Search by product description
      if (order?.order_items && order.order_items.length > 0) {
        return order.order_items.some((item: any) => {
          const productSku = item?.product_sku?.toString() || "";
          const product = productData[productSku];
          
          if (product?.description_long) {
            // Strip HTML tags for searching
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = product.description_long;
            const textContent = (tempDiv.textContent || tempDiv.innerText || "").toLowerCase();
            return textContent.includes(searchLower);
          }
          
          return false;
        });
      }

      return false;
    });
  }, [orders?.data, searchTerm, productData]);

  return (
    <div
      className={`flex justify-end items-center  h-full p-8 ${style.overAll_box}`}
    >
      <div
        className={`h-auto bg-gray-100 pt-4 mt-10 w-full ${style.overAll_box}`}
      >
        <div className="flex justify-between items-center mb-10 px-9">
          <h1 className="text-left text-2xl font-bold mt-2">Orders</h1>
          {filteredOrders && filteredOrders.length > 0 && (
            <Button
              type="default"
              size="middle"
              loading={deleteOrderStatus === "loading"}
              onClick={() => setBulkDeleteModalVisible(true)}
              className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out font-medium px-5 py-2 rounded-lg"
              icon={
                !deleteOrderStatus || deleteOrderStatus !== "loading" ? (
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                ) : null
              }
            >
              <span>
                {deleteOrderStatus === "loading" ? "Deleting..." : "Delete All"}
              </span>
            </Button>
          )}
        </div>
        <div
          className={`mx-auto max-w-7xl justify-center px-6 md:flex md:space-x-6 xl:px-0 ${style.orderes_box}`}
        >
          <div className="rounded-lg md:w-full">
            {filteredOrders && filteredOrders.length > 0 ? (
              filteredOrders?.map((order, index) => (
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
                                    {(() => {
                                      const originalImageUrl = getImageUrl(order, order?.product_sku);
                                      const imageKey = `${order?.product_sku}-${order?.product_order_po}`;
                                      const currentImageUrl = getCurrentImageUrl(imageKey, originalImageUrl);
                                      // console.log(imageKey,"imageKey")
                                      const hasError = imageErrors[imageKey];
                                      // console.log(hasError,"hasError")
                                      
                                      // Debug logging
                                      if (isGoogleDriveUrl(originalImageUrl)) {
                                        console.log(`[${imageKey}] Google Drive Image State:`, {
                                          originalImageUrl,
                                          currentImageUrl,
                                          hasError,
                                          urlIndex: imageUrlIndex[imageKey] || 0
                                        });
                                      }
                                      // setProductData(prev => ({ ...prev, [order?.product_sku]: { ...prev[order?.product_sku], image_url_1: currentImageUrl } }));
                                      
                                      // Only show error state if explicitly marked as error
                                      // Don't treat empty URL as error initially
                                      if (currentImageUrl && !hasError) {
                                        
                                        console.log(currentImageUrl,"currentImageUrl")
                                        return (
                                          <img
                                            key={`${imageKey}-${imageUrlIndex[imageKey] || 0}`}
                                            src={originalImageUrl}
                                            alt="product"
                                            className="max-md:w-40 w-32 h-[120px] object-cover rounded"
                                            width={125}
                                            height={120}
                                            onError={() => {
                                              console.log(`[${imageKey}] Image failed to load:`, currentImageUrl);
                                              handleImageError(imageKey, originalImageUrl);
                                            }}
                                            onLoad={() => {
                                              console.log(`[${imageKey}] Image loaded successfully:`, currentImageUrl);
                                              // Clear any error state when image loads successfully
                                              setImageErrors(prev => {
                                                const newState = { ...prev };
                                                delete newState[imageKey];
                                                return newState;
                                              });
                                            }}
                                          />
                                        );
                                      } else if (hasError || !currentImageUrl) {
                                        return (
                                          <img
                                            key={`${imageKey}-${imageUrlIndex[imageKey] || 0}`}
                                            src={originalImageUrl}
                                            alt="product"
                                            className="max-md:w-40 w-32 h-[120px] object-cover rounded"
                                            width={125}
                                            height={120}
                                            onError={() => {
                                              console.log(`[${imageKey}] Image failed to load:`, currentImageUrl);
                                              handleImageError(imageKey, originalImageUrl);
                                            }}
                                            onLoad={() => {
                                              console.log(`[${imageKey}] Image loaded successfully:`, currentImageUrl);
                                              // Clear any error state when image loads successfully
                                              setImageErrors(prev => {
                                                const newState = { ...prev };
                                                delete newState[imageKey];
                                                return newState;
                                              });
                                            }}
                                          />
                                        );
                                      } else {
                                        return <Skeleton.Image active className="w-32 h-[120px]" />;
                                      }
                                    })()}
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
                                    {order?.product_qty || 1}@ ${(productData[order?.product_guid]?.total_price)?.toFixed(2)} ea
                                  </div>
                                </div>
                              </div>
                            </label>
                          )
                        )
                      ) : (
                        <AddProductsTemplate orderFullFillmentId={order?.orderFullFillmentId} />
                      )}
                    </li>
                    <li>
                      <label className={`h-[220px] inline-flex justify-between w-full p-5 text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 ${hasInvalidSKUs(order?.order_items) ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="block w-full relative">
                          {order?.order_items.length > 0 ? (
                            hasInvalidSKUs(order?.order_items) ? (
                              <div className="flex flex-col items-center justify-center h-full">
                                <div className="relative mb-3">
                                  <svg 
                                    className="w-16 h-16 text-gray-300"
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth="1.5" 
                                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                    />
                                  </svg>
                                  <div className="absolute -top-1 -right-1 bg-amber-100 rounded-full p-1">
                                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                                <p className="text-gray-500 text-center text-sm font-medium">
                                  Shipping Locked
                                </p>
                                <p className="text-gray-400 text-center text-xs mt-1">
                                  Fix invalid SKUs to unlock
                                </p>
                              </div>
                            ) : (
                              <SelectShippingOption
                                poNumber={order?.order_po.toString()}
                                orderItems={order?.order_items}
                                localOrder={order}
                                productchange={false}
                                clicking={false}
                                onShippingOptionChange={(poNumber: string, total: any) => 
                                  handleShippingOptionChange(poNumber, total)
                                }
                              />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <div className="relative mb-3">
                                <svg 
                                  className="w-16 h-16 text-gray-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="1.5" 
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                                <div className="absolute -bottom-1 -right-1 bg-gray-100 rounded-full p-1">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </div>
                              </div>
                              <p className="text-gray-400 text-center text-sm">
                                Add products to see
                              </p>
                              <p className="text-gray-400 text-center text-xs">
                                shipping options
                              </p>
                            </div>
                          )}
                        </div>
                      </label>
                    </li>
                  </ul>
                </div>
              ))
            ) : !orders?.data || isRefreshing ? (
              <SkeletonOrderCard count={3} />
            ) : orders?.data && orders.data.length === 0 && !isRefreshing ? (
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
            ) : orders?.data && orders.data.length > 0 && filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md p-6 mb-20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-20 h-20 mb-4 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-xl font-medium text-gray-500 mb-2">
                  No Results Found
                </h3>
                <p className="text-gray-400 text-center mb-4">
                  No orders match your search: "{searchTerm}"
                </p>
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

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center text-lg text-red-700 font-medium border-b pb-2">
            <svg
              className="w-6 h-6 mr-2 text-red-500"
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
            Delete All Orders
          </div>
        }
        open={bulkDeleteModalVisible}
        onCancel={() => setBulkDeleteModalVisible(false)}
        footer={[
          <div className="flex justify-center gap-4" key="footer">
            <Button
              key="cancel"
              size="large"
              onClick={() => setBulkDeleteModalVisible(false)}
              className="border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 bg-white hover:bg-gray-50 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out font-medium px-8 py-2 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              key="delete"
              danger
              type="primary"
              size="large"
              loading={deleteOrderStatus === "loading"}
              onClick={onBulkDeleteOrders}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out font-semibold px-8 py-2 rounded-lg"
              icon={
                !deleteOrderStatus || deleteOrderStatus !== "loading" ? (
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                ) : null
              }
            >
              <span className="text-white font-medium">
                {deleteOrderStatus === "loading" ? "Deleting..." : "Delete All"}
              </span>
            </Button>
          </div>,
        ]}
        width={500}
        centered
        className="bulk-delete-modal"
      >
        <div className="text-center py-4">
          <div className="mb-4">
            <svg
              className="mx-auto w-16 h-16 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            Are you sure you want to delete all orders?
          </p>
          <p className="text-sm text-gray-500 mb-4">
            This action will permanently delete{" "}
            <span className="font-semibold text-red-600">
              {orders?.data?.length || 0} order(s)
            </span>{" "}
            and cannot be undone.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This operation is irreversible. All order data will be permanently removed from the system.
            </p>
          </div>
        </div>
      </Modal>

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

      {/* Add Product Modals */}
      <PopupModal
        visible={addProductPopupVisible}
        onClose={() => setAddProductPopupVisible(false)}
        setProductCode={() => {}}
        orderFullFillmentId={currentOrderForAddProduct}
        onProductCodeUpdate={handleAddProductCodeUpdate}
      />
      <VirtualInvModal
        visible={addProductVirtualInvVisible}
        onClose={() => setAddProductVirtualInvVisible(false)}
        onProductAdded={handleAddProductCodeUpdate}
      />
    </div>
  );
};

export default ImportList;
