import React, { useEffect, useState, useCallback } from "react";
import { Button, Form, Input, Select, Skeleton, List } from "antd";
import { useLocation } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { getStates } from "country-state-picker";
import { countryType } from "../types/ICountry";
import ProductOptions from "../components/ProductOptions";
import { useAppDispatch, useAppSelector } from "../store";
import SelectShippingOption from "../components/SelectShippingOption";
import { setCurrentOrderFullFillmentId, updateCheckedOrders, updateValidSKU } from "../store/features/orderSlice";
import {
  updateOrderStatus,
  fetchOrder,
  fetchSingleOrderDetails,
} from "../store/features/orderSlice";
import { getInventoryImages } from "../store/features/InventorySlice";
import { fetchProductDetails } from "../store/features/productSlice";
import UpdatePopup from "../components/UpdatePopup";
import style from "./Pgaes.module.css";
import FilesGallery from "../components/FilesGallery";
import FileManagementIframe from "../components/FileManagmentIframe";
import { setUpdatedValues } from "../store/features/orderSlice";
import DeleteMessage from "../components/DeleteMessage";
import { useNotificationContext } from "../context/NotificationContext";
import { LoadingOutlined } from "@ant-design/icons";
import { Flex, Spin } from "antd";
import { setQuantityUpdated } from "../store/features/productSlice";
import convertUsStateAbbrAndName from "../services/state";
import NewProduct from "../components/NewProduct";
import { updateOrdersInfo } from "../store/features/orderSlice";
import { convertGoogleDriveUrl, isGoogleDriveUrl, getGoogleDriveImageUrls } from "../helpers/fileHelper";
import HTMLReactParser from "html-react-parser";

import Quantity from "../components/Quantitiy";

// Define the array directly

const countryList = require("../json/country.json");
const { TextArea } = Input;
type SizeType = Parameters<typeof Form>[0]["size"];

const EditOrder: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const [productChanged, setProductChanged] = useState(false);
  const [UpdatePopupVisible, setUpdatePopupVisible] = useState(false);
  const [DeleteMessageVisible, setDeleteMessageVisible] = useState(false);
  const [productchange, setProductChange] = useState(false);
  const [product_guid, setProductGuid] = useState("");
  const [clicking, setclicking] = useState(false);
  const [productCode, setProductCode] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [selectedProductForImageChange, setSelectedProductForImageChange] = useState<{
    order_po: string;
    orderFullFillmentId: number;
    product_sku: string;
  } | null>(null);
  const [iframeOpen, setIframeOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const notificationApi = useNotificationContext();

  // Toggle description expansion
  const toggleDescription = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sku)) {
        newSet.delete(sku);
      } else {
        newSet.add(sku);
      }
      return newSet;
    });
  };
  const updatedValues =
    useAppSelector((state) => state.order.updatedValues) || {};
  const orders = useAppSelector((state) => state.order.orders);
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  console.log("updatedValues", updatedValues);
  const orderData = useAppSelector((state) => state.order.order) || {};
  console.log("orderData", orderData);
  const order = orderData.data ? orderData.data[0] : {};
  const { id } = useParams<{ id: string }>();
  const code = useAppSelector((state) => state.order.productCode) || {};
  console.log("full", id);
  const quantityUpdated = useAppSelector(
    (state) => state.ProductSlice.quantityUpdated
  );
  const { order_items, order_key, order_status, recipient } = order || {};
  const product_status = useAppSelector((state) => state.ProductSlice.status);
  
  const InventoryImages =
    useAppSelector((state) => state.Inventory.inventoryImages) || [];
  const validSKU = useAppSelector((state) => state.order.validSKU) || [];

  const shipping_option = useAppSelector(
    (state) => state.Shipping.shippingOptions[0] || []
  );
  console.log("validSKU", validSKU);

  console.log("InventoryImages", InventoryImages);

  useEffect(() => {
    dispatch(
      fetchSingleOrderDetails({ accountId: customerInfo?.data?.account_id, orderFullFillmentId: id })
    );
  }, [dispatch]);

  const [productData, setProductData] = useState<{ [key: string]: any }>({});
  const [orderPostData, setOrderPostData] = useState([]);
  const [form] = Form.useForm(); // Create form instance
  const [isModified, setIsModified] = useState(false); // Track if values are modified
  const [changedValues, setChangedValues] = useState<any>({});
  const [localOrder, setLocalOrder] = useState(order);
  const[stateCodeShort, setStateCodeShort] = useState(recipient?.state_code)
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [imageUrlIndex, setImageUrlIndex] = useState<{ [key: string]: number }>({});
  console.log("recipient", recipient);
  const product_details =
    useAppSelector(
      (state) => state.ProductSlice.product_details?.data?.product_list
    || [] ) ;
  console.log("product_details...", product_details);
  const orderEdited = useAppSelector((state) => state.order.orderEdited) || [];
  console.log("product_details...", product_details);
  // parse the string to html
const {phone} = useAppSelector((state) => state.company.company_info?.data?.billing_info) || {};
console.log("company_info", phone);

  // Function to get the correct image URL, handling Google Drive links
  const getImageUrl = useCallback((item: any, productSku: string): string => {
    let imageUrl = "";
    console.log("daasdasda", item);
    // Try thumbnail first, then fallback to product data
    if (item?.product_url_thumbnail) {
      imageUrl = item?.product_url_thumbnail;
    }else if(item?.product_image?.product_url_thumbnail) {
      imageUrl = item?.product_image?.product_url_thumbnail;
    } else if (productData[productSku]?.image_url_1) {
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
    
    if (isGoogleDriveUrl(originalUrl)) {
      const possibleUrls = getGoogleDriveImageUrls(originalUrl);
      const currentIndex = imageUrlIndex[imageKey] || 0;
      return possibleUrls[currentIndex] || originalUrl;
    }
    
    return originalUrl;
  }, [imageUrlIndex]);
  console.log("local", localOrder);
  console.log(orderPostData);
  useEffect(() => {
    if (!orders?.data?.length) {
      dispatch(fetchOrder(customerInfo?.data?.account_id)); // Ensure you're using the most up-to-date orders
    }
  }, [dispatch, orders]);
  console.log("ord", orders);

  console.log("locals", localOrder);
  const handleShippingOptionChange = (
    order_po: string,
    updatedPrice: any
  ) => {
    let updatedOrders = [...checkedOrders];

    // Check if the order is already in checkedOrders
    const orderIndex = updatedOrders.findIndex(
      (order) => order.order_po === order_po
    );

    if (orderIndex !== -1) {
      // Update the shipping price for the existing order
      updatedOrders[orderIndex] = {
        ...updatedOrders[orderIndex],
        Product_price: {grand_total: updatedPrice?.order_grand_total || updatedPrice},
      };
    } else {
      // Add the order with the updated shipping price
      console.log("updatedPrice", updatedPrice);
      updatedOrders.push({
        order_po,
        Product_price: {grand_total: updatedPrice?.order_grand_total || updatedPrice},
      });
    }

    dispatch(updateCheckedOrders(updatedOrders));
  };

  useEffect(()=>{
// updateOrderStatus()
  }, [])

  //send the orders array without the dedeleted product object
  const onDeleteProduct = (product_guid: string) => {
    const updatedOrderItems = localOrder?.order_items?.filter(
      (item) => item.product_guid !== product_guid
    );

    const updatedLocalOrder = {
      ...localOrder,
      order_items: updatedOrderItems,
    };

    const updatedOrders = orders?.data?.map((order) => {
      if (order?.order_po === localOrder?.order_po) {
        return updatedLocalOrder;
      }
      return order;
    });

    // Format the data properly for the API
    const postData = {
      updatedValues: updatedOrders,
      customerId: customerInfo?.data?.account_id  // Fallback to a default if missing
    };
    
    console.log("Sending updated orders:", postData);
    
    // Dispatch with the properly formatted data
    dispatch(updateOrdersInfo(postData))
      .then((result) => {
        if (updateOrdersInfo.fulfilled.match(result)) {
          console.log("Product successfully deleted from order");
          setLocalOrder(updatedLocalOrder);
          // Toggle productchange to ensure re-render
          setProductChange((prev) => !prev);

          notificationApi.success({
            message: "Product Deleted",
            description: "Product has been successfully deleted from the order.",
          });
        } else {
          console.error("Failed to delete product:", result.payload);
          notificationApi.error({
            message: "Error",
            description: "Failed to delete product from order.",
          });
        }
      })
      .catch((error) => {
        console.error("Error deleting product:", error);
        notificationApi.error({
          message: "Error",
          description: "An error occurred while deleting the product.",
        });
      });
  };

  // Determine if recipient has phone and if field should be editable
  const hasRecipientPhone = Boolean(recipient?.phone && String(recipient.phone).trim());
  const phoneValue = hasRecipientPhone ? recipient.phone : phone || "";
  const isPhoneEditable = hasRecipientPhone;

  const initialValues = React.useMemo(
    () => ({
      country_code: order?.country_code || "US",
      company_name: recipient?.company_name || "",
      first_name: recipient?.first_name || "",
      last_name: recipient?.last_name || "",
      address_1: recipient?.address_1 || "",
      address_2: recipient?.address_2 || "",
      city: recipient?.city || "",
      state_code: recipient?.state_code || stateCodeShort,
      zip_postal_code: recipient?.zip_postal_code.toString() || "",
      phone: phoneValue,
    }),
    [order, recipient, phone, phoneValue]
  );
  // console.log("initialValues",convertUsStateAbbrAndName(recipient?.state ))
  console.log("recipient", recipient);

  useEffect(() => {
    if(recipient?.state_code || recipient?.state){
    const stateCode = recipient?.state_code?.toLowerCase()
    setStateCodeShort(convertUsStateAbbrAndName(stateCode))}
  }, [recipient])

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);
  console.log(productData);
  let products: any = {};
  console.log("changedvalues", changedValues);
  useEffect(() => {
    if (product_details && product_details?.length) {
      const productsMap = {};
      product_details.forEach((product) => {
        productsMap[product.sku] = {
          ...product,
          quantity:
            localOrder?.order_items?.find(
              (item) => item.product_sku === product.sku
            )?.product_qty || 0,
        };
        productsMap[product?.product_code] = {
          ...product,
          quantity:
            localOrder?.order_items?.find(
              (item) => item.product_sku === product.sku
            )?.product_qty || 0,
        };
      });
      setProductData(productsMap);
    }
  }, [product_details, localOrder])
  console.log("productData", productData);

  useEffect(() => {
    if (orderData?.data?.length) {
      const orderPostData1 = order.order_items.map((item) => ({
        order_po: order.order_po,
        product_sku: item.product_sku,
        product_guid: item.product_guid,
        product_qty: item.product_qty,
        product_image: {
          product_url_file:
            "https://",
          product_url_thumbnail:
            "https://",
        },
      }));

      setOrderPostData(orderPostData1);
      if (orderPostData1.length > 0) {
        dispatch(fetchProductDetails(orderPostData1));
        setLocalOrder(order);
      }
      dispatch(setCurrentOrderFullFillmentId(id));
    }
    // dispatch(getInventoryImages());
  }, [orderData, dispatch]);

  const handleProductCodeUpdate = () => {
    // Refresh logic (e.g., re-fetch order details)
    dispatch(
      fetchSingleOrderDetails({ accountId: customerInfo?.data?.account_id, orderFullFillmentId: id })
    );
    
  };
const changeStatus = useAppSelector((state) => state.ProductSlice.changeStatus);
  const [componentSize, setComponentSize] = useState<SizeType | "default">(
    "default"
  );
  const [stateData, setStateData] = useState<
    { label: string; value: string }[]
  >([]);

  const handleValuesChange = (changedValues: any, allValues: any) => {
    // Check if values have changed
    const hasChanged = Object.keys(initialValues).some(
      (key) => initialValues[key] !== allValues[key]
    );
    console.log("hasChanged:", hasChanged);
    console.log("changedValues:", changedValues);
    if(changedValues?.state_code){
      changedValues.state_code = convertUsStateAbbrAndName(changedValues.state_code);
    }

    // Exclude 'address_2' when checking for all fields filled
    const requiredFields = Object.keys(allValues).filter(
      (key) => key !== "address_2" && key !== "company_name"
    );

    console.log("requiredFields:", requiredFields);
    const allFieldsFilled = requiredFields.every((key) => {
      const fieldValue = allValues[key];
      return (
        fieldValue !== undefined && fieldValue !== null && fieldValue !== ""
      );
    });
    console.log("allFieldsFilled:", allFieldsFilled);

    dispatch(updateOrderStatus({ status: allFieldsFilled, clicked: false }));

    const updatedOrder = {
      ...order,
      recipient: {
        ...allValues,
        ...changedValues, // Include only the updated recipient fields
      },
    };

    dispatch(setUpdatedValues(updatedOrder));
    setChangedValues(prevChangedValues => ({
      ...prevChangedValues,
      ...changedValues
    }));
    setIsModified(hasChanged);
  };
  console.log("vol", updatedValues);

  const setStates = (value: string = "us") => {
    console.log("vav", value)
    let states = getStates(value);
    let data: countryType[] = (states || []).map((d: string) => ({
      label: d,
      value: d,
    }));

    setStateData(data);
  };

  const onChange = (value: string) => {
    console.log(`selected ${value}`);
    setStates(value?.toLowerCase());
  };

  const onSearch = (value: string) => {
    console.log("search:", value);
    //setStates(value);
  };

  // Filter `option.label` match the user type `input`
  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    setStates();
  }, []);

  useEffect(() => {
    if (quantityUpdated) {
      setTimeout(() => {
        dispatch(
          fetchSingleOrderDetails({
            accountId: customerInfo?.data?.account_id, 
            orderFullFillmentId: id,
          })
        );
        dispatch(setQuantityUpdated(false));
        setclicking(false);
      }, 1500);
    }
  }, [quantityUpdated, orderPostData, dispatch, id]);
  console.log("quantityUpdated", quantityUpdated);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const displayTurtles = (
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 24 }}
      layout="horizontal"
      initialValues={initialValues}
      onValuesChange={handleValuesChange}
      className="w-full flex flex-col items-center gap-0"
      form={form}
      size="small"
    >
      <Form.Item
        name="country_code"
        className="w-full "
        rules={[{ required: true, message: "Please Enter Country Nmae" }]}
      >
        <div className="relative">
          <Select
            allowClear
            className="fw-input1 "
            showSearch
            defaultValue={"US"}
            onChange={onChange}
            onSearch={onSearch}
            filterOption={filterOption}
            options={countryList}
          ></Select>
          <label htmlFor="floating_outlined" className="fw-label">
            Country
          </label>
        </div>
      </Form.Item>

      <div className="relative w-full">
        <Form.Item
          name="company_name"
          className="w-full "
          rules={[{ required: false }]}
        >
          <Input
            className="fw-input"
            value={recipient?.company_name || ""}
            id="company_name"
          />
        </Form.Item>
        <label htmlFor="floating_outlined" className="fw-label">
          Company Name
        </label>
      </div>

      <div className="relative w-full ">
        <Form.Item
          name="first_name"
          className="w-full"
          rules={[{ required: true, message: "Please enter your First Name!" }]}
        >
          <Input className="fw-input" id="first_name" name="first_name" />
        </Form.Item>
        <label htmlFor="floating_outlined" className="fw-label">
          First Name
        </label>
      </div>
      <div className="relative w-full">
        <Form.Item
          name="last_name"
          className="w-full "
          rules={[{ required: true, message: "Please enter your Last Name" }]}
        >
          <Input className="fw-input" id="last_name" />
        </Form.Item>
        <label htmlFor="floating_outlined" className="fw-label">
          Last Name
        </label>
      </div>

      <div className="relative w-full">
        <Form.Item
          name="address_1"
          className="w-full "
          rules={[{ required: true, message: "Please enter your Address" }]}
        >
          <Input className="fw-input" id="address_1" />
        </Form.Item>
        <label htmlFor="floating_outlined" className="fw-label">
          Address Line 1
        </label>
      </div>

      <div className="relative w-full">
        <Form.Item
          name="address_2"
          className="w-full "
          rules={[{ required: false }]}
        >
          <Input className="fw-input" />
        </Form.Item>
        <label htmlFor="floating_outlined" className="fw-label">
          Address Line 2
        </label>
      </div>

      <div className="relative w-full">
        <Form.Item
          name="city"
          className="w-full "
          rules={[{ required: true, message: "Please enter your City" }]}
        >
          <Input className="fw-input" id="city" />
        </Form.Item>
        <label htmlFor="floating_outlined" className="fw-label">
          City
        </label>
      </div>

      <div className="relative w-full">
        <Form.Item
          name="state_code"
          className="w-full "
          rules={[{ required: true, message: "Please enter your state" }]}
        >
          <Select
            placeholder="State"
            id="state"
            allowClear
            showSearch
            className="fw-input1 "
            filterOption={filterOption}
            options={stateData}
            value={recipient?.state_code || ""}
          >
            
          </Select>
        </Form.Item>
        <label htmlFor="floating_outlined" className="fw-label">
              State
            </label>
      </div>

      <div className="relative w-full">
        <Form.Item
          name="zip_postal_code"
          className="w-full "
          rules={[{ required: true, message: "Please enter Zip Postal Code" }]}
        >
          <Input className="fw-input" id="zip_postal_code" />
        </Form.Item>
        <label htmlFor="floating_outlined" className="fw-label">
          Zip
        </label>
      </div>

      <div className="relative w-full">
        <Form.Item
          name="phone"
          className="w-full "
          rules={[
            { required: false, message: "Please enter Your Phone Number" },
          ]}
        >
          <Input 
            className="fw-input" 
            value={phoneValue} 
            disabled={!isPhoneEditable}
            style={!isPhoneEditable ? { 
              backgroundColor: "#f5f5f5", 
              color: "#999", 
              cursor: "not-allowed" 
            } : {}}
            placeholder={isPhoneEditable ? "Enter phone number" : "Phone from billing info"}
          />
        </Form.Item>
        <label htmlFor="floating_outlined" className="fw-label">
          Phone {isPhoneEditable ? "(Recipient)" : "(From Billing)"}
        </label>
      </div>

      <TextArea rows={4} maxLength={6} />

    </Form>
  );

  
  console.log("localorder", localOrder);

  return (
    <div
      className={`flex max-md:flex-col justify-end items-start w-full h-full p-4 pl-6 ${style.card}`}
    >
      <div className="w-[28%] max-md:w-full md:border-r-2 max-md:pb-4 max-md:border-b-2">
        <div className="container mx-auto px-3 py-1 lg:px-4 justify-center items-center">
          <div className="flex flex-wrap">
            <p className="text-lg text-gray-400 py-2 font-bold">Recipient</p>
            {displayTurtles}
          </div>
        </div>
      </div>

      <div className={`w-[52%] max-md:w-full flex flex-col justify-start md:border-r-2  max-md:border-b-2 max-md:pb-6  items-center h-[800px] max-md:h-auto ${style.edit_order_card}`}>
        <div
          className={`text-left w-full px-3 text-gray-400 pt-4 overflow-y-auto scrollbar-thin ${style.customscrollbar} ${style.inner_card} `}
        >
          <div className="w-full flex justify-between items-center relative ">
            <p className="text-lg pb-4 text-gray-400  font-bold bg-slate-50 w-9/12">
              Cart
            </p>
            <ProductOptions
              id={id}
              onProductCodeUpdate={handleProductCodeUpdate}
              localorder={localOrder}
              setOpenModal={setOpenModal}
            />
          </div>
          {localOrder?.order_items?.map((item, index) => (
            <div key={index} className="mb-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {localOrder?.order_items?.length > 0 && !validSKU.includes(item.product_sku?.toString()) ? (
                /* Invalid SKU Card */
                <div className="p-4 bg-red-50">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-sm font-semibold text-red-600">Invalid SKU Detected</h2>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    SKU: <span className="font-mono bg-white px-2 py-0.5 rounded border border-red-200 text-red-600">{item?.product_sku}</span>
                  </p>
                  <button
                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-600 bg-white hover:bg-red-50"
                    onClick={() => { setOpenModal(true); setProductCode(true); }}
                  >
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Valid SKU
                  </button>
                </div>
              ) : (
                /* Valid Product Card */
                <div className="p-4">
                  {/* Top Row: Image + Info + Quantity */}
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                      {(() => {
                        const originalImageUrl = getImageUrl(item, item?.product_sku);
                        const imageKey = `${item?.product_sku}-${item?.product_guid}`;
                        const currentImageUrl = getCurrentImageUrl(imageKey, originalImageUrl);
                        const hasError = imageErrors[imageKey];
                        
                        if (currentImageUrl && !hasError) {
                          return (
                            <img
                              key={`${imageKey}-${imageUrlIndex[imageKey] || 0}`}
                              src={currentImageUrl}
                              alt="product"
                              className="w-full h-full object-contain"
                              onError={() => handleImageError(imageKey, originalImageUrl)}
                              onLoad={() => setImageErrors(prev => { const n = { ...prev }; delete n[imageKey]; return n; })}
                            />
                          );
                        } else {
                          return (
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          );
                        }
                      })()}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      {productData[item.product_sku] ? (
                        <>
                          <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
                            {productData[item.product_sku]?.name || 'Untitled Product'}
                          </h3>
                          
                          {/* Labels with keys */}
                          {productData[item.product_sku]?.labels?.length > 1 && (
                            <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ${
                              expandedDescriptions.has(item.product_sku) ? 'max-h-[300px]' : 'max-h-[80px]'
                            }`}>
                              {productData[item.product_sku]?.labels.slice(1).map((label: any, idx: number) => (
                                <div key={idx} className="text-[11px] text-gray-600 leading-tight">
                                  <span className="text-blue-600 font-medium">{label.key}:</span> {label.value}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Expand/Collapse */}
                          {productData[item.product_sku]?.labels?.length > 5 && (
                            <button
                              onClick={(e) => toggleDescription(item.product_sku, e)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-medium mt-1 flex items-center gap-0.5"
                            >
                              {expandedDescriptions.has(item.product_sku) ? 'Show less' : 'Show more'}
                              <svg className={`w-3 h-3 transition-transform ${expandedDescriptions.has(item.product_sku) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </>
                      ) : (
                        <Skeleton active paragraph={{ rows: 2 }} />
                      )}
                    </div>

                    {/* Quantity Control */}
                    <div className="flex-shrink-0">
                      <Quantity
                        quantity={productData[item.product_sku]?.quantity || item.product_qty}
                        clicking={clicking}
                        setclicking={setclicking}
                        orderFullFillmentId={id}
                        product_guid={item?.product_guid}
                      />
                    </div>
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {/* Delete Button */}
                      <button
                        type="button"
                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => { setProductGuid(item.product_guid); setDeleteMessageVisible(true); }}
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <DeleteMessage
                        visible={DeleteMessageVisible}
                        onClose={setDeleteMessageVisible}
                        onDeleteProduct={onDeleteProduct}
                        deleteItem={product_guid}
                        order_po=""
                      />
                      
                      {/* Change Image Button - only show if product_sku starts with "AP" */}
                      {item.product_sku?.toString().startsWith("AP") && (
                        <button
                          onClick={() => {
                            setSelectedProductForImageChange({
                              order_po: localOrder?.order_po?.toString(),
                              orderFullFillmentId: parseInt(id || "0"),
                              product_sku: item.product_sku,
                            });
                            setIframeOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Change Image
                        </button>
                      )}
                    </div>
                    
                    {/* Price */}
                    <div className="text-sm font-semibold text-gray-900">
                      {clicking || product_status === "loading" || !product_details?.find(
                        (product) => product.sku === item.product_sku || product.product_code === item.product_sku
                      )?.total_price ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 text-xs">Calculating...</span>
                          <Spin indicator={<LoadingOutlined spin />} size="small" />
                        </div>
                      ) : (
                        <span className="text-green-600">
                          ${product_details?.find((el) => el.product_guid === item.product_guid)?.total_price || item.per_item_price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {(
          <UpdatePopup
            ChangedValues={changedValues}
            visible={orderEdited.clicked}
            onClose={() => dispatch(updateOrderStatus({ status: false, clicked: false }))}
            
          /> 
          
        ) || null}

        {/* File Management Iframe for changing product images */}
        <FileManagementIframe
          iframe={iframeOpen}
          setIframe={(value: boolean) => {
            setIframeOpen(value);
            if (!value) {
              setSelectedProductForImageChange(null);
            }
          }}
          selectedProductForImageChange={selectedProductForImageChange}
        />
      </div>

      <div className="w-[20%] max-md:w-full mt-1">
        <div className="container mx-auto px-3 py-2 lg:px-4 justify-start items-center">
          <div className="flex flex-wrap">
            <p className="text-base my-1 pb-2 text-gray-400 text-left font-bold">
              Shippings & Totals
            </p>
            <div className="block w-full text-gray-400 text-right">
              <SelectShippingOption
                key={productchange}
                poNumber={localOrder?.order_po?.toString()}
                orderItesm={localOrder?.order_items}
                onShippingOptionChange={handleShippingOptionChange}
                localOrder={localOrder}
                productchange={productChanged}
                clicking={clicking}
              />
            </div>
            <NewProduct/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrder;
