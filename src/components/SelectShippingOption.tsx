import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Select, Form } from "antd";
import { useAppSelector } from "../store";
import Spinner from "./Spinner";
import { updateCurrentOption } from "../store/features/shippingSlice";
import { useAppDispatch } from "../store";
import { updateOrdersInfo } from "../store/features/orderSlice";

interface ShippingOption {
  id?: number | string;
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

const findMatchingOptionByShippingCode = (options: ShippingOption[], targetCode: any) => {
  if (!options || options.length === 0 || targetCode == null || targetCode === '') return null;

  const targetStr = String(targetCode).trim().toLowerCase();
  const targetNum = Number(targetCode);
  const isTargetNum = !isNaN(targetNum);

  // 1. Match by shipping_code (e.g. "GD", "EX", "FC", "2D", "PL", "PP", "1D", "F2")
  const matchByCode = options.find(
    (opt) => opt.shipping_code && String(opt.shipping_code).trim().toLowerCase() === targetStr
  );
  if (matchByCode) return matchByCode;

  // 2. Match by shipping_class_code (e.g. "EX", "ON")
  const matchByClass = options.find(
    (opt) => opt.shipping_class_code && String(opt.shipping_class_code).trim().toLowerCase() === targetStr
  );
  if (matchByClass) return matchByClass;

  // 3. Match by numeric ID (e.g. 81, 5, 2, 44, 73, 29, 36, 52)
  if (isTargetNum) {
    const matchById = options.find(
      (opt) => opt.id !== undefined && Number(opt.id) === targetNum
    );
    if (matchById) return matchById;
  }

  return null;
};

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
    const dispatch = useAppDispatch();

    const orders = useAppSelector((state) => state.order.orders || []);
    const shipping_option = useAppSelector(
      (state) => state.Shipping.shippingOptions || []
    );
    const customerinfo = useAppSelector((state) => state.Customer.customer_info);

    const currentOption = useAppSelector((state) => state.Shipping.currentOption);
    // Ref so we can read the latest currentOption inside effects without
    // putting it in the dependency array (which would cause dispatch → currentOption
    // → effect → dispatch → ∞ loops).
    const currentOptionRef = React.useRef(currentOption);
    currentOptionRef.current = currentOption;

    const shipping_details = useMemo(
      () => shipping_option?.find((option) => option.order_po === poNumber),
      [shipping_option, poNumber]
    );

    const [selectedOption, setSelectedOption] = useState<any>(null);

    // Clear local state when currentOption is null (after logout/purge)
    useEffect(() => {
      if (!currentOption) {
        setSelectedOption(null);
      }
    }, [currentOption]);

    // Set initial preferred option if available

    useEffect(() => {
      if (shipping_details && shipping_details.options && shipping_details.options.length > 0) {
        const latestCurrentOption = currentOptionRef.current;

        // 1. Read the order's shipping_code from orders.data (e.g. "GD")
        const orderShippingCode = orders?.data?.find(
          (order: any) => String(order.order_po) === String(poNumber)
        )?.shipping_code;

        // 2. Try to match shipping_code against available shipping_details.options
        const codeMatchedOption = findMatchingOptionByShippingCode(
          shipping_details.options,
          orderShippingCode
        );

        // 3. Find if there's a stored user-selected option in currentOption
        const currentOrderOption = latestCurrentOption?.allOptions?.find(
          (opt: StoredOption) => opt.order_po === poNumber
        )?.selectedOption;

        // Priority:
        // A: Option matching order.shipping_code from orders.data
        // B: Previously stored selected option
        // C: API preferred_option
        // D: First option in list
        const optionToSet =
          codeMatchedOption ||
          currentOrderOption ||
          shipping_details.preferred_option ||
          shipping_details.options[0] ||
          null;

        if (optionToSet) {
          setSelectedOption((prev: any) => {
            if (JSON.stringify(prev) === JSON.stringify(optionToSet)) return prev;
            return optionToSet;
          });

          const existingOptions = latestCurrentOption?.allOptions || [];
          const updatedOptions = existingOptions.some(
            (opt: StoredOption) => opt.order_po === poNumber
          )
            ? existingOptions.map((opt: StoredOption) =>
              opt.order_po === poNumber ? { order_po: poNumber, selectedOption: optionToSet } : opt
            )
            : [...existingOptions, { order_po: poNumber, selectedOption: optionToSet }];

          if (JSON.stringify(existingOptions) !== JSON.stringify(updatedOptions)) {
            dispatch(updateCurrentOption({ allOptions: updatedOptions }));
          }
        }
      }
    }, [
      shipping_details,
      poNumber,
      shipping_option,
      orders?.data,
      dispatch,
    ]);

    // Sync selectedOption whenever fresh shipping data arrives for this order.
    // After a quantity update the API returns new calculated_total values — we
    // find the option in the fresh data that matches the currently-selected
    // shipping method so the subtotal/grand-total display updates automatically.
    useEffect(() => {
      if (!shipping_option || !poNumber || !shipping_details?.options?.length) return;

      const orderShippingCode = orders?.data?.find(
        (order: any) => String(order.order_po) === String(poNumber)
      )?.shipping_code;

      const codeMatchedOption = findMatchingOptionByShippingCode(
        shipping_details.options,
        orderShippingCode
      );

      const currentMethodKey = selectedOption && selectedOption.rate !== undefined && selectedOption.shipping_method
        ? `${selectedOption.rate}-$${selectedOption.shipping_method}`
        : null;

      const freshOptions: ShippingOption[] = shipping_details.options || [];

      const matchedOption = currentMethodKey
        ? freshOptions.find(
          (opt: ShippingOption) =>
            `${opt.rate}-$${opt.shipping_method}` === currentMethodKey
        )
        : null;

      const nextOption =
        codeMatchedOption ||
        matchedOption ||
        shipping_details.preferred_option ||
        freshOptions[0] ||
        null;

      const prevTotal = JSON.stringify(selectedOption?.calculated_total);
      const nextTotal = JSON.stringify(nextOption?.calculated_total);
      if (prevTotal === nextTotal && selectedOption?.shipping_code === nextOption?.shipping_code) return;

      setSelectedOption(nextOption);

      const existingOptions = currentOption?.allOptions || [];
      const updatedOptions = existingOptions.some(
        (opt: StoredOption) => opt.order_po === poNumber
      )
        ? existingOptions.map((opt: StoredOption) =>
          opt.order_po === poNumber
            ? { order_po: poNumber, selectedOption: nextOption }
            : opt
        )
        : [...existingOptions, { order_po: poNumber, selectedOption: nextOption }];

      dispatch(updateCurrentOption({ allOptions: updatedOptions }));
      onShippingOptionChange(poNumber, nextOption?.calculated_total);
    }, [shipping_option, poNumber, orders?.data]);

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
          // Determine if we should use option.id or option.shipping_class_code
          let shippingCodeValue = option?.id !== undefined ? option.id : option?.shipping_class_code;

          // If the value is numeric (or numeric string), convert it to a number
          if (shippingCodeValue !== undefined && shippingCodeValue !== null && shippingCodeValue !== '') {
            const isNumeric = !isNaN(Number(shippingCodeValue));
            if (isNumeric) {
              shippingCodeValue = Number(shippingCodeValue);
            }
          }

          const updatedOrder = {
            ...updateOrder,
            shipping_code: shippingCodeValue,
          };

          // Update only the single exact order that needs updating in the request
          const data = {
            orders: [updatedOrder],
            accountId: customerinfo?.data?.account_id,
            account_key: customerinfo?.data?.account_key,
          };

          dispatch(updateOrdersInfo(data));
        }

        if (option) {
          setSelectedOption(option);

          // Update only this order's option in the allOptions array
          const existingOptions = currentOption?.allOptions || [];
          const updatedOptions = existingOptions.map((opt: StoredOption) => {
            if (opt.order_po === poNumber) {
              return {
                order_po: poNumber,
                selectedOption: option,
              };
            }
            return opt;
          });

          // If this order doesn't exist in the array yet, add it
          if (
            !existingOptions.some(
              (opt: StoredOption) => opt.order_po === poNumber
            )
          ) {
            updatedOptions.push({
              order_po: poNumber,
              selectedOption: option,
            });
          }

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
    // console.log("productchange", productchange);

    // NOTE: Shipping fetching is handled centrally by ImportList via dispatchShippingSelectively.
    // SelectShippingOption must NOT fetch shipping itself — having one fetch per mounted order
    // instance causes each to call setBatchShippingResults (which REPLACES shippingOptions with
    // only that order's data), destroying all other orders' options and leaving them stuck on the
    // spinner. This component is display-only; it reads from the Redux shippingOptions array.

    // console.log("productchange", productchange);

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
    }, [shipping_details, currentOption, productchange, poNumber]);
    // console.log("shipping_details", shipping_details);

    if (!shipping_details || clicking) {
      return (
        <div className="flex-col items-center text-center p-12">
          {" "}
          <Spinner message={"Retrieving shipping options"} />{" "}
        </div>
      );
    } else if (currentOption === null) {
      return (
        <div className="flex-col items-center text-center p-12">
          {" "}
          <p className="text-gray-500 text-center text-sm font-medium">
            Shipping Locked
          </p>
          <p className="text-gray-400 text-center text-xs mt-1">
            Fix invalid SKUs to unlock
          </p>
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
                  selectedOption && selectedOption.rate !== undefined && selectedOption.shipping_method
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

        <div className="w-full pt-3"></div>
        <div className="w-full text-[12px] text-gray-700 leading-tight flex justify-between"><span className="text-blue-600 font-medium">Sub Total</span><span>${subTotal.toFixed(2)}</span></div>
        <div className="w-full text-[12px] text-gray-700 leading-tight flex justify-between"><span className="text-blue-600 font-medium">Discount</span><span>(${discount.toFixed(2)})</span></div>
        <div className="w-full text-[12px] text-gray-700 leading-tight flex justify-between"><span className="text-blue-600 font-medium">Shipping</span><span>${shipping.toFixed(2)}</span></div>
        <div className="w-full text-[12px] text-gray-700 leading-tight flex justify-between"><span className="text-blue-600 font-medium">Sales Tax</span><span>${salesTax.toFixed(2)}</span></div>
        <div className="w-full text-[12px] text-gray-700 leading-tight flex justify-between"><span className="text-blue-600 font-medium">Grand Total</span><span>${grandTotal}</span></div>
        {/* <div className="w-full text-[12px] text-gray-700 leading-tight"><span className="text-amber-500 font-medium">Account Credit:</span> ${accountCredit}</div> */}
      </>
    );
  };

export default SelectShippingOption;

