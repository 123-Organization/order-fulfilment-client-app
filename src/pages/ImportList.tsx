import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
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
  AddProductToOrder,
} from "../store/features/orderSlice";
import { fetchOrder } from "../store/features/orderSlice";
import { setBatchShippingResults, updateShippingCacheEntries, invalidateShippingCacheEntries, clearAllShippingCache } from "../store/features/shippingSlice";
import { clearProductData, clearSelectedImage, fetchProductDetails, clearProductDetails } from "../store/features/productSlice";
import ImageGalleryModal from "../components/ImageGalleryModal";
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
import { resetDeleteOrderStatus, resetRecipientStatus } from "../store/features/orderSlice";
import { resetSubmitedOrders } from "../store/features/orderSlice";
import SkeletonOrderCard from "../components/SkeletonOrderCard";
import {
  resetExcludedOrders,
  updateExcludedOrders,
  updateOrdersInfo,
} from "../store/features/orderSlice";
import { updateValidSKU, resetValidSKU, setShippingLoading } from "../store/features/orderSlice";
import PopupModal from "../components/PopupModal";
import VirtualInvModal from "../components/VirtualInvModal";
import ReplacingCode from "../components/ReplacingCode";
import { setProductData } from "../store/features/productSlice";
import { convertGoogleDriveUrl, isGoogleDriveUrl, getGoogleDriveImageUrls } from "../helpers/fileHelper";
import { useSearch } from "../context/SearchContext";
import { useCookies } from "react-cookie";
import config from "../config/configs";

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
  // Track which SKUs we've already fetched details for
  const fetchedSkusRef = useRef<Set<string>>(new Set());
  // Guard against the main shipping useEffect re-entering while a fetch batch is in-flight
  const shippingFetchInProgressRef = useRef(false);

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
  /** Clear orderPostData AND reset the in-flight shipping guard so the next
   *  render cycle can trigger a fresh fetch.  Always use this instead of
   *  calling resetOrderPostData() directly. */
  const resetOrderPostData = () => {
    shippingFetchInProgressRef.current = false;
    setOrderPostData([]);
  };
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
  // True while a SKU-replace or add-product API call is in-flight.
  // Prevents the empty-state screen from flashing during those ~2 s waits.
  const [isPendingUpdate, setIsPendingUpdate] = useState(false);
  // Tracks which order is waiting for a product to be added via post5 popup
  const pendingNewProductOrderId = useRef<string | null>(null);
  const cookiePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // State for product deletion within an order
  const [productDeleteModalVisible, setProductDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ product_guid: string; orderFullFillmentId: string; order_po: string } | null>(null);
  // State for expanded labels
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(new Set());
  // State for the image-gallery "change image" flow
  const [imageGalleryTarget, setImageGalleryTarget] = useState<{
    orderItem: any;
    order: any;
  } | null>(null);

  const toggleLabels = (productSku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedLabels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productSku)) {
        newSet.delete(productSku);
      } else {
        newSet.add(productSku);
      }
      return newSet;
    });
  };
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
  const recipientStatus = useAppSelector((state) => state.order.recipientStatus);
  const replaceCodeStatus = useAppSelector((state) => state.order.replaceCodeStatus);
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
  const recipientErrors = useAppSelector(
    (state) => state.Shipping.recipientErrors || {}
  );
  const itemErrors = useAppSelector(
    (state) => state.Shipping.itemErrors || {}
  );
  const navigate = useNavigate();
  /** In-memory cache of per-order shipping results. Used by dispatchShippingSelectively. */
  const shippingCache = useAppSelector((state) => state.Shipping.shippingCache);
  /** Ref so dispatchShippingSelectively reads latest cache without being in deps array. */
  const shippingCacheRef = useRef(shippingCache);
  // Keep ref current on every render
  shippingCacheRef.current = shippingCache;
  // ---------------------------------------------------------------------------
  // Shipping helpers — fingerprints + selective batch fetching
  // ---------------------------------------------------------------------------
  const SHIPPING_BATCH_SIZE = 5;
  const BASE_URL = config.SERVER_BASE_URL;

  /**
   * Build a stable fingerprint for an order from the fields the shipping API
   * actually uses: recipient, order_items (sku + qty), and shipping_code.
   * If none of these change, the cached result is still valid.
   */
  const buildOrderFingerprint = (order: any): string => {
    const r = order.recipient || {};
    const items = (order.order_items || [])
      .map((i: any) => `${i.product_sku}:${i.product_qty}`)
      .sort()
      .join(',');
    return [
      order.order_po,
      order.shipping_code || '',
      r.first_name || '',
      r.last_name || '',
      r.address_1 || '',
      r.address_2 || '',
      r.city || '',
      r.state_code || '',
      r.zip_postal_code || '',
      r.country_code || '',
      items,
    ].join('|');
  };

  /** Split an array into chunks of at most `size` elements */
  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  /**
   * Fetch shipping options for one order. Returns aggregated data/errors.
   * Does NOT dispatch to Redux — caller collects all results first.
   */
  const fetchSingleOrderShipping = async (
    order: any,
    account_key: string
  ): Promise<{
    data: any[];
    recipientErrors: Record<string, Record<string, string[]>>;
    itemErrors: Record<string, string[]>;
  }> => {
    const orderPo: string = order.order_po;
    const body = {
      account_key,
      orders: [{ order_po: order.order_po, order_key: null, recipient: order.recipient, order_items: order.order_items, shipping_code: order.shipping_code }],
    };
    try {
      const response = await fetch(`${BASE_URL}shipping-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const modelState: Record<string, string[]> = errData?.error?.ModelState || {};
        const recipientErrors: Record<string, Record<string, string[]>> = {};
        const itemErrors: Record<string, string[]> = {};
        Object.entries(modelState).forEach(([key, msgs]) => {
          const recipientMatch = key.match(/request\.orders\[0\]\.recipient\.(\w+)/);
          if (recipientMatch) {
            if (!recipientErrors[orderPo]) recipientErrors[orderPo] = {};
            recipientErrors[orderPo][recipientMatch[1]] = msgs as string[];
            return;
          }
          const itemMatch = key.match(/request\.orders\[0\]\.order_items\[\d+\]\.\w+/);
          if (itemMatch) {
            if (!itemErrors[orderPo]) itemErrors[orderPo] = [];
            (msgs as string[]).forEach(m => { if (!itemErrors[orderPo].includes(m)) itemErrors[orderPo].push(m); });
          }
        });
        console.log(`[shipping/single] errors for ${orderPo}:`, { recipientErrors, itemErrors });
        return { data: [], recipientErrors, itemErrors };
      }
      const json = await response.json();
      return { data: json.data || [], recipientErrors: {}, itemErrors: {} };
    } catch (err) {
      console.error(`[shipping/single] network error for ${orderPo}:`, err);
      return { data: [], recipientErrors: {}, itemErrors: {} };
    }
  };

  /**
   * Selective shipping fetch — only fires API requests for orders whose
   * fingerprint does NOT match the cached value.  For unchanged orders the
   * cached result is reused without any network round-trip.
   *
   * After collecting results, dispatches a single updateShippingCacheEntries
   * action which merges the new entries into the cache and rebuilds the
   * derived shippingOptions / recipientErrors / itemErrors in one Redux update.
   */
  const dispatchShippingSelectively = useCallback(
    async (orderList: any[]) => {
      if (!orderList?.length) return;
      const accountKey = customerInfo?.data?.account_key;

      // Filter to orders that are actual cache misses
      const ordersToFetch = orderList.filter(order => {
        const fp = buildOrderFingerprint(order);
        const cached = shippingCacheRef.current[order.order_po];
        return !cached || cached.fingerprint !== fp;
      });

      if (!ordersToFetch.length) {
        console.log('[shipping/cache] All orders cached — skipping API calls');
        return;
      }

      console.log(
        `[shipping/cache] Fetching ${ordersToFetch.length}/${orderList.length} orders (cache misses)`
      );

      const chunks = chunkArray(ordersToFetch, SHIPPING_BATCH_SIZE);
      const allEntries: Array<{
        order_po: string;
        fingerprint: string;
        data: any[];
        recipientErrors: Record<string, Record<string, string[]>>;
        itemErrors: Record<string, string[]>;
      }> = [];

      for (const chunk of chunks) {
        const results = await Promise.allSettled(
          chunk.map(order => fetchSingleOrderShipping(order, accountKey))
        );
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            allEntries.push({
              order_po: chunk[idx].order_po,
              fingerprint: buildOrderFingerprint(chunk[idx]),
              data: result.value.data,
              recipientErrors: result.value.recipientErrors,
              itemErrors: result.value.itemErrors,
            });
          }
        });
      }

      if (allEntries.length) {
        // Single Redux dispatch — merges into cache and rebuilds derived state
        dispatch(updateShippingCacheEntries(allEntries));
      }
    },
    [dispatch, customerInfo?.data?.account_key]
    // NOTE: shippingCacheRef is intentionally NOT in deps — it's a ref so reads
    // are always current without causing the callback to be recreated.
  );

  console.log("productData", productData);

  // Search functionality
  const { searchTerm } = useSearch();

  // Starts polling document.cookie every 1.5 s for the ofa_product cookie.
  // Once found, dispatches AddProductToOrder for the pending order and clears the cookie.
  const startCookiePolling = (orderFullFillmentId: string) => {
    // Stop any previously running poller
    if (cookiePollingRef.current) clearInterval(cookiePollingRef.current);
    pendingNewProductOrderId.current = orderFullFillmentId;

    cookiePollingRef.current = setInterval(() => {
      // Read raw cookie string to bypass the react-cookie cache
      const rawCookie = document.cookie
        .split("; ")
        .find(row => row.startsWith("ofa_product="));

      if (!rawCookie) return; // not set yet

      try {
        const rawValue = rawCookie.split("=").slice(1).join("=");
        const ofaProduct = JSON.parse(decodeURIComponent(rawValue));

        if (Array.isArray(ofaProduct) && ofaProduct.length > 0 && pendingNewProductOrderId.current) {
          const item = ofaProduct[0];
          const postData = {
            productCode: item.product_code,
            product_url_file: [item.thumbnail_url],
            product_url_thumbnail: [item.thumbnail_url],
            product_guid: item.id,
            skuCode: "",
            pixel_width: 1200,
            pixel_height: 900,
            orderFullFillmentId: pendingNewProductOrderId.current,
            account_key: cookies.AccountGUID,
            qty: item.qty ?? 1,
            mode: item.mode,
          };

          // Stop polling immediately before async work
          clearInterval(cookiePollingRef.current!);
          cookiePollingRef.current = null;
          pendingNewProductOrderId.current = null;

          // Clear the cookie
          document.cookie = "ofa_product=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
          document.cookie = "ofa_product=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.finerworks.com";
          document.cookie = "ofa_product=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=finerworks.com";

          // Show skeleton instead of empty-state while waiting for API
          setIsPendingUpdate(true);
          dispatch(AddProductToOrder(postData)).then(async (result: any) => {
            if (AddProductToOrder.fulfilled.match(result)) {
              notificationApi.success({
                message: "Product Added",
                description: "Product has been successfully added to the order.",
              });
              dispatch(updateValidSKU([...validSKUs, postData.productCode]));

              // 1. Wipe shipping cache — every order becomes a cache miss.
              dispatch(clearAllShippingCache());

              // 2. Await fetchOrder FIRST so orders.data already contains
              //    the new product before we open the shipping useEffect gate.
              //    Clearing orderPostData before this resolves causes the
              //    shipping useEffect to fire with stale orders.data, re-lock
              //    the gate, and block a re-run when fresh data arrives.
              await dispatch(fetchOrder(customerInfo?.data?.account_id));

              // 3. NOW clear orderPostData — the shipping useEffect fires with
              //    fresh orders.data + empty cache → fetches real prices → total updates.
              resetOrderPostData();
              setIsPendingUpdate(false);
            } else {
              notificationApi.error({
                message: "Product Addition Failed",
                description: "Could not add the product to the order.",
              });
              setIsPendingUpdate(false);
            }
          });
        }
      } catch (e) {
        console.error("[ofa_product] Cookie parse error:", e);
      }
    }, 1500);
  };

  // Cleanup poller on unmount
  useEffect(() => {
    return () => {
      if (cookiePollingRef.current) clearInterval(cookiePollingRef.current);
    };
  }, []);

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
        "ReturnUrl": "https://local.finerworks.com:3000" + window.location.hash,
      }
    };
    const encodedURI =
      "https://post5.finerworks.com/?source=ofa&settings=" +
      encodeURIComponent(JSON.stringify(postSettings));

    return [
      {
        key: "1",
        label: (
          <div
            className="flex items-center gap-3 px-2 py-1.5 text-gray-700 hover:text-emerald-600 transition-colors duration-200 cursor-pointer"
            onClick={() => {
              // Open the popup and start polling for the cookie response
              window.open(encodedURI, "_blank");
              startCookiePolling(orderFullFillmentId);
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
    // 1. Wipe shipping cache — every order becomes a cache miss.
    dispatch(clearAllShippingCache());
    // 2. Await fetchOrder so orders.data has the new product BEFORE we
    //    trigger the shipping useEffect by clearing orderPostData.
    await dispatch(fetchOrder(customerInfo?.data?.account_id));
    // 3. NOW clear orderPostData — shipping useEffect fires with fresh data + empty cache.
    resetOrderPostData();
    setIsRefreshing(false);
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
      resetOrderPostData();
      dispatch(updateValidSKU([...validSKUs, productCode]));
      dispatch(resetReplaceCodeStatus());
      dispatch(resetReplaceCodeResult());
    }, 2000);
  };
  console.log("checkedOrders", checkedOrders);

  useEffect(() => {
    if (replaceCodeResult !== undefined) {
      if (replaceCodeResult?.data && skuToReplace.length > 0) {
        setTimeout(() => {
          notificationApi.success({
            message: "Product Code Replaced",
            description: "Product code has been successfully replaced.",
          });
          dispatch(clearSelectedImage());
          dispatch(resetReplaceCodeResult());
          dispatch(fetchOrder(customerInfo?.data?.account_id));
          dispatch(clearProductData());
          resetOrderPostData();
        }, 2000);
      } else if (replaceCodeResult === null && skuToReplace.length > 0) {
        notificationApi.error({
          message: "Product Code not found",
          description: "Product code not found in the database.",
        });
      }
    }
  }, [replaceCodeResult, skuToReplace]);



  useEffect(() => {
    // Skip the first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only update if product_details has changed and is valid.
    // A product is considered valid when the API responded with isActiveSKU === true.
    // We key validSKUs on the product_guid so that placeholder-image products (which
    // have sku:null but a real product_code and isActiveSKU:true) are still treated
    // as valid, while truly invalid SKUs (isActiveSKU:false) are excluded.
    if (
      product_details &&
      Array.isArray(product_details) &&
      product_details.length > 0
    ) {
      const validCodes = product_details
        .filter((product: any) => product?.isActiveSKU !== false)
        .flatMap((product: any) => {
          const codes: string[] = [];
          if (product?.sku) codes.push(product.sku.toString());
          if (product?.product_code) codes.push(product.product_code.toString());
          if (product?.product_guid) codes.push(product.product_guid.toString());
          return codes;
        });

      // Only dispatch if validCodes is different from current validSKUs
      if (JSON.stringify(validCodes) !== JSON.stringify(validSKUs)) {
        dispatch(updateValidSKU(validCodes));
      }
    }
  }, [product_details, validSKUs]); // Keep only product_details as dependency

  // Keep your second useEffect separate
  useEffect(() => {
    if (orders?.data) {
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
  console.log("invalidSKuOrderFullilment", invalidSKuOrderFullilment);

  useEffect(() => {
    dispatch(resetSubmitedOrders());
  }, []);

  /**
   * When updateOrdersInfo resolves (recipientStatus = 'succeeded') OR a SKU replacement
   * resolves (replaceCodeStatus = 'succeeded'), reset orderPostData immediately so the
   * shipping useEffect re-fires and the total price updates without a manual Refresh.
   * For SKU replacements we also wipe the shipping cache so the stale fingerprint
   * (built from the old SKU) is discarded and a fresh fetch runs with the new SKU.
   */
  useEffect(() => {
    if (recipientStatus === 'succeeded') {
      resetOrderPostData();
      dispatch(resetRecipientStatus());
    }
  }, [recipientStatus, dispatch]);

  // Show skeleton while a SKU-replace is in-flight, hide when done/idle
  useEffect(() => {
    if (replaceCodeStatus === 'loading') {
      setIsPendingUpdate(true);
    } else if (replaceCodeStatus === 'succeeded') {
      // Wipe the entire shipping cache — the SKU changed so all fingerprints are stale
      dispatch(clearAllShippingCache());
      resetOrderPostData();
      dispatch(resetReplaceCodeStatus());
      // Keep skeleton a moment longer so the re-fetch has time to start
      setTimeout(() => setIsPendingUpdate(false), 800);
    } else if (replaceCodeStatus === 'failed') {
      setIsPendingUpdate(false);
    }
  }, [replaceCodeStatus, dispatch]);
  // console.log("wporder", wporder);

  // useEffect(() => {
  //   if (orders && !orders?.data?.length) {
  //     dispatch(fetchOrder(customerInfo?.data?.account_id));
  //   }
  // }, [orders]);

  useEffect(() => {
    // Skip the expensive initial fetch if we already have orders in Redux
    // AND the shipping cache is populated (i.e. the user navigated back, nothing changed).
    // The refresh button handles explicit re-fetching in that case.
    const hasOrders = Array.isArray(orders?.data) && orders.data.length > 0;
    const hasCachedShipping = Object.keys(shippingCacheRef.current).length > 0;

    if (hasOrders && hasCachedShipping) {
      console.log('[ImportList] Orders & shipping cache already populated — skipping mount fetch');
      return;
    }

    setTimeout(() => {
      dispatch(fetchOrder(customerInfo?.data?.account_id));
    }, 1000);
  }, []);
  // console.log("oo", customerInfo?.data?.account_id);

  /** Explicit full refresh — clears shipping cache + product detail cache, then reloads orders. */
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const handleRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    // 1. Wipe shipping cache so every order re-fetches shipping
    dispatch(clearAllShippingCache());
    // 2. Wipe the product SKU tracker and details so every SKU re-fetches
    fetchedSkusRef.current.clear();
    dispatch(clearProductDetails());
    // 3. Reset orderPostData (also resets in-flight guard) so the main shipping effect re-runs
    resetOrderPostData();
    // 4. Re-fetch orders from the server
    await dispatch(fetchOrder(customerInfo?.data?.account_id));
    setIsRefreshingOrders(false);
  };

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

  useEffect(() => {
    if (product_details && product_details?.length) {
      // Merge with existing productData — do NOT replace it wholesale.
      // product_details may be fetched in multiple batches (one per order),
      // so each batch must ADD to the accumulated map rather than reset it.
      setProductData((prev: any) => {
        const next = { ...prev };
        product_details.forEach((product: any) => {
          // SKU (may be null for products keyed only by product_code)
          if (product.sku != null) next[product.sku] = product;

          // product_code — store both original case and lowercase so mixed-case
          // order SKUs (e.g. "18M163M93S12x15" vs "18M163M93S12X15") both resolve
          if (product.product_code != null) {
            next[product.product_code] = product;
            next[product.product_code.toLowerCase()] = product;
          }

          // product_guid — the API returns it WITH dashes ("9ddd63d2-eae5-...")
          // but order items often store it WITHOUT dashes ("9ddd63d2eae5...").
          // Store both so the lookup works regardless of format.
          if (product.product_guid != null) {
            next[product.product_guid] = product;
            next[product.product_guid.replace(/-/g, '')] = product;
          }
        });
        return next;
      });
    }
  }, [product_details]);


  const onDeleteOrder = async (
    orderFullFillmentId: string,
    order_po: string
  ) => {
    // Proactively remove from shipping cache before the delete completes
    dispatch(invalidateShippingCacheEntries([order_po]));
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
    // Clear checked orders and the entire shipping cache
    dispatch(updateCheckedOrders([]));
    dispatch(clearAllShippingCache());
    dispatch(fetchOrder(customerInfo?.data?.account_id));
  };

  // Delete a product from an order
  const onDeleteProductFromOrder = (product_guid: string) => {
    if (!productToDelete) return;

    const { orderFullFillmentId, order_po } = productToDelete;

    // Find the order containing this product
    const orderToUpdate = orders?.data?.find(
      (order: any) => order.orderFullFillmentId === orderFullFillmentId
    );

    if (!orderToUpdate) {
      notificationApi.error({
        message: "Error",
        description: "Could not find the order to update.",
      });
      return;
    }

    // Remove the product from the order items
    const updatedOrderItems = orderToUpdate.order_items?.filter(
      (item: any) => item.product_guid !== product_guid
    );

    const updatedOrder = {
      ...orderToUpdate,
      order_items: updatedOrderItems,
    };

    // Update all orders with the modified order
    const updatedOrders = orders?.data?.map((order: any) => {
      if (order.orderFullFillmentId === orderFullFillmentId) {
        return updatedOrder;
      }
      return order;
    });

    // Format the data for the API
    const postData = {
      updatedValues: updatedOrders,
      customerId: customerInfo?.data?.account_id,
    };

    dispatch(updateOrdersInfo(postData))
      .then((result: any) => {
        if (updateOrdersInfo.fulfilled.match(result)) {
          notificationApi.success({
            message: "Product Deleted",
            description: "Product has been successfully deleted from the order.",
          });
          // Invalidate shipping cache for this specific order
          if (productToDelete?.order_po) {
            dispatch(invalidateShippingCacheEntries([productToDelete.order_po]));
          }
          // Refresh orders
          dispatch(fetchOrder(customerInfo?.data?.account_id));
          resetOrderPostData();
          // Clear the fetchedSkusRef to allow re-fetching product details
          fetchedSkusRef.current.clear();
        } else {
          notificationApi.error({
            message: "Error",
            description: "Failed to delete product from order.",
          });
        }
      })
      .catch((error: any) => {
        console.error("Error deleting product:", error);
        notificationApi.error({
          message: "Error",
          description: "An error occurred while deleting the product.",
        });
      });

    setProductDeleteModalVisible(false);
    setProductToDelete(null);
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
    if (shippingForOrder) {
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
      // Don't re-enter while a fetch batch is already in progress
      if (shippingFetchInProgressRef.current) return;

      const validOrders = orders?.data?.filter(
        (order) => (order?.order_items && order?.order_items?.length > 0) && order?.shipping_code != null && order?.shipping_code !== ""
      );
      console.log("validOrders", validOrders);

      // Short-circuit: if every valid order is already in the cache with a matching
      // fingerprint we don't need to fetch anything — avoid setting orderPostData
      // (which would cause a 2-second stale window when the ref is cleared later).
      const allCached = validOrders?.length > 0 && validOrders.every((order: any) => {
        const fp = buildOrderFingerprint(order);
        const cached = shippingCacheRef.current[order.order_po];
        return cached && cached.fingerprint === fp;
      });
      if (allCached) {
        console.log('[shipping/effect] All valid orders cached — skipping fetch');
        return;
      }

      const orderPostDataList = validOrders
        ?.map((order) => ({
          order_po: order?.order_po,
          recipient: order?.recipient,
          shipping_code: order?.shipping_code,
          order_items: order.order_items?.map((item) => ({
            product_order_po: item.product_order_po,
            product_qty: item.product_qty,
            product_sku: item.product_sku || "AP1234567891011",
            product_image: {
              product_url_file: "https://via.placeholder.com/150",
              product_url_thumbnail: "https://via.placeholder.com/150",
            },


          })),
        }))
        ?.flat();
      let ProductDetails = orders?.data?.flatMap((order) =>
        order.order_items?.map((item) => ({
          order_po: order.order_po,
          product_sku: item.product_sku || "AP1234567891011",
          product_guid: item.product_guid || crypto.randomUUID(),
          product_qty: item.product_qty,
          product_image: {
            product_url_file: "https://via.placeholder.com/150",
            product_url_thumbnail: "https://via.placeholder.com/150",
          },
        }))
      );

      // Filter out SKUs that are already in the persisted Redux store
      const existingSkus = new Set<string>();
      if (product_details && Array.isArray(product_details)) {
        product_details.forEach((p: any) => {
          if (p?.sku) existingSkus.add(p.sku.toString());
          if (p?.product_code) existingSkus.add(p.product_code.toString());
        });
      }
      
      ProductDetails = ProductDetails?.filter((item) => {
        if (!item?.product_sku) return true; // keep if no SKU, let backend handle it
        return !existingSkus.has(item.product_sku.toString());
      });

      // Track the SKUs we're fetching
      ProductDetails?.forEach((item) => {
        if (item?.product_sku) {
          fetchedSkusRef.current.add(item.product_sku.toString());
        }
      });

      // Mark in-progress BEFORE setting orderPostData so no concurrent run starts
      shippingFetchInProgressRef.current = true;
      setOrderPostData(orderPostDataList);

      // Run the async shipping fetch without blocking the render
      (async () => {
        dispatch(setShippingLoading(true));
        try {
          await dispatchShippingSelectively(orderPostDataList);
        } finally {
          shippingFetchInProgressRef.current = false;
          dispatch(setShippingLoading(false));
        }
      })();
      
      if (ProductDetails && ProductDetails.length > 0) {
        dispatch(fetchProductDetails(ProductDetails));
      }

    }
  }, [orders, product_details, orderPostData, dispatch]);

  // Separate useEffect to fetch product details for newly added products
  useEffect(() => {
    if (!orders?.data?.length) return;

    // Collect all current SKUs from orders
    const allCurrentSkus: string[] = [];
    orders.data.forEach((order: any) => {
      order.order_items?.forEach((item: any) => {
        if (item?.product_sku) {
          allCurrentSkus.push(item.product_sku.toString());
        }
      });
    });

    // Build a map of SKUs currently in the persisted Redux store
    const existingSkusInRedux = new Set<string>();
    if (product_details && Array.isArray(product_details)) {
      product_details.forEach((p: any) => {
        if (p?.sku) existingSkusInRedux.add(p.sku.toString());
        if (p?.product_code) existingSkusInRedux.add(p.product_code.toString());
      });
    }

    // Find SKUs that haven't been fetched yet in this session OR aren't in Redux
    const newSkus = allCurrentSkus.filter(
      sku => !fetchedSkusRef.current.has(sku) && !existingSkusInRedux.has(sku)
    );

    if (newSkus.length > 0) {
      console.log("Fetching details for new SKUs:", newSkus);

      // Build product details for new SKUs only
      const newProductDetails = orders.data.flatMap((order: any) =>
        order.order_items
          ?.filter((item: any) => item?.product_sku && newSkus.includes(item.product_sku.toString()))
          ?.map((item: any) => ({
            order_po: order.order_po,
            product_sku: item.product_sku,
            product_guid: item.product_guid,
            product_qty: item.product_qty,
            product_image: {
              product_url_file: "https://via.placeholder.com/150",
              product_url_thumbnail: "https://via.placeholder.com/150",
            },
          }))
      ).filter(Boolean);

      if (newProductDetails.length > 0) {
        // Mark these SKUs as being fetched
        newSkus.forEach(sku => fetchedSkusRef.current.add(sku));
        dispatch(fetchProductDetails(newProductDetails));

        // Also update shipping options for orders with new products
        const validOrders = orders.data.filter(
          (order: any) => (order?.order_items && order?.order_items?.length > 0) && order?.shipping_code != null && order?.shipping_code !== ""
        );
        const orderPostDataList = validOrders?.map((order: any) => ({
          order_po: order?.order_po,
          recipient: order?.recipient,
          shipping_code: order?.shipping_code,
          order_items: order.order_items?.map((item: any) => ({
            product_order_po: item.product_order_po,
            product_qty: item.product_qty,
            product_sku: item.product_sku,
            product_image: {
              product_url_file: "https://via.placeholder.com/150",
              product_url_thumbnail: "https://via.placeholder.com/150",
            },
          })),
        }))?.flat();

        if (orderPostDataList?.length) {
          (async () => {
            dispatch(setShippingLoading(true));
            try {
              await dispatchShippingSelectively(orderPostDataList);
            } finally {
              dispatch(setShippingLoading(false));
            }
          })();
          setOrderPostData(orderPostDataList);
        }
      }
    }
  }, [orders?.data, dispatch, customerInfo?.data?.account_key]);

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
              // 3. Have valid SKUs
              // 4. Have no recipient errors from the shipping API
              order.order_items &&
              order.order_items.length > 0 &&
              order.shipping_code != null &&
              order.shipping_code !== "" &&
              // All items must be valid — a product is invalid only if the API
              // explicitly responded with isActiveSKU:false for that product_guid.
              !order.order_items.some((item: any) => {
                const detail =
                  product_details?.find((p: any) => p.product_guid?.replace(/-/g, '') === item.product_guid?.replace(/-/g, '')) ??
                  product_details?.find((p: any) =>
                    (p.sku && p.sku.toString().toLowerCase() === item.product_sku?.toString().toLowerCase()) ||
                    (p.product_code && p.product_code.toString().toLowerCase() === item.product_sku?.toString().toLowerCase())
                  );
                return detail ? detail.isActiveSKU === false : false;
              }) &&
              !excludedOrders.includes(order.order_po) &&
              (!recipientErrors[order.order_po] || Object.keys(recipientErrors[order.order_po]).length === 0)
          )
          .map((order) => ({
            order_po: order.order_po,
            order_key: order.order_key,
            Product_price: getShippingPrice(order.order_po),
            productData: order.order_items,
            source: order.source,
            productImage:
              productData[order.order_items[0]?.product_guid]?.image_url_1
              ?? productData[order.order_items[0]?.product_guid?.replace(/-/g, '')]?.image_url_1
              ?? productData[order.order_items[0]?.product_sku]?.image_url_1
              ?? productData[order.order_items[0]?.product_sku?.toLowerCase()]?.image_url_1,
          }))
        : [];

      dispatch(updateCheckedOrders(CheckedOrders));
    }
  }, [orders?.data, excludedOrders, shipping_option, validSKUs, recipientErrors]); // Added recipientErrors dependency

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

  /**
   * Returns true if ANY item in the order has been confirmed invalid by the API.
   * An item is invalid when product_details contains a matching entry (by product_guid
   * or SKU) with isActiveSKU === false — i.e. the API responded and said so.
   * Products whose details haven't been fetched yet are NOT considered invalid.
   */
  const hasInvalidSKUs = (orderItems: any[]) => {
    return orderItems?.some(item => {
      // Look up the API response for this item — prefer product_guid match first
      const detail =
        // Normalize GUIDs before comparing — API returns with dashes, orders often store without
        product_details?.find((p: any) => p.product_guid?.replace(/-/g, '') === item.product_guid?.replace(/-/g, '')) ??
        product_details?.find((p: any) =>
          (p.sku && p.sku.toString().toLowerCase() === item.product_sku?.toString().toLowerCase()) ||
          (p.product_code && p.product_code.toString().toLowerCase() === item.product_sku?.toString().toLowerCase())
        );
      // Only flag invalid if the API has responded and explicitly said so
      return detail ? detail.isActiveSKU === false : false;
    });
  };

  // Centralized robust lookup for product data that handles dash mismatches in GUIDs
  // and case mismatches in SKUs.
  const getProductDetail = useCallback((item?: { product_guid?: string; product_sku?: string } | any) => {
    if (!item || !productData) return null;
    const { product_guid, product_sku } = item;
    
    // 1. Try exact GUID
    if (product_guid && productData[product_guid]) return productData[product_guid];
    
    // 2. Try stripped GUID (API returns with dashes, order items often without)
    if (product_guid) {
      const strippedGuid = String(product_guid).replace(/-/g, '');
      if (productData[strippedGuid]) return productData[strippedGuid];
    }
    
    // 3. Try exact SKU
    if (product_sku && productData[product_sku]) return productData[product_sku];
    
    // 4. Try lowercase SKU (case mismatch fallback)
    if (product_sku) {
      const lowerSku = String(product_sku).toLowerCase();
      if (productData[lowerSku]) return productData[lowerSku];
    }
    
    return null;
  }, [productData]);

  // Function to get the correct image URL, handling Google Drive links
  const getImageUrl = useCallback((order: any, productSku: string, productGuid?: string): string => {
    let imageUrl = "";
    console.log(order?.product_url_thumbnail, "order?.order_items?.product_image?.product_url_thumbnail")
    // Try thumbnail first, then fallback to product data
    if (order?.product_url_thumbnail) {
      imageUrl = order.product_url_thumbnail;
    } else if (order?.product_image?.product_url_thumbnail) {
      imageUrl = order.product_image.product_url_thumbnail;
    } else {
      const entry = getProductDetail({ product_sku: productSku, product_guid: productGuid });
      if (entry?.image_url_1) imageUrl = entry.image_url_1;
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
    console.log(originalUrl, "originalUrl")
    console.log(imageKey, "imageKey")

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

  const { isDark } = useTheme();

  // Returns an SVG icon element for the given order source platform
  const getPlatformIcon = (source: string) => {
    const s = (source || "").toLowerCase();

    if (s.includes("squarespace")) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
          <path d="M12.001 0C5.373 0 0 5.373 0 12s5.373 12 12.001 12C18.627 24 24 18.627 24 12S18.627 0 12.001 0zm5.908 7.387a1.377 1.377 0 01-.403.977L8.364 17.506a1.382 1.382 0 01-1.953-1.953l9.142-9.143a1.381 1.381 0 011.953 1.953l-.006.006.409-.409-.006.006zm-1.818 8.154l-1.378 1.378-6.208-6.208 1.378-1.378 6.208 6.208zm-7.588 2.068a1.381 1.381 0 010-1.953l1.033-1.033 1.953 1.953-1.033 1.033a1.381 1.381 0 01-1.953 0zm9.54-9.541a1.381 1.381 0 010-1.953l-.975.975a1.381 1.381 0 011.952 1.952l.975-.974a1.381 1.381 0 01-1.953 0z"/>
        </svg>
      );
    }

    if (s.includes("shopify")) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
          <path d="M15.337.009c-.074-.003-.154.022-.22.073l-1.01.76c-.167-.498-.41-.956-.73-1.33C12.77-1.166 11.82-1.5 10.84-1.5c-.013 0-.027 0-.04.002-.09.004-.18.024-.266.058C10.48-1.567 9.43-2 8.31-2c-.864 0-1.67.264-2.353.763-.683.5-1.21 1.196-1.522 2.01a8.29 8.29 0 00-.26 1.004l-.06.382C2.34 2.46.87 3.58.42 5.14L.002 6.73a.34.34 0 00.229.41l1.064.306v11.96a.34.34 0 00.34.34h16.5a.34.34 0 00.34-.34V7.856l1.064-.306a.34.34 0 00.23-.41L19.36 5.56c-.41-1.453-1.71-2.526-3.27-2.78l-.05-.334a7.67 7.67 0 00-.703-2.437zm-4.497 1.96c.307.345.533.77.672 1.272l-3.24 2.437a8.47 8.47 0 01-.14-.946 6.15 6.15 0 01-.027-.692c0-.596.075-1.145.216-1.621.135-.462.323-.83.547-1.09.11-.126.226-.222.342-.286.116-.064.234-.097.355-.1.404-.01.842.21 1.275 1.026zm-2.86-.693c-.166.192-.314.432-.44.716-.215.484-.357 1.082-.413 1.753a9.17 9.17 0 00.01 1.15l-1.62 1.22c.043-.412.126-.8.244-1.153a4.6 4.6 0 011.012-1.69 3.57 3.57 0 011.207-.996zm6.77 3.09l-8.28 6.23a.34.34 0 01-.54-.275V9.42a.34.34 0 01.136-.274l8.684-6.534v1.754zm1.01 12.64H8.31v-6.81l5.96-4.485v11.295h2.49z"/>
        </svg>
      );
    }

    if (s.includes("wix")) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
          <path d="M12.648 7.662l-1.514 8.676-1.017-4.795c-.156-.75-.42-1.244-.79-1.484-.37-.24-.888-.361-1.553-.361l-1.37 6.64L4.89 7.662H3l2.254 8.676c.156.735.435 1.23.837 1.484.403.254.94.36 1.614.31.686-.05 1.185-.217 1.499-.5.314-.285.55-.763.706-1.434l.945-4.49.946 4.49c.156.671.392 1.15.706 1.434.314.283.813.45 1.499.5.673.05 1.21-.056 1.613-.31.403-.254.681-.749.837-1.484L18.65 7.662H16.76l-1.506 8.578-1.072-6.64c-.12-.567-.314-.966-.58-1.2-.266-.235-.648-.352-1.145-.352-.498 0-.88.117-1.146.352-.265.234-.46.633-.58 1.2l-1.073 6.64-1.01-8.578z"/>
        </svg>
      );
    }

    if (s.includes("woocommerce") || s.includes("wordpress")) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
          <path d="M2.047 5.357C1.2 6.523.778 7.912.778 9.524c0 2.04.554 3.722 1.66 5.045L.013 20.03h3.838l1.23-3.494h7.03l1.23 3.494h3.838l-2.426-5.461c1.106-1.323 1.66-3.004 1.66-5.045 0-1.612-.422-3.001-1.27-4.167C14.158 4.19 13.085 3.5 11.8 3.5H4.52c-1.285 0-2.358.69-3.144 1.857zm1.836 1.37c.4-.567.94-.85 1.623-.85h7.225c.683 0 1.223.283 1.623.85.4.567.6 1.276.6 2.127 0 .851-.2 1.56-.6 2.127-.4.567-.94.85-1.623.85H5.506c-.683 0-1.223-.283-1.623-.85-.4-.567-.6-1.276-.6-2.127 0-.851.2-1.56.6-2.127zm1.047 4.754h6.131l-1.553 4.413H6.483l-1.553-4.413z"/>
        </svg>
      );
    }

    if (s.includes("etsy")) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
          <path d="M9.386 3.578H6.75V3c0-.265-.265-.375-.53-.375H4.173c-.375 0-.53.11-.53.375v.578H.973C.598 3.578.375 3.8.375 4.176v1.922c0 .375.223.597.598.597h.756v12.555c0 .433.172.75.605.75h10.007c.434 0 .607-.317.607-.75V6.695h.756c.375 0 .597-.222.597-.597V4.176c0-.375-.222-.598-.597-.598H9.386V3zm-2.58 13.635H5.352v-4.77h1.454v4.77zm2.742 0H8.094v-4.77h1.454v4.77zm-.07-6.228H5.423a.675.675 0 010-1.348h4.055a.675.675 0 010 1.348z"/>
        </svg>
      );
    }

    if (s.includes("amazon")) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
          <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.7-3.182v.685zm3.186 7.705a.66.66 0 01-.77.075c-1.079-.897-1.269-1.313-1.86-2.169-1.78 1.814-3.037 2.357-5.345 2.357-2.729 0-4.854-1.686-4.854-5.054 0-2.633 1.426-4.42 3.461-5.298 1.762-.77 4.222-.908 6.109-1.122v-.418c0-.77.06-1.682-.393-2.348-.395-.6-1.152-.848-1.823-.848-1.236 0-2.338.634-2.609 1.948-.056.294-.271.584-.567.598l-3.165-.34c-.265-.059-.561-.274-.484-.682C5.694 1.998 8.703 1 11.394 1c1.375 0 3.172.366 4.254 1.407 1.375 1.288 1.243 3.007 1.243 4.877v4.42c0 1.329.552 1.913 1.071 2.632.183.256.223.563-.01.754-.579.484-1.609 1.381-2.176 1.883l-.632-.178zm3.768 1.639c-2.973 2.204-7.284 3.375-10.996 3.375-5.2 0-9.88-1.923-13.42-5.123-.278-.252-.03-.596.305-.4 3.82 2.221 8.543 3.554 13.428 3.554 3.293 0 6.913-.683 10.244-2.096.503-.215.925.33.439.69zm1.248-1.421c-.379-.487-2.504-.23-3.461-.116-.291.035-.336-.218-.074-.401 1.695-1.192 4.479-.848 4.804-.449.325.402-.086 3.184-1.676 4.512-.244.205-.477.096-.369-.174.358-.894 1.156-2.886.776-3.372z"/>
        </svg>
      );
    }

    if (s.includes("ebay")) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
          <path d="M0 7.856l3.578 8.284h2.008L9.03 7.856H6.937l-2.254 5.567L2.43 7.856H0zm10.14 0v8.284h1.95V7.856h-1.95zm3.025 0l3.396 4.035-3.396 4.249h2.292l2.238-2.842 2.253 2.842H22l-3.41-4.22L22 7.856h-2.237L17.51 10.64l-2.108-2.784h-2.237z"/>
        </svg>
      );
    }

    // Generic store icon for unknown sources
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
        <path d="M3 9l1-5h16l1 5M3 9h18M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9"/>
        <path d="M9 9v12M15 9v12"/>
      </svg>
    );
  };

  const getPlatformColor = (source: string): { bg: string; color: string; border: string } => {
    const s = (source || "").toLowerCase();
    if (s.includes("squarespace")) return { bg: "#000000", color: "#ffffff", border: "#333" };
    if (s.includes("shopify")) return { bg: "#96bf48", color: "#ffffff", border: "#7aa83a" };
    if (s.includes("wix")) return { bg: "#faad00", color: "#000000", border: "#e09800" };
    if (s.includes("woocommerce") || s.includes("wordpress")) return { bg: "#7f54b3", color: "#ffffff", border: "#6a459a" };
    if (s.includes("etsy")) return { bg: "#f1641e", color: "#ffffff", border: "#d45518" };
    if (s.includes("amazon")) return { bg: "#ff9900", color: "#000000", border: "#e68a00" };
    if (s.includes("ebay")) return { bg: "#e53238", color: "#ffffff", border: "#c42a2f" };
    return { bg: "#6b7280", color: "#ffffff", border: "#4b5563" };
  };

  return (
    <div
      className={`flex justify-end items-center  h-full p-8 ${style.overAll_box}`}
    >
      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 2px rgba(239,68,68,0.25), 0 4px 16px rgba(239,68,68,0.12); }
          50%       { box-shadow: 0 0 0 4px rgba(239,68,68,0.45), 0 4px 20px rgba(239,68,68,0.22); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        className={`h-auto pt-4 mt-10 w-full ${style.overAll_box}`}
        style={{ background: isDark ? "#080c14" : "#f3f4f6" }}
      >
        <div className="flex justify-between items-center mb-10 px-9">
          <h1 className="text-left text-2xl font-bold mt-2">Orders</h1>
          <div className="flex items-center gap-3">
            {/* ── Refresh All button ── */}
            <button
              id="refresh-orders-btn"
              onClick={handleRefreshOrders}
              disabled={isRefreshingOrders || ordersStatus === 'loading'}
              title="Refresh all orders, shipping options and product details"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isDark ? '#0f1724' : '#f9fafb',
                borderColor: isDark ? '#1e3048' : '#d1d5db',
                color: isDark ? '#93c5fd' : '#374151',
              }}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-700 ${isRefreshingOrders || ordersStatus === 'loading' ? 'animate-spin' : 'group-hover:rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  animation: isRefreshingOrders || ordersStatus === 'loading'
                    ? 'spin 0.8s linear infinite'
                    : undefined,
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isRefreshingOrders || ordersStatus === 'loading' ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* ── Delete All button ── */}
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
        </div>
        <div
          className={`mx-auto max-w-7xl justify-center px-6 md:flex md:space-x-6 xl:px-0 ${style.orderes_box}`}
        >
          <div className="rounded-lg md:w-full">
            {filteredOrders && filteredOrders.length > 0 ? (
              filteredOrders?.map((order, index) => {
                // An order is visually "excluded" if it is not in checkedOrders
                // (covers both user-excluded orders AND orders auto-excluded due to invalid SKUs / missing shipping)
                const isExcluded = shipping_option.length > 0
                  && order?.order_items?.length > 0
                  && !checkedOrders.some((c: any) => c.order_po === order.order_po);
                return (
                  <div
                    key={index}
                    className="justify-between mb-6 rounded-lg p-6 shadow-md sm:flex-row sm:justify-start space-y-2 relative overflow-hidden"
                    style={{
                      background: isDark
                        ? "#0f1724"
                        : "#ffffff",
                      borderLeft: isExcluded
                        ? (isDark ? "4px solid #253347" : "4px solid #d1d5db")
                        : "4px solid transparent",
                      transition: "background 0.3s ease, border-color 0.3s ease",
                    }}
                  >
                    <ul className="grid w-100  md:grid-cols-2 md:grid-rows-1 items-start ">
                      <li className="flex-1">
                        {(() => {
                          const apisNotReady = product_status !== "succeeded" || shipping_option.length === 0;
                          // An item is invalid only if the API explicitly responded with isActiveSKU:false.
                          // Items whose product_details haven't loaded yet are NOT treated as invalid.
                          const hasInvalidSku = order?.order_items?.some((item: any) => {
                            const detail =
                              product_details?.find((p: any) => p.product_guid?.replace(/-/g, '') === item.product_guid?.replace(/-/g, '')) ??
                              product_details?.find((p: any) =>
                                (p.sku && p.sku.toString().toLowerCase() === item.product_sku?.toString().toLowerCase()) ||
                                (p.product_code && p.product_code.toString().toLowerCase() === item.product_sku?.toString().toLowerCase())
                              );
                            return detail ? detail.isActiveSKU === false : false;
                          });
                          const hasAddressIssues = !!recipientErrors[order?.order_po];
                          const hasItemIssues = !!itemErrors[order?.order_po];
                          
                          // Block toggling if the order has validation issues or APIs failed/loading
                          const isToggleDisabled = apisNotReady || hasInvalidSku || hasAddressIssues || hasItemIssues;

                          return (shipping_option.length > 0 || orderPostData.length > 0 || Object.keys(recipientErrors).length > 0) &&
                          order?.order_items.length > 0 ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();

                                const isCurrentlyIncluded = checkedOrders.some(
                                  (c: { order_po: string }) => c.order_po == order.order_po
                                );

                                // If trying to go Draft → Active but order is invalid, show detailed notification
                                if (!isCurrentlyIncluded && isToggleDisabled) {
                                  const issues: string[] = [];

                                  // Invalid SKUs
                                  const invalidSkuItems = order?.order_items?.filter(
                                    (item: any) => !product_details?.some(
                                      (p: any) => p.sku === item.product_sku || p.product_code === item.product_sku
                                    )
                                  );
                                  if (invalidSkuItems?.length > 0) {
                                    invalidSkuItems.forEach((item: any) => {
                                      issues.push(`Invalid product SKU: "${item.product_sku}"`);
                                    });
                                  }

                                  // Address / recipient errors
                                  const addrErrors = recipientErrors[order?.order_po];
                                  if (addrErrors && Object.keys(addrErrors).length > 0) {
                                    const fieldLabels: Record<string, string> = {
                                      first_name: "First name",
                                      last_name: "Last name",
                                      address_1: "Address line 1",
                                      city: "City",
                                      state_code: "State / Province",
                                      zip_postal_code: "Zip / Postal code",
                                      country_code: "Country",
                                      phone: "Phone",
                                    };
                                    Object.entries(addrErrors).forEach(([field, msgs]: [string, any]) => {
                                      const label = fieldLabels[field] || field;
                                      issues.push(`${label}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
                                    });
                                  }

                                  // Item / product errors
                                  const orderItemErrors = itemErrors[order?.order_po];
                                  if (orderItemErrors && Object.keys(orderItemErrors).length > 0) {
                                    Object.entries(orderItemErrors).forEach(([field, msgs]: [string, any]) => {
                                      issues.push(`Product ${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
                                    });
                                  }

                                  notificationApi.warning({
                                    message: "Order Incomplete",
                                    description: (
                                      <div>
                                        <p style={{ marginBottom: 8, fontWeight: 500, color: "#374151" }}>
                                          This order cannot be activated. The following is still required:
                                        </p>
                                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.8, color: "#b45309" }}>
                                          {issues.length > 0
                                            ? issues.map((issue, i) => <li key={i}>{issue}</li>)
                                            : <li>Some required information is missing or invalid.</li>}
                                        </ul>
                                      </div>
                                    ),
                                    duration: 7,
                                  });
                                  return;
                                }

                                if (!isCurrentlyIncluded) {
                                  const parsedValue = {
                                    order_po: order?.order_po,
                                    Product_price: getShippingPrice(order?.order_po),
                                    productData: order?.order_items,
                                    productImage: 
                                      productData[order?.order_items[0]?.product_guid]?.image_url_1
                                      ?? productData[order?.order_items[0]?.product_guid?.replace(/-/g, '')]?.image_url_1
                                      ?? productData[order?.order_items[0]?.product_sku]?.image_url_1
                                      ?? productData[order?.order_items[0]?.product_sku?.toLowerCase()]?.image_url_1,
                                  };
                                  dispatch(updateCheckedOrders([...checkedOrders, parsedValue]));
                                  dispatch(updateExcludedOrders(excludedOrders.filter((o) => o !== order.order_po)));
                                } else {
                                  dispatch(updateCheckedOrders(checkedOrders.filter((c: any) => c.order_po !== order.order_po)));
                                  dispatch(updateExcludedOrders([...excludedOrders, order.order_po]));
                                }
                              }}
                              className={`relative inline-flex h-9 w-[170px] items-center rounded-full p-1 transition-all duration-300 focus:outline-none shadow-inner border border-slate-200/60 ${isToggleDisabled ? "bg-slate-200 cursor-not-allowed opacity-60" : "bg-slate-100 focus:ring-2 focus:ring-blue-500/40"}`}
                              role="switch"
                              aria-checked={checkedOrders.some((c: { order_po: string }) => c.order_po == order.order_po)}
                              title={isToggleDisabled ? "Click to see what is required to activate this order" : "Toggle Draft/Active"}
                            >
                              <div
                                className={`absolute left-1 h-7 w-[79px] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-transform duration-300 ease-out ${isToggleDisabled ? "bg-gray-100" : "bg-white"} ${checkedOrders.some((c: { order_po: string }) => c.order_po == order.order_po)
                                  ? 'translate-x-[81px]'
                                  : 'translate-x-0'
                                  }`}
                              />
                              <div className="relative z-10 flex w-full">
                                <span className={`flex-1 text-center text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 select-none ${!checkedOrders.some((c: { order_po: string }) => c.order_po == order.order_po) ? 'text-slate-700 drop-shadow-sm' : 'text-slate-400'}`}>
                                  Draft
                                </span>
                                <span className={`flex-1 text-center text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 select-none ${checkedOrders.some((c: { order_po: string }) => c.order_po == order.order_po) ? 'text-emerald-600 drop-shadow-sm' : 'text-slate-400'}`}>
                                  Active
                                </span>
                              </div>
                            </button>
                            {/* Badge shown when order is excluded */}
                            {isExcluded && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#6b7280",
                                  background: isDark ? "#1e2d42" : "#f3f4f6",
                                  border: isDark ? "1px solid #253347" : "1px solid #d1d5db",
                                  borderRadius: 6,
                                  padding: "2px 8px",
                                  userSelect: "none",
                                }}
                              >
                                <svg style={{ width: 11, height: 11 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                Not included
                              </span>
                            )}
                          </div>
                        ) : null;
                        })()}
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
                      className="grid w-full gap-4 md:grid-cols-[minmax(180px,1fr)_minmax(300px,2fr)_minmax(200px,1fr)]"
                      key={index}
                    >
                      <li>
                        <label
                          className="h-[220px] inline-flex items-center justify-between w-full p-3 rounded-lg cursor-default border-2"
                          style={{
                            position: "relative",
                            background: isDark ? "#0c1520" : "#ffffff",
                            borderColor: (() => {
                              const orderRecipErrors = recipientErrors[order?.order_po];
                              if (orderRecipErrors && Object.keys(orderRecipErrors).length > 0) {
                                return "#ef4444";
                              }
                              return isDark ? "#1e2d42" : "#e5e7eb";
                            })(),
                            boxShadow: (() => {
                              const orderRecipErrors = recipientErrors[order?.order_po];
                              if (orderRecipErrors && Object.keys(orderRecipErrors).length > 0) {
                                return "0 0 0 2px rgba(239,68,68,0.18), 0 4px 16px rgba(239,68,68,0.08)";
                              }
                              return undefined;
                            })(),
                            color: isDark ? "#8892a4" : undefined,
                          }}
                        >
                          {/* Recipient error badge — top-left corner */}
                          {recipientErrors[order?.order_po] && Object.keys(recipientErrors[order?.order_po]).length > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: 8,
                                left: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                                border: "1px solid #fca5a5",
                                borderRadius: 6,
                                padding: "2px 8px",
                                fontSize: 11,
                                fontWeight: 600,
                                zIndex: 2,
                                userSelect: "none",
                              }}
                            >
                              <svg style={{ width: 12, height: 12, flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Address Issue
                            </div>
                          )}
                          {/* Platform source icon badge — top-right corner */}
                          {order?.source && (() => {
                            const palette = getPlatformColor(order.source);
                            return (
                              <div
                                title={order.source}
                                style={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  display: "flex",
                                  alignItems: "center",
                                  backgroundColor: palette.bg,
                                  color: palette.color,
                                  border: `1px solid ${palette.border}`,
                                  borderRadius: "50%",
                                  padding: "5px",
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                                  zIndex: 2,
                                  userSelect: "none",
                                }}
                              >
                                {getPlatformIcon(order.source)}
                              </div>
                            );
                          })()}
                          <div className="block" style={{ marginTop: recipientErrors[order?.order_po] ? 18 : 0 }}>
                            <div className="w-full text-[12px] text-gray-700 leading-tight">
                              <span className="text-blue-600 font-medium">Order:</span> {order?.order_po}
                            </div>
                            <div className="w-full text-[12px] font-semibold text-gray-700 pt-2 pb-1">
                              Ship To
                            </div>
                            {/* Recipient name */}
                            <div className="w-full text-[12px] text-gray-700 leading-tight">
                              {order?.recipient?.first_name}{" "}
                              {order?.recipient?.last_name}
                            </div>
                            {/* address_1 */}
                            <div
                              className="w-full text-[12px] leading-tight"
                              style={{
                                color: recipientErrors[order?.order_po]?.address_1 ? "#dc2626" : (isDark ? "#8892a4" : "#374151"),
                                border: recipientErrors[order?.order_po]?.address_1 ? "1px solid #fca5a5" : "1px solid transparent",
                                borderRadius: 4,
                                padding: "1px 4px",
                                background: recipientErrors[order?.order_po]?.address_1 ? "#fef2f2" : "transparent",
                              }}
                              title={recipientErrors[order?.order_po]?.address_1?.[0]}
                            >
                              {order?.recipient?.address_1}
                            </div>
                            {/* city / state / zip */}
                            <div
                              className="w-full text-[12px] leading-tight"
                              style={{
                                color: (recipientErrors[order?.order_po]?.state_code || recipientErrors[order?.order_po]?.city || recipientErrors[order?.order_po]?.zip_postal_code) ? "#dc2626" : (isDark ? "#8892a4" : "#374151"),
                                border: (recipientErrors[order?.order_po]?.state_code || recipientErrors[order?.order_po]?.city || recipientErrors[order?.order_po]?.zip_postal_code) ? "1px solid #fca5a5" : "1px solid transparent",
                                borderRadius: 4,
                                padding: "1px 4px",
                                background: (recipientErrors[order?.order_po]?.state_code || recipientErrors[order?.order_po]?.city || recipientErrors[order?.order_po]?.zip_postal_code) ? "#fef2f2" : "transparent",
                              }}
                              title={recipientErrors[order?.order_po]?.state_code?.[0] || recipientErrors[order?.order_po]?.city?.[0] || recipientErrors[order?.order_po]?.zip_postal_code?.[0]}
                            >
                              {order?.recipient?.city},{" "}{order?.recipient?.state}
                              {order?.recipient?.province}{" "}
                              {order?.recipient?.zip_postal_code}
                            </div>
                            {/* country_code */}
                            <div
                              className="w-full text-[12px] leading-tight"
                              style={{
                                color: recipientErrors[order?.order_po]?.country_code ? "#dc2626" : (isDark ? "#8892a4" : "#374151"),
                                border: recipientErrors[order?.order_po]?.country_code ? "1px solid #fca5a5" : "1px solid transparent",
                                borderRadius: 4,
                                padding: "1px 4px",
                                background: recipientErrors[order?.order_po]?.country_code ? "#fef2f2" : "transparent",
                              }}
                              title={recipientErrors[order?.order_po]?.country_code?.[0]}
                            >
                              {order?.recipient?.country_code}
                            </div>
                            {/* Show all error messages below the address */}
                            {recipientErrors[order?.order_po] && Object.keys(recipientErrors[order?.order_po]).length > 0 && (
                              <div style={{ marginTop: 6 }}>
                                {Object.entries(recipientErrors[order?.order_po]).map(([field, msgs]) => (
                                  <div key={field} style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 2 }}>
                                    <svg style={{ width: 11, height: 11, flexShrink: 0, marginTop: 1, color: "#dc2626" }} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span style={{ fontSize: 10, color: "#dc2626", lineHeight: 1.3 }}>{msgs[0]}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="pt-3" style={{ width: recipientErrors[order?.order_po] && Object.keys(recipientErrors[order?.order_po]).length > 0 ? "auto" : "100%" }}>
                              <Button
                                key="submit"
                                className="text-gray-500"
                                style={{ width: recipientErrors[order?.order_po] && Object.keys(recipientErrors[order?.order_po]).length > 0 ? "auto" : "100%" }}
                                size={"small"}
                                type="default"
                              >
                                <Link
                                  to={"/editorder/" + order?.orderFullFillmentId}
                                >
                                  Edit address
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </label>
                      </li>

                      <li className="min-h-[200px]">
                        <input
                          type="checkbox"
                          id="flowbite-option"
                          value=""
                          className="hidden peer"
                        />
                        {order?.order_items.length > 0 ? (
                          <>
                            {order?.order_items?.map((orderItem) => {
                              // Determine validity based on what the API returned for this item.
                              // Match by product_guid first (most reliable), then fall back to
                              // case-insensitive SKU / product_code comparison.
                              const itemDetail =
                                product_details?.find((p: any) => p.product_guid?.replace(/-/g, '') === orderItem.product_guid?.replace(/-/g, '')) ??
                                product_details?.find((p: any) =>
                                  (p.sku && p.sku.toString().toLowerCase() === orderItem.product_sku?.toString().toLowerCase()) ||
                                  (p.product_code && p.product_code.toString().toLowerCase() === orderItem.product_sku?.toString().toLowerCase())
                                );
                              // Only show invalid UI when the API has responded AND explicitly
                              // flagged this product as inactive (isActiveSKU === false).
                              // If details haven't loaded yet, show the normal product card.
                              const isItemInvalid = itemDetail ? itemDetail.isActiveSKU === false : false;
                              return isItemInvalid ? (
                                <div
                                  key={orderItem.product_sku ?? orderItem.product_guid}
                                  className="mb-4 p-4 border-2 border-red-300 rounded-lg bg-red-50 h-[220px]"
                                  style={{
                                    opacity: 1,
                                    filter: "none",
                                    boxShadow: "0 0 0 2px rgba(239,68,68,0.25), 0 4px 16px rgba(239,68,68,0.12)",
                                    animation: "pulse-border 2s ease-in-out infinite",
                                  }}
                                >
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
                                            {orderItem?.product_sku}
                                          </span>
                                        </p>
                                        <p className="text-sm text-red-600">
                                          This SKU is not recognized in the system.
                                          Please add a valid SKU to proceed.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4 ml-7 flex items-center gap-3">
                                    <button
                                      className="h-9 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                      onClick={() => {
                                        setReplacingModal(true);
                                        setSkuToReplace(orderItem?.product_sku);
                                        setSkuOrderFullilment(
                                          invalidSKuOrderFullilment?.find(
                                            (item: any) =>
                                              orderItem?.product_sku === item.sku
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
                                    <button
                                      className="h-9 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-600 bg-white hover:bg-red-50 hover:border-red-400 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors duration-200"
                                      onClick={() => {
                                        setProductToDelete({
                                          product_guid: orderItem?.product_guid,
                                          orderFullFillmentId: order?.orderFullFillmentId,
                                          order_po: order?.order_po,
                                        });
                                        setProductDeleteModalVisible(true);
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
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                      Remove
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
                              ) : itemDetail === undefined && product_details.length > 0 && !validSKUs.some(v => v.toLowerCase() === orderItem.product_sku?.toString().toLowerCase()) ? (
                                // Fallback: product_details loaded but no match found for this item at all
                                // (edge case: product_guid not in response). Treat as invalid.
                                <div
                                  key={orderItem.product_sku ?? orderItem.product_guid}
                                  className="mb-4 p-4 border-2 border-red-300 rounded-lg bg-red-50 h-[220px]"
                                  style={{
                                    opacity: 1,
                                    filter: "none",
                                    boxShadow: "0 0 0 2px rgba(239,68,68,0.25), 0 4px 16px rgba(239,68,68,0.12)",
                                    animation: "pulse-border 2s ease-in-out infinite",
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center mb-2">
                                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <h2 className="text-lg font-semibold text-red-700">Invalid SKU Detected</h2>
                                      </div>
                                      <div className="ml-7">
                                        <p className="text-red-600 mb-2">Current SKU: <span className="font-mono bg-red-100 px-2 py-1 rounded">{orderItem?.product_sku}</span></p>
                                        <p className="text-sm text-red-600">This SKU is not recognized in the system. Please add a valid SKU to proceed.</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4 ml-7 flex items-center gap-3">
                                    <button
                                      className="h-9 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                      onClick={() => { setReplacingModal(true); setSkuToReplace(orderItem?.product_sku); setSkuOrderFullilment(invalidSKuOrderFullilment?.find((item: any) => orderItem?.product_sku === item.sku)?.orderFullFillmentId || ""); }}
                                    >
                                      Replace SKU
                                    </button>
                                    <button
                                      className="h-9 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-600 bg-white hover:bg-red-50 hover:border-red-400 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors duration-200"
                                      onClick={() => { setProductToDelete({ product_guid: orderItem?.product_guid, orderFullFillmentId: order?.orderFullFillmentId, order_po: order?.order_po }); setProductDeleteModalVisible(true); }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  key={orderItem.product_sku ?? orderItem.product_guid}
                                  className={`mb-3 w-full rounded-lg shadow-sm transition-all duration-200 ${style.orderes_lable}`}
                                  style={{
                                    background: isDark ? "#0c1520" : "#ffffff",
                                    border: isDark ? "1px solid #1e2d42" : "1px solid #e5e7eb",
                                    opacity: (isExcluded && !hasInvalidSKUs(order?.order_items)) ? 0.4 : 1,
                                    filter: (isExcluded && !hasInvalidSKUs(order?.order_items)) ? "grayscale(0.5)" : "none",
                                    transition: "opacity 0.3s ease, filter 0.3s ease",
                                  }}
                                >
                                  {/* Main content area */}
                                  <div className="p-4 min-h-[120px]">
                                    <div className={`flex gap-3 ${style.description_box}`}>
                                      {/* Image */}
                                      <div className={`flex-shrink-0 ${style.importlist_pic}`}>
                                        {(() => {
                                          const originalImageUrl = getImageUrl(orderItem, orderItem?.product_sku, orderItem?.product_guid);
                                          const imageKey = `${orderItem?.product_sku}-${orderItem?.product_order_po}`;
                                          const currentImageUrl = getCurrentImageUrl(imageKey, originalImageUrl);
                                          const hasError = imageErrors[imageKey];

                                          if (isGoogleDriveUrl(originalImageUrl)) {
                                            console.log(`[${imageKey}] Google Drive Image State:`, {
                                              originalImageUrl,
                                              currentImageUrl,
                                              hasError,
                                              urlIndex: imageUrlIndex[imageKey] || 0
                                            });
                                          }

                                          // No URL or confirmed load error — show placeholder
                                          if (!originalImageUrl || hasError) {
                                            return (
                                              <div
                                                className="w-24 h-24 rounded flex flex-col items-center justify-center cursor-pointer relative group transition-transform hover:scale-[1.02]"
                                                style={{
                                                  background: isDark ? "linear-gradient(135deg,#1a2535,#141e2e)" : "linear-gradient(135deg,#f3f4f6,#e9eaec)",
                                                }}
                                                onClick={() => setImageGalleryTarget({ orderItem, order })}
                                                title="Click to add image"
                                              >
                                                {/* Smooth pulsing/glowing border element */}
                                                <style>{`
                                                  @keyframes smoothBreathingGlow {
                                                    0%, 100% { opacity: 0.4; box-shadow: 0 0 4px rgba(96, 165, 250, 0.3); transform: scale(1); }
                                                    50% { opacity: 0.85; box-shadow: 0 0 14px rgba(96, 165, 250, 0.8); transform: scale(1.03); }
                                                  }
                                                `}</style>
                                                <div 
                                                  className="absolute inset-0 rounded border-2 border-blue-400 pointer-events-none transition-all" 
                                                  style={{ animation: 'smoothBreathingGlow 3s ease-in-out infinite' }} 
                                                />
                                                <svg className="w-8 h-8 mb-1 group-hover:text-blue-400 transition-colors duration-300" style={{ color: isDark ? "#2d3f58" : "#d1d5db" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span style={{ fontSize: 9, color: isDark ? "#3d5270" : "#9ca3af", fontWeight: 500 }} className="text-center group-hover:text-blue-400 transition-colors duration-300">Click to add<br/>image</span>
                                              </div>
                                            );
                                          }

                                          return (
                                            <div className="relative w-24 h-24">
                                              {/* Shimmer skeleton shown behind the image while it loads */}
                                              <div
                                                className="absolute inset-0 rounded border overflow-hidden"
                                                style={{
                                                  borderColor: isDark ? "#1e2d42" : "#e5e7eb",
                                                  background: isDark
                                                    ? "linear-gradient(90deg,#1a2535 25%,#243347 50%,#1a2535 75%)"
                                                    : "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)",
                                                  backgroundSize: "200% 100%",
                                                  animation: "shimmer 1.5s infinite",
                                                }}
                                              />
                                              <img
                                                key={`${imageKey}-${imageUrlIndex[imageKey] || 0}`}
                                                src={originalImageUrl}
                                                alt="product"
                                                className="absolute inset-0 w-full h-full object-contain rounded border border-gray-100 transition-opacity duration-300"
                                                style={{ opacity: 0 }}
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).style.opacity = "0";
                                                  handleImageError(imageKey, originalImageUrl);
                                                }}
                                                onLoad={(e) => {
                                                  (e.target as HTMLImageElement).style.opacity = "1";
                                                  setImageErrors(prev => {
                                                    const newState = { ...prev };
                                                    delete newState[imageKey];
                                                    return newState;
                                                  });
                                                }}
                                              />
                                            </div>
                                          );
                                        })()}
                                      </div>

                                      {/* Labels */}
                                      <div className="flex-1 min-w-0">
                                        {(Object.keys(productData)?.length && (
                                          <div className="w-full">
                                            {getProductDetail(orderItem)?.labels?.length > 0 ? (
                                              (() => {
                                                const labels = getProductDetail(orderItem)?.labels || [];
                                                const typeLabel = labels.find((label: any) => label.key?.toLowerCase() === "type");
                                                const otherLabels = labels.filter((label: any) => label.key?.toLowerCase() !== "type");

                                                // Use a unique key combining order and product info
                                                const expandKey = `${order?.order_po}-${orderItem?.product_sku || orderItem?.product_guid}`;
                                                const isExpanded = expandedLabels.has(expandKey);
                                                const showMoreButton = otherLabels.length > 4;

                                                return (
                                                  < >
                                                    {/* Type label as header */}
                                                    {typeLabel && (
                                                      <div className="text-[13px] font-semibold text-gray-800 mb-1.5 pb-1 border-b border-gray-100">
                                                        <span className="text-blue-600 font-medium">type:</span> {typeLabel.value}
                                                      </div>
                                                    )}
                                                    {/* Remaining labels */}
                                                    <div className={`space-y-1 transition-all duration-300 ${isExpanded ? 'max-h-[500px]' : 'max-h-[300px] overflow-hidden'
                                                      }`}>
                                                      {otherLabels.map((label: any, idx: number) => (
                                                        <div key={idx} className="text-[12px] text-gray-700 leading-tight">
                                                          <span className="text-blue-600 font-medium">{label.key}:</span> {label.value}
                                                        </div>
                                                      ))}
                                                    </div>
                                                    {showMoreButton && (
                                                      <button
                                                        onClick={(e) => toggleLabels(expandKey, e)}
                                                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium mt-1 inline-flex items-center gap-0.5"
                                                      >
                                                        {isExpanded ? 'Less' : 'More'}
                                                        <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                      </button>
                                                    )}
                                                  </>
                                                );
                                              })()
                                            ) : (
                                              <div className={`w-full text-xs text-gray-600 ${style.order_description}`}>
                                                {(() => {
                                                  const desc = getProductDetail(orderItem)?.description_long || "";
                                                  // Hide API error messages returned as description (e.g. "Invalid product_sku...")
                                                  if (desc.trimStart().toLowerCase().startsWith("invalid")) return null;
                                                  return parse(truncateText(desc, descriptionCharLimit));
                                                })()}
                                              </div>
                                            )}
                                          </div>
                                        )) || <Skeleton active />}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Footer bar */}
                                  <div
                                    className="flex justify-between items-center px-3 py-2 border-t rounded-b-lg"
                                    style={{
                                      background: isDark ? "#0a1020" : "#f9fafb",
                                      borderColor: isDark ? "#1e2d42" : "#f3f4f6",
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      {/* Change Image button */}
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-blue-600 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setImageGalleryTarget({ orderItem, order });
                                        }}
                                        title="Change product image"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Image
                                      </button>
                                      {/* Remove product button */}
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-500 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setProductToDelete({
                                            product_guid: orderItem?.product_guid,
                                            orderFullFillmentId: order?.orderFullFillmentId,
                                            order_po: order?.order_po,
                                          });
                                          setProductDeleteModalVisible(true);
                                        }}
                                        title="Delete product"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Remove
                                      </button>
                                    </div>
                                    <div className="text-sm">
                                      {/* Item errors (e.g. product_qty must be at least 1) */}
                                      {itemErrors[order?.order_po]?.length > 0 ? (
                                        <div
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 4,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            color: "#92400e",
                                            background: "#fffbeb",
                                            border: "1px solid #fcd34d",
                                            borderRadius: 4,
                                            padding: "2px 6px",
                                          }}
                                        >
                                          <svg style={{ width: 10, height: 10, flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                          {itemErrors[order?.order_po][0]}
                                        </div>
                                      ) : (
                                        /* Only show price when product is valid and has no errors */
                                        validSKUs.some(v => v.toLowerCase() === (orderItem?.product_sku ?? '').toString().toLowerCase() || v === orderItem?.product_guid) &&
                                        (!recipientErrors[order?.order_po] || Object.keys(recipientErrors[order?.order_po]).length === 0) &&
                                        getProductDetail(orderItem)?.total_price != null ? (
                                          <span className="text-gray-600">{orderItem?.product_qty || 1}@ ${(getProductDetail(orderItem)?.total_price)?.toFixed(2)} ea</span>
                                        ) : null
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {/* Add More Products Button */}
                            <div className="mt-4 flex justify-center">
                              <Dropdown
                                menu={{ items: getAddProductMenuItems(order?.orderFullFillmentId) }}
                                trigger={["click"]}
                                placement="bottom"
                                open={addProductDropdownVisible === `add-more-${order?.orderFullFillmentId}`}
                                onOpenChange={(visible) => setAddProductDropdownVisible(visible ? `add-more-${order?.orderFullFillmentId}` : null)}
                              >
                                <button
                                  className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl overflow-hidden transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.15) 100%)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                                  }}
                                  onClick={() => setAddProductDropdownVisible(
                                    addProductDropdownVisible === `add-more-${order?.orderFullFillmentId}` ? null : `add-more-${order?.orderFullFillmentId}`
                                  )}
                                >
                                  {/* Animated background gradient on hover */}
                                  <span
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{
                                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
                                    }}
                                  />

                                  {/* Plus icon with animated circle background */}
                                  <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm group-hover:shadow-md group-hover:shadow-emerald-500/30 transition-all duration-300">
                                    <svg
                                      className="w-3.5 h-3.5 text-white transition-transform duration-300 group-hover:rotate-90"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                  </span>

                                  {/* Text */}
                                  <span className="relative text-emerald-700 group-hover:text-emerald-800 transition-colors duration-200">
                                    Add More
                                  </span>

                                  {/* Chevron icon */}
                                  <svg
                                    className="relative w-4 h-4 text-emerald-500 group-hover:text-emerald-600 transition-all duration-300 group-hover:translate-y-0.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </Dropdown>
                            </div>
                          </>
                        ) : (
                          <AddProductsTemplate orderFullFillmentId={order?.orderFullFillmentId} />
                        )}
                      </li>
                      <li>
                        <label
                          className={`h-[220px] inline-flex justify-between w-full p-5 rounded-lg cursor-pointer border-2 ${hasInvalidSKUs(order?.order_items) ? 'opacity-50 pointer-events-none' : ''}`}
                          style={{
                            background: isDark ? "#0c1520" : "#ffffff",
                            borderColor: isDark ? "#1e2d42" : "#e5e7eb",
                            color: isDark ? "#8892a4" : undefined,
                          }}
                        >
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
                                    Shipping Unavailable
                                  </p>
                                  <p className="text-gray-400 text-center text-xs mt-1">
                                    Order incomplete, missing data
                                  </p>
                                </div>
                              ) : recipientErrors[order?.order_po] && Object.keys(recipientErrors[order?.order_po]).length > 0 ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                  <div className="relative mb-3">
                                    <svg
                                      className="w-16 h-16 text-red-200"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.5"
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div className="absolute -top-1 -right-1 bg-red-100 rounded-full p-1">
                                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                  <p className="text-red-500 text-center text-sm font-medium">
                                    Address Issue
                                  </p>
                                  <p className="text-gray-400 text-center text-xs mt-1 px-3">
                                    Fix the recipient address to unlock shipping
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
                );
              })
            ) : !orders?.data || isRefreshing || isPendingUpdate || ordersStatus === 'loading' ? (
              <SkeletonOrderCard count={3} />
            ) : orders?.data && orders.data.length === 0 && !isRefreshing && !isPendingUpdate && ordersStatus !== 'loading' ? (
              <div className="flex flex-col items-center justify-center h-64 rounded-lg shadow-md p-6 mb-20" style={{ background: isDark ? "#0f1724" : "#ffffff" }}>
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
              <div
                className="flex flex-col items-center justify-center h-64 rounded-lg shadow-md p-6 mb-20"
                style={{ background: isDark ? "#0f1724" : "#ffffff" }}
              >
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

            {/* Delete Product from Order Modal */}
            <DeleteMessage
              visible={productDeleteModalVisible}
              onClose={setProductDeleteModalVisible}
              onDeleteProduct={onDeleteProductFromOrder}
              deleteItem={productToDelete?.product_guid || ""}
              order_po={productToDelete?.order_po || ""}
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
        setProductCode={() => { }}
        orderFullFillmentId={currentOrderForAddProduct}
        onProductCodeUpdate={handleAddProductCodeUpdate}
      />
      <VirtualInvModal
        visible={addProductVirtualInvVisible}
        onClose={() => setAddProductVirtualInvVisible(false)}
        onProductAdded={handleAddProductCodeUpdate}
      />

      {/* ── Image Gallery Modal — "Change Image" for existing products ── */}
      <ImageGalleryModal
        visible={!!imageGalleryTarget}
        onClose={() => setImageGalleryTarget(null)}
        title={imageGalleryTarget ? `Choose Image for "${imageGalleryTarget.orderItem?.product_sku}"` : "Select an Image"}
        onImageSelect={async (image: any) => {
          if (!imageGalleryTarget) return;
          const { orderItem, order: targetOrder } = imageGalleryTarget;

          setImageGalleryTarget(null);

          // Patch only the matching item's product_image — leave everything else intact.
          // Use the full order object from Redux so we send all required fields.
          const freshOrder = orders?.data?.find(
            (o: any) => o.orderFullFillmentId === targetOrder?.orderFullFillmentId
          ) ?? targetOrder;

          const updatedOrder = {
            ...freshOrder,
            order_items: (freshOrder.order_items ?? []).map((item: any) => {
              if (item.product_guid !== orderItem.product_guid) return item;
              return {
                ...item,
                product_image: {
                  product_url_file: image.private_hires_uri,
                  product_url_thumbnail: image.public_thumbnail_uri,
                },
              };
            }),
          };

          const result = await dispatch(
            updateOrdersInfo({
              updatedValues: [updatedOrder],
              customerId: customerInfo?.data?.account_id,
            })
          );

          if (updateOrdersInfo.fulfilled.match(result)) {
            notificationApi.success({
              message: "Image Updated",
              description: `Image "${image.title}" has been applied to this product.`,
            });
            // Invalidate shipping cache for this order and re-fetch so the UI refreshes
            dispatch(invalidateShippingCacheEntries([targetOrder?.order_po]));
            fetchedSkusRef.current.clear();
            dispatch(clearProductDetails());
            
            // Clear any local image error state so the new image is forced to render
            setImageErrors({});
            setImageUrlIndex({});
            
            resetOrderPostData();
            await dispatch(fetchOrder(customerInfo?.data?.account_id));
          } else {
            notificationApi.error({
              message: "Image Update Failed",
              description: "Could not update the product image. Please try again.",
            });
          }
        }}
      />
    </div>
  );
};

export default ImportList;

