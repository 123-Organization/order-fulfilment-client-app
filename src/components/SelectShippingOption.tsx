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

    // Clear local state whenever there is no shipping data for this specific order.
    // This covers three cases:
    //   1. Logout / store purge (currentOption null + no shipping_details)
    //   2. Refresh / delete where clearAllShippingCache wiped shipping_details
    //      but currentOption.allOptions still has stale entries — without this
    //      guard the component would briefly show stale selections until new data lands.
    // We intentionally do NOT gate on currentOption here — shipping_details absence
    // is the authoritative signal that this order's data is gone.
    useEffect(() => {
      if (!shipping_details) {
        setSelectedOption(null);
      }
    }, [shipping_details]);

    // Set initial preferred option if available

    /**
     * Find the best shipping option for this order from a fresh shipping entry.
     * Priority:
     *   1. Match by order.shipping_code against option.id (numeric) or option.shipping_code (string)
     *   2. Fall back to the API-provided preferred_option
     *   3. Fall back to the first available option
     */
    const resolveOptionByShippingCode = (
      shippingEntry: any,
      orderShippingCode: string | number | null | undefined
    ): any => {
      const options: any[] = shippingEntry?.options || [];

      if (orderShippingCode != null && orderShippingCode !== '') {
        const numericCode = Number(orderShippingCode);
        const isNumeric = !isNaN(numericCode);

        const matched = options.find((opt: any) => {
          // Numeric id match  (e.g. shipping_code "36" → option.id 36)
          if (isNumeric && opt.id === numericCode) return true;
          // String shipping_code match  (e.g. "GD" → option.shipping_code "GD")
          if (opt.shipping_code === String(orderShippingCode)) return true;
          return false;
        });

        if (matched) return matched;
      }

      // No match — fall back to preferred_option or first available
      return shippingEntry?.preferred_option ?? options[0] ?? null;
    };

    useEffect(() => {
      if (shipping_details) {
        // Always read the latest currentOption via ref — avoids putting it
        // in deps which would cause dispatch → currentOption → re-run → dispatch ∞ loop.
        const latestCurrentOption = currentOptionRef.current;

        // Find the current order's option in the store
        const currentOrderOption = latestCurrentOption?.allOptions?.find(
          (opt: StoredOption) => opt.order_po === poNumber
        );

        // Get the order's shipping_code so we can match the correct option
        const orderShippingCode = orders?.data?.find(
          (order: any) => order.order_po == poNumber
        )?.shipping_code;

        if (currentOrderOption?.selectedOption) {
          // A previous selection exists in the store. Re-resolve from the live
          // shipping_details using shipping_code in case the data refreshed
          // (e.g. after a quantity change) so the rate/calculated_total is current.
          // NOTE: we read options from shipping_details (the live entry) NOT from
          // currentOrderOption.selectedOption (a single option object with no options[]).
          const resolvedOption = resolveOptionByShippingCode(shipping_details, orderShippingCode);

          // Guard: only update local state if the value actually changed
          setSelectedOption((prev: any) => {
            if (JSON.stringify(prev) === JSON.stringify(resolvedOption)) return prev;
            return resolvedOption;
          });

          if (resolvedOption?.calculated_total) {
            const existingOptions = latestCurrentOption?.allOptions || [];
            const updatedOptions = existingOptions.map((opt: StoredOption) => {
              if (opt.order_po === poNumber) {
                return { order_po: poNumber, selectedOption: resolvedOption };
              }
              return opt;
            });

            // Guard: only dispatch if the options actually changed
            if (JSON.stringify(existingOptions) !== JSON.stringify(updatedOptions)) {
              dispatch(updateCurrentOption({ allOptions: updatedOptions }));
            }
            onShippingOptionChange(poNumber, resolvedOption?.calculated_total);
          }

        } else if (!currentOrderOption?.selectedOption) {
          // No previously stored selection — resolve from shipping_code.
          const shippingEntry = shipping_option?.find(
            (option: ShippingOption) => option.order_po == poNumber
          );
          const resolvedOption = resolveOptionByShippingCode(shippingEntry, orderShippingCode);

          // Guard: only update local state if the value actually changed
          setSelectedOption((prev: any) => {
            if (JSON.stringify(prev) === JSON.stringify(resolvedOption)) return prev;
            return resolvedOption;
          });

          if (shippingEntry && resolvedOption) {
            const existingOptions = latestCurrentOption?.allOptions || [];
            const orderExists = existingOptions.some(
              (opt: StoredOption) => opt.order_po === poNumber
            );

            if (!orderExists) {
              const updatedOptions = [
                ...existingOptions,
                { order_po: poNumber, selectedOption: resolvedOption },
              ];
              dispatch(updateCurrentOption({ allOptions: updatedOptions }));
            }
            if (resolvedOption?.calculated_total) {
              onShippingOptionChange(poNumber, resolvedOption?.calculated_total);
            }
          }
        }
      }
    }, [
      shipping_details,
      poNumber,
      shipping_option,
      orders,
      dispatch,
      // NOTE: currentOption intentionally NOT here — read via currentOptionRef.current
      // to prevent dispatch(updateCurrentOption) → currentOption change → re-run → ∞ loop.
    ]);

    // Sync selectedOption whenever fresh shipping data arrives for this order.
    // After a quantity update the API returns new calculated_total values — we
    // find the option in the fresh data that matches the currently-selected
    // shipping method so the subtotal/grand-total display updates automatically.
    useEffect(() => {
      if (!shipping_option || !poNumber) return;

      const freshShippingEntry = shipping_option.find(
        (option: ShippingOption) => option.order_po === poNumber
      );
      if (!freshShippingEntry) return;

      const freshOptions: ShippingOption[] = freshShippingEntry.options || [];

      // Determine the currently active shipping method key so we can find the
      // matching entry in the refreshed options list.
      const currentMethodKey = selectedOption?.rate != null && selectedOption?.shipping_method != null
        ? `${selectedOption.rate}-$${selectedOption.shipping_method}`
        : null;

      // Try to find the same shipping method in the new data (preserves user selection).
      const matchedByMethod = currentMethodKey
        ? freshOptions.find(
          (opt: ShippingOption) =>
            `${opt.rate}-$${opt.shipping_method}` === currentMethodKey
        )
        : null;

      // When no current method is selected (selectedOption is null — e.g. just after a
      // refresh), resolve by shipping_code instead of blindly using preferred_option.
      // This prevents the sync effect from racing with the init effect and overwriting
      // the shipping_code-matched selection with preferred_option.
      const orderShippingCode = !matchedByMethod && !currentMethodKey
        ? orders?.data?.find((o: any) => o.order_po == poNumber)?.shipping_code
        : null;

      const nextOption =
        matchedByMethod ||
        (orderShippingCode != null
          ? resolveOptionByShippingCode(freshShippingEntry, orderShippingCode)
          : null) ||
        freshShippingEntry.preferred_option ||
        freshShippingEntry.options?.[0] ||
        null;

      // Nothing to set — data may still be arriving, bail out.
      if (!nextOption) return;

      // Don't overwrite a fully-resolved selectedOption with a fallback that has
      // no calculated_total yet. This prevents the flicker during progressive
      // batch loading where early chunks provide raw shipping entries (no totals)
      // that would replace an already-correct value set by the main init effect.
      if (selectedOption?.calculated_total && !nextOption?.calculated_total) return;

      // Only update if calculated_total actually changed (avoids render loops).
      const prevTotal = JSON.stringify(selectedOption?.calculated_total);
      const nextTotal = JSON.stringify(nextOption?.calculated_total);
      if (prevTotal === nextTotal) return;

      setSelectedOption(nextOption);

      // Persist the refreshed option into the Redux currentOption store so
      // the grand-total in ImportList (read from currentOption.allOptions) is
      // also updated.
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
    }, [shipping_option, poNumber]);


    const handleOptionChange = useCallback(
      (value: string, order: any) => {

        const option = shipping_details?.options?.find(
          (opt: ShippingOption) => `${opt.rate}-$${opt.shipping_method}` === value
        );

        // Find the order to update
        const updateOrder = orders?.data?.find(
          (od: any) => od.order_po == order.calculated_total.order_po
        );

        if (updateOrder) {
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

          // Send only the single changed order — no need to include all orders
          // in the payload since the API updates only the orders provided.
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

