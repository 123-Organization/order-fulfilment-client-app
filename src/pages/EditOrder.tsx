import React, { useEffect, useState } from "react";
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
import { setUpdatedValues } from "../store/features/orderSlice";
import DeleteMessage from "../components/DeleteMessage";
import { useNotificationContext } from "../context/NotificationContext";
import { LoadingOutlined } from "@ant-design/icons";
import { Flex, Spin } from "antd";
import { setQuantityUpdated } from "../store/features/productSlice";
import convertUsStateAbbrAndName from "../services/state";
import NewProduct from "../components/NewProduct";
import { updateOrdersInfo } from "../store/features/orderSlice";

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
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const notificationApi = useNotificationContext();
  const updatedValues =
    useAppSelector((state) => state.order.updatedValues) || {};
  const orders = useAppSelector((state) => state.order.orders);
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  console.log("updatedValues", updatedValues);
  const orderData = useAppSelector((state) => state.order.order) || {};
  console.log("orderData", orderData);
  const order = orderData.data ? orderData.data[0] : {};
  const { id } = useParams<{ orderFullFillmentId: string }>();
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

  const [productData, setProductData] = useState({});
  const [orderPostData, setOrderPostData] = useState([]);
  const [form] = Form.useForm(); // Create form instance
  const [isModified, setIsModified] = useState(false); // Track if values are modified
  const [changedValues, setChangedValues] = useState<any>({});
  const [localOrder, setLocalOrder] = useState(order);
  const[stateCodeShort, setStateCodeShort] = useState(recipient?.state)
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
  const filterDescription = (descriptionLong: string): string => {
    return descriptionLong?.replace(/<[^>]*>?/gm, "");
  };
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
    updatedPrice: number
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
        Product_price: {grand_total: updatedPrice?.order_grand_total},
      };
    } else {
      // Add the order with the updated shipping price
      console.log("updatedPrice", updatedPrice);
      updatedOrders.push({
        order_po,
        Product_price: {grand_total: updatedPrice?.order_grand_total},
      });
    }

    dispatch(updateCheckedOrders(updatedOrders));
  };

  useEffect(()=>{
// updateOrderStatus()
  }, [])

  //send the orders array without the dedeleted product object
  const onDeleteProduct = (product_guid) => {
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
  const hasRecipientPhone = Boolean(recipient?.phone && recipient.phone.trim());
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
      state: recipient?.state || stateCodeShort,
      zip_postal_code: recipient?.zip_postal_code.toString() || "",
      phone: phoneValue,
    }),
    [order, recipient, phone, phoneValue]
  );
  // console.log("initialValues",convertUsStateAbbrAndName(recipient?.state ))

  useEffect(() => {
    if(recipient?.state_code){
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
      wrapperCol={{ span: windowWidth > 1080 ? 14 : 24 }}
      layout="horizontal"
      initialValues={initialValues}
      onValuesChange={handleValuesChange}
      className="w-full flex flex-col items-center  "
      form={form}
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
          name="state"
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
            value={recipient?.state || ""}
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

  
  console.log("changeStatus", changeStatus);

  return (
    <div
      className={`flex max-md:flex-col  justify-end items-start w-full h-full p-8 ${style.card}`}
    >
      <div className="w-1/3 max-md:w-full md:border-r-2 max-md:pb-4 max-md:border-b-2">
        <div className="container mx-auto px-5 py-2 lg:px-8 md:px-4 justify-center items-center">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
            <p className="text-lg text-gray-400 py-4 font-bold">Recipient</p>
            {displayTurtles}
          </div>
        </div>
      </div>

      <div className={`w-1/2 max-md:w-full flex flex-col justify-start md:border-r-2  max-md:border-b-2 max-md:pb-6  items-center h-[800px] max-md:h-auto ${style.edit_order_card}`}>
        <div
          className={`text-left w-full px-4 text-gray-400 pt-4 overflow-y-auto scrollbar-thin ${style.customscrollbar} ${style.inner_card} `}
        >
          <div className="w-full flex justify-between items-center relative ">
            <p className="text-lg pb-4 text-gray-400  font-bold bg-slate-50 w-9/12">
              Cart
            </p>
            <ProductOptions
              id={id}
              onProductCodeUpdate={handleProductCodeUpdate}
              localorder={localOrder}
            />
          </div>
          {localOrder?.order_items?.map((item, index) => (
            <div className={`h-[230px] mt-2 hover:border-gray-500 max-md:h-[230px] inline-flex overflow-y-auto scrollbar-thin justify-between w-full ${ validSKU.includes(item.product_sku?.toString()) ? "px-3" : "px-0"} text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700`}>
              {localOrder?.order_items?.length > 0 && !validSKU.includes(item.product_sku?.toString()) ? (
                <div className="block relative w-full h-full bg-red-50 rounded-lg">
                  <div className="flex h-full">
                    <div className="flex flex-col w-full">
                      <div className="flex items-center mb-4 px-4 pt-4">
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
                        <h2 className="text-base font-semibold text-red-600">
                          Invalid SKU Detected
                        </h2>
                      </div>
                      <div className="px-4 mb-4">
                        <p className="text-gray-600 text-sm mb-2">
                          Current SKU:{" "}
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-red-200 text-red-600">
                            {item?.product_sku}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          This SKU is not recognized in the system.
                          Please add a valid SKU to proceed with your order.
                        </p>
                      </div>
                      <div className="mt-auto px-4 pb-4">
                        <button
                          className="w-40 h-8 inline-flex items-center justify-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                          onClick={() => {
                            setOpenModal(true);
                            setProductCode(true);
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
                          Add Valid SKU
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="block relative pb-4 w-full">
                  <div className="justify-around pt-4 rounded-lg flex ">
                    <div className="flex pt-8 ">
                      {productData[item.product_sku]?.image_url_1 ? (
                        <img
                          src={
                            item?.product_url_thumbnail
                              ? item?.product_url_thumbnail
                              : productData[item?.product_sku].image_url_1
                          }
                          alt="product"
                          className={`max-md:w-20 w-40 h-[100px] ${style.product_image} `}
                          width={116}
                          height={26}
                        />
                      ) : (
                        <Skeleton.Image active className="mr-40" />
                      )}

                      <div className="sm:ml-4 flex flex-col w-full sm:justify-between max-md:px-2">
                        {(Object.keys(productData)?.length && (
                          <div
                            className={`w-12/12 text-sm ${style.product_decription} `}
                          >
                            {filterDescription(
                              productData[item.product_sku]?.description_long
                            )?.substring(0, 130)}
                          </div>
                        )) || <Skeleton active />}
                      </div>
                    </div>
                    <div className="h-9">
                      <Quantity
                        quantity={
                          productData[item.product_sku]?.quantity ||
                          item.product_qty
                        }
                        clicking={clicking}
                        setclicking={setclicking}
                        orderFullFillmentId={id}
                        product_guid={item?.product_guid }
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center w-full absolute bottom-0 left-0 px-3 py-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <button
                        data-tooltip-target="tooltip-document"
                        type="button"
                        className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group"
                        onClick={() => {
                          setProductGuid(item.product_guid);
                          setDeleteMessageVisible(true);
                        }}
                      >
                        <svg
                          className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-blue-500"
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
                      <DeleteMessage
                        visible={DeleteMessageVisible}
                        onClose={setDeleteMessageVisible}
                        onDeleteProduct={onDeleteProduct}
                        deleteItem={product_guid}
                      />
                      {productCode && (
                        <Button
                          key="submit"
                          className="text-gray-500 border border-gray-400 rounded-lg text-center font-semibold"
                          size="small"
                          onClick={() => setOpenModal(true)}
                          style={{ backgroundColor: "#f5f4f4" }}
                          type="link"
                        >
                          Add / Change Image
                        </Button>
                      )}
                      <FilesGallery
                        open={openModal}
                        setOpenModal={setOpenModal}
                        productImage={productData[item.product_sku]?.image_url_1}
                      />
                    </div>
                    <div className="text-sm font-medium">
                      {clicking ||
                      product_status === "loading" ||
                      !product_details?.find(
                        (product) => product.sku  === item.product_sku || product.product_code === item.product_sku
                      )?.total_price ? (
                        <div className="flex items-center gap-2">
                          <p className="text-red-400 text-xs">
                            Calculating price...
                          </p>
                          <Spin
                            indicator={<LoadingOutlined spin />}
                            size="default"
                          />
                        </div>
                      ) : (
                        `$${
                          product_details?.find((element) => {
                            return element.product_guid === item.product_guid
                          })?.total_price ||  item.per_item_price
                        }`
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
            onClose={() => dispatch(updateOrderStatus({ clicked: false }))}
            
          /> 
          
        ) || null}
      </div>

      <div className="w-1/3 max-md:w-full mt-1">
        <div className="container mx-auto px-5 py-8 md:py-2 lg:px-8 md:px-4 justify-start items-center">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
            <p className="text-lg my-2 pb-4 text-gray-400 text-left font-bold">
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
