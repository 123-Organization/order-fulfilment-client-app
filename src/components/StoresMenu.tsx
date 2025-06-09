import React from "react";
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

type MenuItem = Required<MenuProps>["items"][number];

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
              <label htmlFor="label" className="absolute bottom-1">
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
              <label htmlFor="label" className="absolute bottom-2">
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

const onClick: MenuProps["onClick"] = (e) => {
  console.log("click", e);
};

const StoresMenu: React.FC = () => (
  <Menu
    onClick={onClick}
    style={{ width: 170 }}
    mode="vertical"
    items={items}
  />
);

export default StoresMenu;
