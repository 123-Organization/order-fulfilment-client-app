import { Button, Dropdown } from "antd";
import style from "../pages/Pgaes.module.css";
import NewOrder from "./NewOrder";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchSingleOrderDetails } from "../store/features/orderSlice";
import PopupModal from "../components/PopupModal";
import VirtualInvModal from "../components/VirtualInvModal";
import NewProduct from "./NewProduct";
import type { MenuProps } from "antd";
import { useCookies } from "react-cookie";

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

export default function ProductOptions({ id, recipient, onProductCodeUpdate , setOpenModal, localorder}: ProductOptionsProps) {
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
  console.log("imagesss", images);

  const [cookies, setCookie] = useCookies(["session_id", "AccountGUID"]);
  const postSettings = {
          "settings": {
                  "guid": "",
                  "session_id": cookies.session_id,
                  "account_key": cookies.AccountGUID  ,
                  "multiselect": false,
                  "libraries": ["inventory","temporary"],
                  "domain": "finerworks.com",
                  "terms_of_service_url": "/terms.aspx",
                  "button_text": "Add Selected",
                  "account_id": customerInfo?.data?.account_id,
                  "ReturnUrl": window.location.href,
          }
  }
const encodedURI =
"https://finerworks.com/apps/orderform/post4.aspx?v=2&settings=" +
encodeURIComponent(JSON.stringify(postSettings));
const decodedURI = decodeURIComponent(encodedURI);
console.log("decodedURI", decodedURI);

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <p
          className="text-sm font-mono  flex gap-1 "
          onClick={() => {
            window.open(encodedURI, "_blank");
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
