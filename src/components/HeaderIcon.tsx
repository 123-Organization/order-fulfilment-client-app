import React, { CSSProperties, useEffect, useState } from "react";
import {
  Checkbox,
  MenuProps,
  Spin,
  Skeleton,
  Avatar,
  Modal,
  message,
  Dropdown,
  Menu,
} from "antd";
import { ProfileOutlined, BookOutlined, HomeOutlined } from "@ant-design/icons";

import briefcase from "../assets/images/briefcase.svg";
import truck from "../assets/images/truck.svg";
import creditcard from "../assets/images/credit-card.svg";
import store from "../assets/images/store.svg";
import image from "../assets/images/image.svg";
import ShipmentModal from "./ShipmentModal";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import FileManagementIframe from "./FileManagmentIframe";
import UserAvatar from "./UserAvatar";
import StoresMenu from "./StoresMenu";
import { useCookies } from "react-cookie";
import more from "../assets/images/more.svg"


import finerWorks from "../assets/images/finerworks_logo_icon.49c0d41a2f19011aa3ea27c47041d2ff.svg";
// import UploadFileModal from "./UploadFileModal";

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
  fontSize: "16px",
};

const whPixel = "35px";

/**
 * ****************************************************************** Function Components **********************************************
 */
type HeaderIconProps = {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const HeaderIcon: React.FC<HeaderIconProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const [openModal, setOpenModal] = useState(false);
  const [openModal1, setOpenModal1] = useState(false);
  const [open, setOpen] = useState(false);
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  const [openDash, setDash] = useState(true);
  const [spinLoader, setSpinLoader] = useState(false);
  const [active, setActive] = useState(true);
  const [size, setSize] = useState<SizeType>("large");
  const [avatarShape, setAvatarShape] = useState<AvatarShapeType>("square");
  const [iframeVisible, setIframeVisible] = useState(false);
  const navigate = useNavigate();
  const [myStores, setMyStores] = useState(false);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);

  const handleMenuClick: MenuProps["onClick"] = (e) => {};

  const items: MenuProps["items"] = [];

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const handleCollapsed = () => {
    setCollapsed(!collapsed);
    setOpen(true);
  };

  const createPrints = () => {};
  const getLocation = () => true; // (window.location.href !== window.parent.location.href)
  const locationIsDiff = getLocation();
  console.log("locationIsDiff", locationIsDiff);
  const logo = { finerWorks };
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
      onCancel() {},
    });
  };
  const addtional = "pb-500";
  const toggleDash = () => {
    setDash(!openDash);
  };
  const onIframeClick = () => {
    if(cookies.AccountGUID){
      setIframeVisible(!iframeVisible);
    }else{
      window.location.href = `https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`
    }
  }

  const dropdownStyles: CSSProperties = {
    boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    padding: '4px 0',
    borderRadius: '6px',
    width: '170px',
    backgroundColor: 'white',
  };

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'documentation',
      label: (
        <a 
          href="https://support.finerworks.com/how-to-use-the-order-fulfillment-app/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Documentation
        </a>
      ),
    },
    {
      key: 'finerworks',
      label: (
        <a 
          href="https://finerworks.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          FinerWorks.com
        </a>
      ),
    }, {
      key: 'Pending orders',
      label: (
        <a 
          href="#/importlist" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pending Orders
        </a>
      ),
    },
  ];

  const handleMoreClick = () => {
    setMoreMenuVisible(!moreMenuVisible);
    if (!moreMenuVisible) {
      setMyStores(false);
    }
  };

  const handleMyStoresClick = () => {
    setMyStores(!myStores);
    if (!myStores) {
      setMoreMenuVisible(false);
    }
  };

  /**
   * ****************************************************************** JSX  ***************************************************************************
   */
  return (
    <div className={`flex w-full ${!openDash ? addtional : ""}`}>
      <div className=" fixed left-0 z-50 w-full top-0 h-18 bg-white pt-3 pb-3  mb-2 border-gray-200 dark:bg-gray-700 dark:border-gray-600 flex justify-between items-center">
        <div className="grid   md:place-items-center  max-md:grid-cols-10  max-md:grid-rows-1 w-[720px] max-md:w-full grid-rows-1 grid-cols-6 font-medium max-md:font-normal ">
          {!logo ? (
            <div
              className=" cursor-pointer   "
              onClick={() => {
                window.location.href = "/";
              }}
            >
              <Skeleton.Avatar
                className="pt-4"
                active={active}
                size={size}
                shape={avatarShape}
              />
            </div>
          ) : (
            <img
              src={finerWorks}
              onClick={() => {
                window.location.href = "/";
              }}
              className="App-logo-icon cursor-pointer flex flex-row z-100 w-12 h-14 max-md:mx-2 "
              alt="logo"
            />
          )}

          {1 ? (
            <div className="flex flex-row  w-full col-span-5 max-md:col-span-8 justify-end">
              <div className="max-md:visible md:hidden mx-2 ">
                <UserAvatar />
              </div>
              <div className="max-md:hidden ">
                <button
                  data-tooltip-target="tooltip-document"
                  type="button"
                  className="fw-icon-btn "
                  onClick={() => {
                    navigate("/mycompany");
                  }}
                >
                  <img src={briefcase} width={whPixel} height={whPixel} />
                  <span className="max-md:text-sm max-md:font-normal text-gray-500 whitespace-nowrap dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500">
                    My Company
                  </span>
                </button>
              </div>
              

              <div className="max-md:hidden">
                <button
                  type="button"
                  className="fw-icon-btn"
                  onClick={() => {
                    navigate("/shippingpreference");
                  }}
                  // onClick={() => {
                  //   setOpen(true)}}
                >
                  <img src={truck} width={whPixel} height={whPixel} />
                  <span className=" ">Ship Perferences</span>
                </button>
                <ShipmentModal visible={open} onClose={() => setOpen(false)} />
              </div>

              <div className="max-md:hidden">
                <button
                  type="button"
                  className="fw-icon-btn"
                  onClick={() => {
                    navigate("/billingaddress");
                  }}
                >
                  <img src={creditcard} width={whPixel} height={whPixel} />
                  <span className="">Billing</span>
                </button>
              </div>
              <div className="relative flex h-16 items-center justify-between md:hidden"></div>
              <div className="relative flex h-16 items-center justify-self-center justify-between md:hidden">
                <div className="absolute inset-y-0 left-0 flex items-center ">
                  <div className="relative flex h-16 items-center justify-between md:hidden">
                    <div className="absolute inset-y-0 left-0 flex items-center ">
                      <button
                        onClick={() => setDash(!openDash)}  
                        type="button"
                        className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        aria-controls="mobile-menu11"
                        aria-expanded={false} 
                      >
                        <span className="absolute -inset-0.5"></span>
                        <span className="sr-only">Open main menu</span>

                        {openDash && (
                          <svg
                            className="block h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                            />
                          </svg>
                        )}

                        {!openDash && (
                          <svg
                            className=" h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
                
              <div className="max-md:hidden">
                
                <button
                  type="button"
                  className=" fw-icon-btn  "
                  onClick={() => {
                    navigate("/virtualinventory");
                  }}
                >
                  {/* <img src={store} width={whPixel} height={whPixel} /> */}
                  <ProfileOutlined style={{ fontSize: 30, color: "#BFBFBF" }} />
                  {/* <ContainerOutlined  /> */}
                  <span className="pt-0.5 ">Virtual Inventory</span>
                </button>
              </div>
              
              <div className="max-md:hidden relative" onMouseLeave={() => setMoreMenuVisible(false)}>
                <button
                  type="button"
                  className="fw-icon-btn"
                  onClick={handleMyStoresClick}
                  onMouseLeave={() => setMoreMenuVisible(false)}
                >
                  <img
                    src={store}
                    className="mr-2"
                    width={whPixel}
                    height={whPixel}
                    
                  />
                  <span className="mt-1">My Stores</span>
                </button>
                <div
                  className={`absolute top-20 left flex items-center ${
                    myStores ? "visible" : "hidden"
                  }`}
                > 
                  {cookies.AccountGUID && <StoresMenu setMyStores={setMyStores}/>}
                </div>
              </div>
              <div className="max-md:hidden relative">
                <button
                  type="button"
                  className="fw-icon-btn group"
                  onClick={handleMoreClick}
                >
                  <img 
                    src={more} 
                    width={"30px"} 
                    height={whPixel} 
                    className="transform transition-transform duration-300 group-hover:rotate-90"
                  />
                  <span className="pt-1">More</span>
                </button>
                <div
                  className={`absolute top-20 left flex items-center ${
                    moreMenuVisible ? "visible" : "hidden"
                  }`}
                >
                  <Menu
                    onClick={() => setMoreMenuVisible(false)}
                    style={{ width: 170 }}
                    mode="vertical"
                    items={moreMenuItems}
                    onMouseLeave={() => setMoreMenuVisible(false)}
                  />
                </div>
              </div>
              
              

              <button onClick={() => setOpenModal(true)}></button>
            </div >
          ) : (
            <></>
          )}

          {!openDash && (
            <div className="md:hidden col-span-10" id="mobile-menu1 " >
              <div className="space-y-1 px-2 pb-3 pt-2">
                {
                  //Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white"
                }

                {/* <button
                    type="button"
                    className=" fw-icon-btn  "
                    onClick={()=>{ navigate('/paymentaddress') }}
                  >
                    <img src={store} width="45px" height="45px" />
                    <span className="">
                      My Stores
                    </span>
                  </button>
                <button
                  data-tooltip-target="tooltip-document"
                  type="button"
                  className="fw-icon-btn"
                >
                    <img src={image} />
                    <span className="">
                        My Files
                  </span>
                </button>  */}
                <div className="middle-div border-t-2  ">
                  <a
                    href="#/mycompany"
                    className="w-full middle-div  text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-sm font-medium"
                    aria-current="page"
                    onClick={toggleDash}
                  >
                    <img
                      src={briefcase}
                      className="mr-2"
                      width={whPixel}
                      height={whPixel}
                      
                    />
                    <span className="mt-1">My Company</span>
                  </a>
                </div>
                
                <div className="middle-div border-t-2">
                  <a
                    href="#/shippingpreference"
                    className="w-full middle-div text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-sm font-medium"
                    aria-current="page"
                    onClick={toggleDash}
                  >
                    <img
                      src={truck}
                      className="mr-2"
                      width={whPixel}
                      height={whPixel}
                    />
                    <span className="mt-1">Ship Preferences</span>
                  </a>
                </div>
                
                <div className="middle-div border-t-2">
                  <a
                    href="#/billingaddress"
                    className="w-full middle-div text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-sm font-medium"
                    aria-current="page"
                    onClick={toggleDash}
                  >
                    <img
                      src={creditcard}
                      className="mr-2"
                      width={whPixel}
                      height={whPixel}
                    />
                    <span className="mt-1">Billing</span>
                  </a>
                </div>
                <div className="middle-div border-t-2">
                  <a
                    href="#/virtualinventory"
                    className="w-full middle-div text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-sm font-medium"
                    aria-current="page"
                    onClick={toggleDash}
                  >
                   <ProfileOutlined style={{ fontSize: 30, color: "#BFBFBF", marginRight: "10px" }} />
                    <span className="mt-1">Virtual Inventory</span>
                  </a>
                  {/* <a href="#" className="w-full bg-gray-900 text-white block rounded-md px-3 py-2 text-base font-medium" aria-current="page">My Stores</a> */}
                </div>
                <div className="middle-div border-t-2">
                  <a
                    href="#"
                    className="w-full middle-div text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-sm font-medium"
                    onClick={onIframeClick}
                    
                  >
                    <img
                      src={image}
                      className="mr-2 "
                      width={whPixel}
                      height={whPixel}
                    />
                    <span className="mt-1">My Files</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {
          // Mobile menu, show/hide based on menu state.
        }

        {1 && (
          <div
            onClick={createPrints}
            className="fw-sky-btn1  max-md:row-1  max-md:col-span-6 max-md:relative max-md:hidden flex"
          >
            <div>
              <UserAvatar />
            </div>
            <Spin spinning={spinLoader} size="small">
              <button
                data-tooltip-target="tooltip-document"
                type="button"
                className="fw-icon-btn -mt-2"
                onClick={onIframeClick}
              >
                <img src={image} width={whPixel} height={whPixel} />
                <span className="">My Files</span>
              </button>
            </Spin>
            <FileManagementIframe
              iframe={iframeVisible}
              setIframe={setIframeVisible}
            />
          </div>
        )}
      </div>
      {/* <UploadFileModal    openModel={open} setOpen={setOpen}  /> */}
    </div>
  );
};

export default HeaderIcon;
