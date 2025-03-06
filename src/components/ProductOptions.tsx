import { Button, Dropdown } from "antd";
import style from "../pages/Pgaes.module.css";
import NewOrder from "./NewOrder";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchSingleOrderDetails } from "../store/features/orderSlice";
import PopupModal from "../components/PopupModal";
import VirtualInvModal from "../components/VirtualInvModal";
import type { MenuProps } from "antd";

type productType = {
  name?: string;
  value: string;
  options?: any;
};

interface ProductOptionsProps {
  id: string;
  recipient?: any;
  onProductCodeUpdate: () => void;
}

export default function ProductOptions({ id, recipient, onProductCodeUpdate }: ProductOptionsProps) {
  const [popupVisible, setPopupVisible] = useState(false);
  const [PostModalVisible, setPostModalVisible] = useState(false);
  const [virtualINv, setVirtualInv] = useState(false);
  const [listVisble, SetListVisble] = useState(false);
  const [productCode, setProductCode] = useState(false);
  const orderData = useAppSelector((state) => state.order.order) || {};
  const order = orderData?.data ? orderData?.data[0] : {};
  const dispatch = useAppDispatch();

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <p
          className="text-sm font-mono  flex gap-1 "
          onClick={() => {
            setPostModalVisible(true);
            SetListVisble(false); // Close dropdown after selection
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
      fetchSingleOrderDetails({ accountId: "1556", orderFullFillmentId: id })
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
