import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Select, Form } from "antd";
import { useAppSelector } from "../store";
import Spinner from "./Spinner";
import { updateCurrentOption } from "../store/features/shippingSlice";
import { useAppDispatch } from "../store";
import { fetchShippingOption } from "../store/features/shippingSlice";
import { updateOrdersInfo } from "../store/features/orderSlice";

interface ShippingOption {
  rate: number;
  shipping_method: string;
  order_po: string;
  preferred_option?: any;
  shipping_class_code?: string;
  shipping_code?: string;
  options?: ShippingOption[];
  calculated_total: {
    order_subtotal: number;
    order_discount: number;
    order_shipping_rate: number;
    order_sales_tax: number;
    order_grand_total: number;
    order_credits_used: number;
    order_po?: string;
  };
}

interface OrderItem {
  product_qty: number;
  product_sku: string;
  product_order_po: string;
  product_image: {
    product_url_file: string;
    product_url_thumbnail: string;
  };
}

interface StoredOption {
  order_po: string;
  selectedOption: ShippingOption;
}

const SelectShippingOption: React.FC<{
  poNumber: string;
  orderItems: any;
  localOrder: any;
  productchange: any;
  clicking: boolean;

  onShippingOptionChange: (poNumber: string, total: number) => void;
}> = ({
  poNumber,
  orderItems,
  onShippingOptionChange,
  localOrder,
  productchange,
  clicking,
}) => {
  console.log("popo", poNumber);
  console.log("localOrder", localOrder);
  const dispatch = useAppDispatch();

  const orders = useAppSelector((state) => state.order.orders || []);
  const shipping_option = useAppSelector(
    (state) => state.Shipping.shippingOptions || []
  );
  const customerinfo = useAppSelector((state) => state.Customer.customer_info);
  console.log("shipping_option", shipping_option);
  console.log("shipping_option", shipping_option);

  let currentOption = useAppSelector((state) => state.Shipping.currentOption);
  console.log("currentOption", currentOption);

  const shipping_details = useMemo(
    () => shipping_option?.find((option) => option.order_po === poNumber),
    [shipping_option, poNumber]
  );
  console.log("shipping_details", shipping_details);
  const [selectedOption, setSelectedOption] = useState<any>([]);
  console.log("selectedOption", selectedOption);
  console.log("pooooo", poNumber);
  // Set initial preferred option if available


  useEffect(() => {
    if (shipping_details) {
      // Find the current order's option in the store
      let currentOrderOption = currentOption?.allOptions?.find(
        (opt: StoredOption) => opt.order_po === poNumber
      );

      if (currentOrderOption?.selectedOption ) {
        // If we have a previously selected option in the store, use that
        const orderShippingCode = orders?.data?.find(
          (order: any) => order.order_po == poNumber
        )?.shipping_code;

        console.log("orderShippingCode", orderShippingCode);
        const orderCodeToShippingOption =
          currentOrderOption?.selectedOption?.options?.find(
            (option: ShippingOption) => {
              if(currentOrderOption?.selectedOption?.options?.length > 1){
                console.log("option", option);
                return option.shipping_code == orderShippingCode
              }else{
                return option
              }
              
            }
          );
        console.log("orderCodeToShippingOption", orderCodeToShippingOption);
        setSelectedOption(
          orderCodeToShippingOption
            ? orderCodeToShippingOption
            : currentOrderOption?.selectedOption
        );
        console.log("firsteval");
        console.log("currentOrderOption", currentOrderOption);
      } else if(!currentOrderOption?.selectedOption) {
        // If no previously selected option, use the preferred option
        console.log("evava", localOrder);
        const shippingOption = shipping_option?.find(
          (option: ShippingOption) => option.order_po == poNumber
        );
        setSelectedOption(shippingOption);
        console.log("secondeval");
        // console.log("sop", orders.find((order: any) => order.order_po == poNumber)?.shipping_code,)
        // Update the store with all current shipping options
        dispatch(
          updateCurrentOption({
            allOptions: shipping_option.map((opt: ShippingOption) => ({
              order_po: opt.order_po,
              selectedOption:
                opt.order_po == poNumber
                  ? shippingOption
                  : currentOption?.allOptions?.find(
                      (stored: StoredOption) => stored.order_po == opt.order_po
                    )?.selectedOption,
            })),
          })
        );
      }
    }
  }, [
    shipping_details,
    poNumber,
    currentOption,
    shipping_option,
    orders,
    dispatch,
  ]);

  // Add new useEffect to sync currentOption with shipping_option updates
  useEffect(() => {
    if (shipping_option && poNumber) {
      const currentShippingOption = shipping_option.find(
        (option: ShippingOption) => option.order_po === poNumber
      );
      console.log("currentShippingOption", currentShippingOption);

      if (currentShippingOption) {
        // Get existing options or initialize
        const existingOptions = currentOption?.allOptions || [];
        console.log("existingOptions", existingOptions);
        
        // Create updated options array
        const updatedOptions = existingOptions.map((opt: StoredOption) => {
          if (opt.order_po === poNumber) {
            // Update the matching order with latest shipping option
            return {
              order_po: poNumber,
              selectedOption: currentShippingOption
            };
          }
          return opt;
        });

        // If order not found in existing options, add it
        if (!existingOptions.some((opt: StoredOption) => opt.order_po === poNumber)) {
          updatedOptions.push({
            order_po: poNumber,
            selectedOption: currentShippingOption
          });
        }

        // Update the store
        dispatch(
          updateCurrentOption({
            allOptions: updatedOptions
          })
        );

        // Update selected option state
        setSelectedOption(currentShippingOption);
      }
    }
  }, [shipping_option, poNumber, dispatch]);


  const handleOptionChange = useCallback(
    (value: string, order: any) => {
      const option = shipping_details?.options?.find(
        (opt: ShippingOption) => `${opt.rate}-$${opt.shipping_method}` === value
      );

      // Find the order to update
      const updateOrder = orders?.data?.find(
        (od: any) => od.order_po == order.calculated_total.order_po
      );

      if (updateOrder && orders?.data) {
        // Create new order with updated shipping code
        const updatedOrder = {
          ...updateOrder,
          shipping_code: option?.shipping_code,
        };

        // Map through all orders and only update the matching one
        const updatedOrders = orders.data.map((ord: any) =>
          ord.order_po === updatedOrder.order_po ? updatedOrder : ord
        );

        // Update with all orders, not just the single one
        const data = {
          orders: updatedOrders,
          accountId: customerinfo?.data?.account_id,
        };

        dispatch(updateOrdersInfo(data));
      }

      if (option) {
        setSelectedOption(option);

        // Get current options from store
        const currentOptions =
          currentOption?.allOptions ||
          shipping_option.map((opt) => ({
            order_po: opt.order_po,
            selectedOption: opt.preferred_option,
          }));

        // Update the specific order's option while preserving others
        const updatedOptions = currentOptions.map((opt) => ({
          order_po: opt.order_po,
          selectedOption:
            opt.order_po === poNumber ? option : opt.selectedOption,
        }));

        // Update store with new options
        dispatch(
          updateCurrentOption({
            allOptions: updatedOptions,
          })
        );

        onShippingOptionChange(poNumber, option?.calculated_total);
      }
    },
    [
      shipping_details,
      poNumber,
      onShippingOptionChange,
      dispatch,
      shipping_option,
      orders,
      currentOption,
    ]
  );
  console.log("productchange", productchange);
 

  useEffect(() => {
    if (
      (localOrder?.order_items?.length > 0 || productchange ) 
    ) {
      console.log("firedddd", currentOption);
      const orderPostDataList = {
        order_po: localOrder.order_po,
        order_items: localOrder.order_items.map((item: OrderItem) => ({
          product_order_po: localOrder.order_po,
          product_qty: item.product_qty,
          product_sku: item.product_sku,
          product_image: {
            product_url_file:
              "https://inventory.finerworks.com/81de5dba-0300-4988-a1cb-df97dfa4e372/s173618563107067060__shutterstock_2554522269/thumbnail/200x200_s173618563107067060__shutterstock_2554522269.jpg",
            product_url_thumbnail:
              "https://inventory.finerworks.com/81de5dba-0300-4988-a1cb-df97dfa4e372/s173618563107067060__shutterstock_2554522269/thumbnail/200x200_s173618563107067060__shutterstock_2554522269.jpg",
          },
        })),
      };
      console.log("Product changed, refetching shipping options");
      dispatch(fetchShippingOption([orderPostDataList]));
    }
  }, [localOrder, productchange, dispatch]);

  console.log("productchange", productchange);

  useEffect(() => {
    if (productchange) {
      if (shipping_details?.preferred_option) {
        setSelectedOption(shipping_details.preferred_option);
        // Update current option in store with order_po
        dispatch(
          updateCurrentOption({
            ...shipping_details.preferred_option,
            order_po: poNumber,
          })
        );
      } else if (currentOption?.order_po === poNumber) {
        // Only update if the current option is for this order
        setSelectedOption(
          shipping_details?.options.find(
            (opt: ShippingOption) => opt.rate === currentOption.rate
          )
        );
      }
    }
  }, [shipping_details, currentOption, productchange, poNumber, dispatch]);
  console.log("shipping_details", shipping_details);

  if (!shipping_details || clicking) {
    return (
      <div className="flex-col items-center text-center p-12">
        {" "}
        <Spinner message={"Retrieving shipping options"} />{" "}
      </div>
    );
  }

  const subTotal = selectedOption?.calculated_total?.order_subtotal || 0;
  const discount = selectedOption?.calculated_total?.order_discount || 0;
  const shipping = selectedOption?.calculated_total?.order_shipping_rate || 0;
  const salesTax = selectedOption?.calculated_total?.order_sales_tax || 0;
  const grandTotal = selectedOption?.calculated_total?.order_grand_total || 0;
  const accountCredit =
    selectedOption?.calculated_total?.order_credits_used || 0;
  return (
    <>
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        className="w-full country_code_importlist_form"
      >
        <Form.Item name="shipping_option">
          <div className="relative w-full text-gray-500">
            <Select
              className="w-full"
              showSearch={false}
              placeholder="Select Shipping Method"
              optionFilterProp="children"
              onChange={(value: string, order: any) =>
                handleOptionChange(value, selectedOption)
              }
              dropdownStyle={{ touchAction: "manipulation" }}
              getPopupContainer={(trigger) => trigger.parentNode}
              listHeight={250}
              dropdownMatchSelectWidth={false}
              value={
                selectedOption
                  ? `${selectedOption.rate}-$${selectedOption.shipping_method}`
                  : undefined
              }
              options={shipping_details?.options?.map(
                (option: ShippingOption) => ({
                  value: `${option.rate}-$${option.shipping_method}`,
                  label: `${option.shipping_method} - $${option.rate}`,
                })
              )}
            />
            <label htmlFor="shipping_method" className="fw-label">
              Shipping Method
            </label>
          </div>
        </Form.Item>
      </Form>

      <div className="w-full text-sm pt-5"></div>
      <div className="w-full text-sm">Sub Total: ${subTotal.toFixed(2)}</div>
      <div className="w-full text-sm">Discount: (${discount.toFixed(2)})</div>
      <div className="w-full text-sm">Shipping: ${shipping.toFixed(2)}</div>
      <div className="w-full text-sm">Sales Tax: ${salesTax.toFixed(2)}</div>
      <div className="w-full text-sm">GrandTotal: ${grandTotal}</div>
      {/* <div className="w-full text-sm text-amber-500">Account Credit: ${accountCredit}</div> */}
    </>
  );
};

export default SelectShippingOption;
