import React, { useEffect, useState } from "react";
import { Button, Checkbox, Form, Input, Select } from "antd";
import shoppingCart from "../assets/images/shopping-cart-228.svg";
import { updateCheckedOrders } from "../store/features/orderSlice";
import {
  fetchOrder,
  fetchProductDetails,
  fetchShippingOption,
} from "../store/features/orderSlice";
import { useAppDispatch, useAppSelector } from "../store";
import { useNavigate } from "react-router-dom";
import parse from "html-react-parser";
import SelectShippingOption from "../components/SelectShippingOption";

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
    (state) => state.order.product_details?.data?.product_list
  );
  console.log(orderPostData);
  const checkedOrders = useAppSelector((state) => state.order.checkedOrders);
  console.log("product_details...", product_details);
  const dispatch = useAppDispatch();
  console.log("productdata", productData);

  const navigate = useNavigate();

  const handleEditOrderClick = (order) => {
    navigate("/editorder", { state: { order } });
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
      const orderPostDataList = orders?.data?.map((order) => ({
        order_po: order?.orders[0]?.order_po,
        product_sku: order?.orders[0]?.order_items[0]?.product_sku,
        product_qty: order?.orders[0]?.order_items[0]?.product_qty,
      }));

      console.log("orderPostData...", orderPostDataList);

      // Dispatch the entire order list to fetch shipping options
      dispatch(fetchShippingOption(orderPostDataList));

      setOrderPostData(orderPostDataList);

      dispatch(fetchProductDetails(orderPostDataList));
    }
  }, [orders]);
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    console.log("value", value);

    if (checked) {
      dispatch(updateCheckedOrders([...checkedOrders, value]));
    } else {
      dispatch(
        updateCheckedOrders(
          checkedOrders.filter(
            (order) => order.product_sku !== value.product_sku
          )
        )
      );
    }
  };
  console.log("Orders", orders);

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
                  className="justify-between mb-6 rounded-lg bg-white p-6 shadow-md sm:flex sm:justify-start"
                >
                  <ul className="grid w-8  md:grid-cols-1">
                    <li className="w-8">
                      <Checkbox
                        value={{
                          product_sku:
                            order?.orders[0]?.order_items[0]?.product_sku,
                          Product_price:
                            productData[
                              order?.orders[0]?.order_items[0]?.product_sku
                            ]?.total_price,
                        }}
                        onChange={handleCheckboxChange}
                        checked={checkedOrders.some(
                          (checkedOrder) =>
                            checkedOrder.product_sku ===
                            order?.orders[0]?.order_items[0]?.product_sku
                        )}
                      />
                    </li>
                  </ul>
                  <ul className="grid w-full gap-6 md:grid-cols-3">
                    <li className="">
                      <label className="h-[220px] inline-flex items-center justify-between w-full p-5 text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                        <div className="block">
                          <div className="w-full text-sm">
                            {order?.orders[0]?.order_po}
                          </div>
                          <div className="w-full text-sm pt-2 pb-2 font-semibold">
                            Ship To
                          </div>
                          <div className="w-full text-sm">
                            {order?.orders[0]?.recipient?.first_name}{" "}
                            {order?.orders[0]?.recipient?.last_name}
                          </div>
                          <div className="w-full text-sm">
                            {order?.orders[0]?.recipient?.address1}
                          </div>
                          <div className="w-full text-sm">
                            {order?.orders[0]?.recipient?.address2}{" "}
                            {order?.orders[0]?.recipient?.address3}
                          </div>
                          <div className="w-full text-sm">
                            {order?.orders[0]?.recipient?.city},{" "}
                            {order?.orders[0]?.recipient?.province}{" "}
                            {order?.orders[0]?.recipient?.zip_postal_code}
                          </div>
                          <div className="w-full text-sm">
                            {order?.orders[0]?.recipient?.country_code}
                          </div>
                          <div className="w-full pt-3">
                            <Button
                              key="submit"
                              className="   w-full text-gray-500"
                              size={"small"}
                              type="default"
                              href="#/editorder"
                              onClick={() => handleEditOrderClick(order)}
                            >
                              Edit order
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
                      <label className="h-[220px] inline-flex  justify-between w-full p-5 text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                        <div className="block relative pb-4 w-full">
                          <img src={shoppingCart} width="26" height="26" />
                          <div className="justify-between pt-6  rounded-lg  sm:flex sm:justify-start">
                            <img
                              src={
                                productData[
                                  order?.orders[0]?.order_items[0].product_sku
                                ]?.image_url_1
                              }
                              alt="product-image"
                              className="rounded-lg"
                              width={116}
                              height={26}
                            />
                            {Object.keys(productData)?.length && (
                              <div className="sm:ml-4 flex flex-col w-full sm:justify-between">
                                <div className="w-full text-sm">
                                  {parse(
                                    productData[
                                      order?.orders[0]?.order_items[0]
                                        .product_sku
                                    ]?.description_long || ""
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className=" text-sm  absolute right-2 -bottom-3">
                            {order?.orders[0]?.order_items[0]?.product_qty} @
                            $75 ea{" "}
                          </div>
                        </div>
                      </label>
                    </li>
                    <li>
                      <label className="h-[220px] inline-flex  justify-between w-full p-5 text-gray-500 bg-white border-21 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                        <div className="block w-full">
                          <SelectShippingOption
                            poNumber={order?.orders[0]?.order_po}
                          />
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
