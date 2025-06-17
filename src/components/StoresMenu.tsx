import React, { useState } from "react";
import {
  AppstoreOutlined,
  MailOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu, Tag } from "antd";
import bigcommerce from "../assets/images/store-bigcommerce.svg";
import etsy from "../assets/images/store-etsy.svg";
import excel from "../assets/images/store-excel.svg";
import shopify from "../assets/images/store-shopify.svg";
import square from "../assets/images/store-square.svg";
import squarespace from "../assets/images/store-squarespace.svg";
import wix from "../assets/images/store-wix.svg";
import woocommerce from "../assets/images/store-woocommerce.svg";
import { useAppDispatch } from "../store";
import { updateOpenSheet } from "../store/features/orderSlice";
import { useNotificationContext } from "../context/NotificationContext";


type MenuItem = Required<MenuProps>["items"][number];







interface StoresMenuProps {
  setMyStores: (value: boolean) => void;
}

const StoresMenu: React.FC<StoresMenuProps> = ({setMyStores}) => {
  const notificationApi = useNotificationContext();

  const onClick: MenuProps["onClick"] = (e) => {
    if(e.key !== "1" && e.key !== "2"){
      notificationApi?.warning({
        message: "Coming Soon",
        description: "This platform is under development ",
      });
      console.log("click", e);
    }
   
  };
  const [clicked, setClicked] = useState(false);
  const items: MenuItem[] = [
    {
      key: "sub1",
      icon: "",
      label: (
        <Tag className="" color="#52c41a">
          Connected
        </Tag>
      ),
      children: [
        {
          key: "1-1",
          type: "group",
          children: [
            {
              key: "1",
              label: (
                <label htmlFor="label" className="absolute bottom-1" onClick={() => {
                  window.location.href = "#/";
                  dispatch(updateOpenSheet(true));
                }}>
                  Excel
                </label>
              ),
              icon: (
                <img src={excel} alt="Excel" className="w-8 absolute left-0" />
              ),
            },
            {
              key: "2",
              label: (
                <label htmlFor="label" className="absolute bottom-2" onClick={() => {
                  window.location.href = "#/importfilter?type=WooCommerce";
                }}>
                  woocommerce
                </label>
              ),
              icon: (
                <img
                  src={woocommerce}
                  alt="WOOcommecrce"
                  className="w-8 absolute left-0 "
                />
              ),
            },
          ],
        },
      ],
    },
    {
      key: "sub2",
      icon: "",
      label: (
        <Tag className="" color="#D22B2B">
          Disconnected
        </Tag>
      ),
      children: [
        {
          key: "5",
          label: (
            <label htmlFor="label" className="absolute bottom-1 pl-2">
              Squarespace
            </label>
          ),
          icon: (
            <img src={squarespace} alt="Excel" className="w-8 absolute left-0" />
          ),
        },
        {
          key: "6",
          label: (
            <label htmlFor="label" className="absolute bottom-1 pl-2">
              Shopify
            </label>
          ),
          icon: (
            <img
              src={shopify}
              alt="WOOcommecrce"
              className="w-8 absolute left-0 "
              
            />
          ),
        },
        {
          key: "7",
          label: (
            <label htmlFor="label" className="absolute bottom-1 pl-2">
              Wix
            </label>
          ),
          icon: (
            <img src={wix} alt="" className="w-8 absolute left-0 " />
          ),
        },
        {
          key: "8",
          label: (
            <label htmlFor="label" className="absolute bottom-1 pl-2">
              Square
            </label>
          ),
          icon: (
            <img
              src={square}
              alt="WOOcommecrce"
              className="w-8 absolute left-0 "
            />
          ),
        },
        {
          key: "9",
          label: (
            <label htmlFor="label" className="absolute bottom-1 pl-2">
              Etsy
            </label>
          ),
          icon: (
            <img src={etsy} alt="WOOcommecrce" className="w-8 absolute left-0 " />
          ),
        },
        {
          key: "10",
          label: (
            <label htmlFor="label" className="absolute bottom-1 pl-2">
              BigCommerce
            </label>
          ),
          icon: (
            <img
              src={bigcommerce}
              alt="WOOcommecrce"
              className="w-8 absolute left-0 "
            />
          ),
        },
      ],
    },
  ];
  const dispatch = useAppDispatch();
  
  return (
    <Menu
      onClick={onClick}
      style={{ width: 170 }}
      mode="vertical"
      items={items}
      onMouseLeave={() => {
      setMyStores(false);
    }}
  />
);
};

export default StoresMenu;
