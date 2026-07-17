import { Button, Dropdown } from "antd";
import style from "../pages/Pgaes.module.css";
import NewOrder from "./NewOrder";
import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { AddProductToOrder, fetchSingleOrderDetails, resetProductDataStatus, updateValidSKU } from "../store/features/orderSlice";
import PopupModal from "../components/PopupModal";
import VirtualInvModal from "../components/VirtualInvModal";
import NewProduct from "./NewProduct";
import type { MenuProps } from "antd";
import { useCookies } from "react-cookie";
import { useNotificationContext } from "../context/NotificationContext";


type productType = {
  name?: string;
  value: string;
  options?: any;
};

interface ProductOptionsProps {
  id: string;
  recipient?: any;
  onProductCodeUpdate: () => void;
  setOpenModal: (value: boolean) => void;
  localorder: any;
}

export default function ProductOptions({ id, recipient, onProductCodeUpdate, setOpenModal, localorder }: ProductOptionsProps) {
  const [popupVisible, setPopupVisible] = useState(false);
  const [PostModalVisible, setPostModalVisible] = useState(false);
  const [virtualINv, setVirtualInv] = useState(false);
  const [listVisble, SetListVisble] = useState(false);
  const [productCode, setProductCode] = useState(false);
  const orderData = useAppSelector((state) => state.order.order) || {};
  const order = orderData?.data ? orderData?.data[0] : {};
  const dispatch = useAppDispatch();
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const images = useAppSelector((state) => state.ProductSlice.images);
  const notificationApi = useNotificationContext();
  const productDatastat = useAppSelector((state) => state.order.productDataStatus);
  const firstRender = useRef(true);
  const validSKU = useAppSelector((state) => state.order.validSKU);


  const [cookies, setCookie, removeCookie] = useCookies(["session_id", "AccountGUID", "ofa_product"]);
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
      "ReturnUrl": "https://fa.finerworks.com" + window.location.hash,
    }
  }
  const encodedURI =
    "https://post5.finerworks.com/?source=ofa&settings=" +
    encodeURIComponent(JSON.stringify(postSettings));

  const cookiePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start polling for ofa_product cookie once the popup is opened
  const startCookiePolling = () => {
    if (cookiePollingRef.current) clearInterval(cookiePollingRef.current);

    cookiePollingRef.current = setInterval(() => {
      const rawCookie = document.cookie
        .split("; ")
        .find(row => row.startsWith("ofa_product="));

      if (!rawCookie) return;

      try {
        const rawValue = rawCookie.split("=").slice(1).join("=");
        const ofaProduct = JSON.parse(decodeURIComponent(rawValue));

        if (Array.isArray(ofaProduct) && ofaProduct.length > 0) {
          const item = ofaProduct[0];
          const postData = {
            productCode: item.product_code,
            product_url_file: [item.thumbnail_url],
            product_url_thumbnail: [item.thumbnail_url],
            product_guid: item.id,
            skuCode: "",
            pixel_width: 1200,
            pixel_height: 900,
            orderFullFillmentId: id,
            account_key: cookies.AccountGUID,
            qty: item.qty ?? 1,
            mode: item.mode,
          };

          // Stop polling before async work
          clearInterval(cookiePollingRef.current!);
          cookiePollingRef.current = null;

          // Clear the cookie
          document.cookie = "ofa_product=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
          document.cookie = "ofa_product=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.finerworks.com";
          document.cookie = "ofa_product=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=finerworks.com";

          dispatch(AddProductToOrder(postData));
          dispatch(updateValidSKU([...validSKU, postData.productCode]));
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

  // Handle success/error notifications in a separate effect
  useEffect(() => {
    if (productDatastat === "succeeded") {
      document.cookie = "ofa_product=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      // Also try with domain
      document.cookie = "ofa_product=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.finerworks.com";
      document.cookie = "ofa_product=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=finerworks.com";
      if (firstRender.current) {
        notificationApi.success({
          message: "New Product Added",
          description: "Product has been successfully Added",
        });
        firstRender.current = false;
      }
      onProductCodeUpdate();

      dispatch(resetProductDataStatus());
    } else if (productDatastat === "failed") {
      notificationApi.error({
        message: "Product Addition Failed",
        description: "Product addition failed",
      });
    }
  }, [productDatastat, notificationApi]);

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <p
          className="text-sm font-mono  flex gap-1 "
          onClick={() => {
            window.open(encodedURI, "_blank");
            startCookiePolling();
          }}
        >
          Create New
        </p>
      ),
    },
    {
      key: "2",
      label: (
        <p
          rel="noopener noreferrer"
          className="flex gap-1"
          onClick={() => {
            setPopupVisible(true);
            SetListVisble(false); // Close dropdown after selection
          }}
        >
          Enter Product code
        </p>
      ),
    },
    {
      key: "3",
      label: (
        <p
          rel="noopener noreferrer"
          onClick={() => {
            setVirtualInv(true);
            SetListVisble(false); // Close dropdown after selection
          }}
          className="flex gap-1 text-sm font-mono"
        >
          Select from Inventory
        </p>
      ),
    },
  ];

  const handleProductCodeUpdate = () => {
    // Refresh logic (e.g., re-fetch order details)
    dispatch(
      fetchSingleOrderDetails({ accountId: customerInfo?.data?.account_id, orderFullFillmentId: id })
    );
  };

  return (
    <Dropdown
      className={` w-1/2 bg-transparent text-right pb-3 z-0 `}
      menu={{ items }}
      overlayStyle={{ zIndex: 0 }}
      trigger={["click"]}
      placement="bottomRight"
      open={listVisble} // Ensure dropdown is controlled by listVisble state
      onOpenChange={(visible) => SetListVisble(visible)} // Handle dropdown open/close
    >
      {/* Wrap both Button and other elements in a div */}
      <div>
        <Button
          key="submit"
          className=" flex-col w-[130px] text-white bg-green-600 rounded-lg text-center font-semibold border-gray-500"
          size={"small"}
          style={{ backgroundColor: "#6fc64f" }}
          type="default"
          onClick={() => SetListVisble(!listVisble)} // Toggle dropdown visibility
        >
          + Add Product
        </Button>

        <div className={`ml-4 absolute w-1/2 `}>
          <PopupModal
            visible={popupVisible}
            onClose={() => setPopupVisible(false)}
            setProductCode={setProductCode}
            orderFullFillmentId={id}
            onProductCodeUpdate={onProductCodeUpdate}
          />
          <VirtualInvModal
            visible={virtualINv}
            onClose={() => setVirtualInv(false)}
            orderFullFillmentId={id}
          />
        </div>

        <NewOrder
          iframe={PostModalVisible}
          setIframe={setPostModalVisible}
          recipient={order?.recipient ?? null}
        />
      </div>
    </Dropdown>
  );
}
