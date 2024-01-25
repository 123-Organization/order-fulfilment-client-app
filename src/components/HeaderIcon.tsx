import React, { CSSProperties, useEffect, useState } from "react";
import { Checkbox, MenuProps, Spin, Skeleton, Avatar } from "antd";
import { Dropdown, Space, Modal, message } from "antd";

import briefcase from "../assets/images/briefcase.svg";
import truck from "../assets/images/truck.svg";
import creditcard from "../assets/images/credit-card.svg";
import store from "../assets/images/store.svg";
import image from "../assets/images/image.svg";
import { useNavigate } from "react-router-dom";

/**
 * ****************************************************************** Outer Function ****************************************************
 */
type SizeType = "default" | "small" | "large";
type AvatarShapeType = "circle" | "square";
const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  message.info("Click on left button.");
  console.log("click left button", e);
};

const MODAL_STYLES: CSSProperties = {
  fontSize: "16px"
};

/**
 * ****************************************************************** Function Components **********************************************
 */
const HeaderIcon: React.FC = (): JSX.Element => {
  const [spinLoader, setSpinLoader] = useState(false);
  const [active, setActive] = useState(true);
  const [size, setSize] = useState<SizeType>("large");
  const [avatarShape, setAvatarShape] = useState<AvatarShapeType>("square");
  const navigate = useNavigate();

  const handleMenuClick: MenuProps["onClick"] = (e) => {};

  const items: MenuProps["items"] = [];

  const menuProps = {
    items,
    onClick: handleMenuClick
  };

  const createPrints = () => {};
  const getLocation = () => true; // (window.location.href !== window.parent.location.href)
  const locationIsDiff = getLocation();
  console.log("locationIsDiff", locationIsDiff);
  const logo = "";
  const info = () => {
    Modal.info({
      title: "Print Acknowledgement",
      content: (
        <div>
          <p>
            <Checkbox
              className="py-10 align-text-top  text-gray-400 "
              style={MODAL_STYLES}
            >
              I acknowledge I am the copyright holder or{" "}
              <a href="#" className="text-blue-400">
                authorized
              </a>{" "}
              to print this images.
            </Checkbox>
          </p>
        </div>
      ),
      onOk() {},
      onCancel() {}
    });
  };

  /**
   * ****************************************************************** JSX  ***************************************************************************
   */
  return (
    <div className="flex w-full ">
      <div className=" fixed left-0 z-50 w-full top-0 h-18 bg-white pt-3 pb-3  mb-2 border-gray-200 dark:bg-gray-700 dark:border-gray-600">
        <div className="grid max-md:grid-cols-4 max-md:grid-rows-2 max-w-[700px] grid-rows-1 grid-cols-8 font-medium">
          <div className="flex flex-col items-center"  >
            {!logo ? (
                <div className=" cursor-pointer " onClick={()=>{ navigate('/')}}>
                    <Skeleton.Avatar
                      className="pt-2"
                      active={active}
                      size={size}
                      shape={avatarShape}
                    />
                </div>
            ) : (
              <img
                src={logo}
                onClick={() => {
                  window.location.reload();
                }}
                className="App-logo-icon cursor-pointer flex flex-col "
                alt="logo"
              />
            )}
          </div>

          <button
            type="button"
            className=" md:hidden inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
          >
            <svg
              className="w-5 h-5 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5h6M9 8h6m-6 3h6M4.996 5h.01m-.01 3h.01m-.01 3h.01M2 1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z"
              />
            </svg>
            <span className="text-sm text-gray-500 whitespace-nowrap dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">
              {/* Gallary */}
              <Dropdown menu={menuProps}>
                <Space>My Libraries</Space>
              </Dropdown>
            </span>
          </button>
          {1 ? (
            <>
            
              <button
                data-tooltip-target="tooltip-document"
                type="button"
                className="fw-icon-btn"
                onClick={()=>{ navigate('/mycompany') }}
              >
                <img src={briefcase} />
                <span className="text-sm text-gray-500 whitespace-nowrap dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">
                  My Company
                </span>
              </button>
            

              <button
                type="button"
                className="fw-icon-btn"
              >
                <img src={truck} />
                <span className=" ">
                  Ship Perferences
                </span>
              </button>

              <button
                type="button"
                className="fw-icon-btn"
              >
                <img src={creditcard} />
                <span className="">
                  Billing
                </span>
              </button>

              <button
                type="button"
                className="fw-icon-btn"
              >
                <img src={store} />
                <span className="">
                  My Stores
                </span>
              </button>
            </>
          ) : (
            <></>
          )}
          {1 && (
            <div
              onClick={createPrints}
              className="fw-sky-btn1 absolute max-md:row-1 max-md:col-span-4 max-md:relative"
            >
              <Spin spinning={spinLoader} size="small">
                <button
                  data-tooltip-target="tooltip-document"
                  type="button"
                  className="fw-icon-btn"
                >
                    <img src={image} />
                    <span className="">
                        My Files
                  </span>
                </button>
              </Spin>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HeaderIcon;
