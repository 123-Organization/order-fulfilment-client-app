import React, { useEffect, useState } from "react";
import { Button, Checkbox, Form, Input, Select, Skeleton } from "antd";
import Spinner from "../components/Spinner";
import shoppingCart from "../assets/images/shopping-cart-228.svg";
import { updateCheckedOrders } from "../store/features/orderSlice";
import locked_Shipment from "../assets/images/package-delivery-box-8-svgrepo-com.svg";
import {
  fetchOrder,
} from "../store/features/orderSlice";
import { fetchShippingOption} from "../store/features/shippingSlice";
import { fetchProductDetails } from "../store/features/productSlice";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { useNavigate } from "react-router-dom";
import parse from "html-react-parser";
import SelectShippingOption from "../components/SelectShippingOption";
import style from "./Pgaes.module.css";
const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]["size"];

const ImportList: React.FC = () => {
  interface Product {
    sku: string;
    image_url_1: string;
    description_long: string;
  }

  const [productData, setProductData] = useState<{ [key: string]: Product }>(
    {}
  );
  const [orderPostData, setOrderPostData] = useState([]);
  const orders = useAppSelector((state) => state.order.orders);
  const product_details = useAppSelector(
    (state) => state.ProductSlice.product_details?.data?.product_list
  );
  console.log(orderPostData);
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  console.log("product_details...", product_details);
  const dispatch = useAppDispatch();
  console.log("productdata", productData);
   const shipping_option = useAppSelector(
     (state) => state.Shipping.shippingOptions || []
   );
  console.log("shipping_option", shipping_option);
  const navigate = useNavigate();

  const AddProductsTemplate = () => {
    return (
      <div className="flex-col justify-center  content-center w-full  h-full text-center border">
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


  useEffect(() => {
    if (orders && !orders?.data?.length) {
      dispatch(fetchOrder(1556));
    }
  }, []);

  let products: any = {};
  useEffect(() => {
    if (product_details && product_details?.length) {
      product_details?.map((product, index) => {
        products[product.sku] = product;
      });

      console.log("products", products);
      setProductData(products);
    }
  }, [product_details]);

  useEffect(() => {
    if (orders?.data?.length && !orderPostData.length) {
      const validOrders = orders?.data?.filter(
        (order) => order?.order_items && order?.order_items?.length > 0
      );
      const orderPostDataList = validOrders
        ?.map((order) => ({
          order_po: order?.order_po,
          order_items: order.order_items?.map((item) => ({
            product_order_po: item.product_order_po,
            product_qty: item.product_qty,
            product_sku: item.product_sku,
          })),
        }))
        ?.flat();

      const ProductDetails = orders?.data?.flatMap((order) =>
        order.order_items?.map((item) => ({
          order_po: order.order_po,
          product_sku: item.product_sku, // One product SKU per object
          product_qty: item.product_qty, // Corresponding quantity
        }))
      );

      dispatch(fetchShippingOption(orderPostDataList));
      setOrderPostData(orderPostDataList);
      dispatch(fetchProductDetails(ProductDetails));
    }
  }, [orders, product_details, orderPostData, dispatch]);

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    console.log("value", value);

    if (checked) {
      dispatch(updateCheckedOrders([...checkedOrders, value]));
    } else {
      dispatch(
        updateCheckedOrders(
          checkedOrders.filter((order) => order.order_po !== value.order_po)
        )
      );
    }
  };

  const getShippingPrice = (order_po) => {
    const shippingForOrder = shipping_option.find(
      (option) => option.order_po === order_po
    );
    if (shippingForOrder && shippingForOrder.options.length) {
      const selectedOption = shippingForOrder?.preferred_option; // or apply logic to select a specific shipping option
      return selectedOption?.calculated_total?.order_grand_total;
    }else 

    return 0; // Default value if no shipping option is found
  };

  const handleShippingOptionChange = (order_po: string, updatedPrice: number) => {
    let updatedOrders = [...checkedOrders];
  
    // Check if the order is already in checkedOrders
    const orderIndex = updatedOrders.findIndex((order) => order.order_po === order_po);
  
    if (orderIndex !== -1) {
      // Update the shipping price for the existing order
      updatedOrders[orderIndex] = {
        ...updatedOrders[orderIndex],
        Product_price: updatedPrice,
      };
    } else {
      // Add the order with the updated shipping price
      updatedOrders.push({
        order_po,
        Product_price: updatedPrice,
      });
    }
  
    dispatch(updateCheckedOrders(updatedOrders));
  };

  return (
    <div className="flex justify-end items-center  h-full p-8">
      <div className="h-auto bg-gray-100 pt-4 w-full">
        <h1 className="mb-10 text-left pl-9 text-2xl font-bold">Orders</h1>
        <div className="mx-auto max-w-7xl justify-center px-6 md:flex md:space-x-6 xl:px-0">
          <div className="rounded-lg md:w-full">
            {orders &&
              orders?.data?.length &&
              orders?.data?.map((order, index) => (
                <div
                  key={index}
                  className="justify-between mb-6  rounded-lg bg-white p-6 shadow-md sm:flex-row sm:justify-start space-y-2 "
                >
                  <ul className="grid w-8   md:grid-cols-1 ">
                    <li className="w-8">
                      {shipping_option.length > 0 &&
                      order?.order_items.length > 0 ? (
                        <Checkbox
                          value={{
                            order_po: order?.order_po,
                            Product_price: getShippingPrice(order?.order_po),
                          }}
                          onChange={(e) => handleCheckboxChange(e)}
                          checked={checkedOrders.some(
                            (checkedOrder) =>
                              checkedOrder.order_po == order.order_po
                          )}
                        />
                      ) : null}
                    </li>
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
                            {order?.recipient?.address1}
                          </div>
                          <div className="w-full text-sm">
                            {order?.recipient?.address2}{" "}
                            {order?.recipient?.address3}
                          </div>
                          <div className="w-full text-sm">
                            {order?.recipient?.city},{" "}
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
                                to={
                                  "/editorder/" + order?.orderFullFillmentId
                                }
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
                        order?.order_items?.map((order) => (
                          <label className="h-[220px] inline-flex mb-2 justify-between w-full hover:border-gray-600 transition-all duration-75 pt-5 pb-5 px-2 text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                            <div className="block relative pb-4 w-full">
                              <img src={shoppingCart} width="26" height="26" />
                              <div className="justify-between pt-4  rounded-lg  sm:flex sm:justify-start flex">
                                <div className="w-[50%] ">
                                  {productData[order?.product_sku]
                                    ?.image_url_1 ? (
                                    <img
                                      src={
                                        productData[order?.product_sku]
                                          ?.image_url_1
                                      }
                                      alt="product"
                                      className="rounded-lg max-md:w-40 w-32 h-[120px] "
                                      width={125}
                                      height={26}
                                    />
                                  ) : (
                                    <Skeleton.Image active />
                                  )}
                                </div>

                                <div className="w-[90%]  ">
                                  {(Object.keys(productData)?.length && (
                                    <div className=" flex flex-col w-full sm:justify-between p-2 ">
                                      <div
                                        className={`w-full text-sm ${style.order_description} font-seri `}
                                      >
                                        {parse(
                                          productData[order?.product_sku]
                                            ?.description_long || ""
                                        )}
                                      </div>
                                    </div>
                                  )) || <Skeleton active />}
                                </div>
                              </div>
                              <div className=" text-sm  absolute right-2 -bottom-3">
                                {order?.product_qty} @ $
                                {productData[order?.product_sku]?.total_price ||
                                  ""}
                              </div>
                            </div>
                          </label>
                        ))
                      ) : (
                        <AddProductsTemplate />
                      )}
                    </li>
                    <li>
                      <label className="h-[220px] inline-flex  justify-between w-full p-5 text-gray-500 bg-white border-21 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                        <div className="block w-full">
                          {order.order_items.length > 0 ? (
                            <SelectShippingOption
                              poNumber={order?.order_po}
                              orderItesm={order?.order_items}
                              onShippingOptionChange={
                                handleShippingOptionChange
                              }
                            />
                          ) : (
                            <div className="flex justify-center ">
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
              ))}
          </div>

          {/* <div className="mt-6 h-full rounded-lg border bg-white p-6 shadow-md md:mt-0 md:w-1/3">
            <div className="mb-2 flex justify-between">
              <p className="text-gray-700">Subtotal</p>
              <p className="text-gray-700">$129.99</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-700">Shipping</p>
              <p className="text-gray-700">$4.99</p>
            </div>
            <hr className="my-4" />
            <div className="flex justify-between">
              <p className="text-lg font-bold">Total</p>
              <div className="">
                <p className="mb-1 text-lg font-bold">$134.98 USD</p>
                <p className="text-sm text-gray-700">including VAT</p>
              </div>
            </div>
             <button className="mt-6 w-full rounded-md bg-blue-500 py-1.5 font-medium text-blue-50 hover:bg-blue-600">Check out</button> 
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ImportList;
