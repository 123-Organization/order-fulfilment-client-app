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
import DisconnectPlatformModal from "./DisconnectPlatformModal";
import { useCookies } from "react-cookie";
import more from "../assets/images/more.svg"
import { useSearch } from "../context/SearchContext";
import { useAppSelector } from "../store";

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
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [burgerMenuOpen, setBurgerMenuOpen] = useState(false);
  
  // Search context
  const { searchTerm, setSearchTerm } = useSearch();
  
  // Get orders from Redux to show/hide notification
  const orders = useAppSelector((state) => state.order.orders || []);
  const hasOrders = orders?.data && orders.data.length > 0;

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

  const handleMyStoresClick = () => {
    setMyStores(!myStores);
  };

  /**
   * ****************************************************************** JSX  ***************************************************************************
   */
  return (
    <>
      {/* Modern Top Navigation Bar */}
      <div className="fixed top-0 left-20 right-0 h-16 bg-white border-b border-gray-200 z-40 shadow-sm">
        <div className="h-full px-6 flex items-center justify-between gap-4">
          {/* Left Section - Page Title & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            <h1 className="text-xl font-semibold text-gray-800 whitespace-nowrap">
              {location.pathname === "/" || location.pathname === "/importlist" ? "Orders" :
               location.pathname === "/mycompany" ? "My Company" :
               location.pathname === "/billingaddress" ? "Billing Address" :
               location.pathname === "/shippingpreference" ? "Shipping Preferences" :
               location.pathname === "/virtualinventory" ? "Virtual Inventory" :
               location.pathname === "/checkout" ? "Checkout" :
               location.pathname === "/importfilter" ? "Import Orders" :
               location.pathname.includes("/editorder") ? "Edit Order" :
               "Dashboard"}
            </h1>
            {location.pathname === "/importlist" && (
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full whitespace-nowrap">
                Pending Orders
              </span>
            )}
          </div>

          {/* Center Section - Search Bar (Optional) */}
          {location.pathname === "/importlist" && (
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by order number or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 px-4 pl-10 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
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
              </div>
            </div>
          )}

          {/* Right Section - Actions & Notifications */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {hasOrders && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Help/Info */}
            <button 
              onClick={() => window.open("https://support.finerworks.com/how-to-use-the-order-fulfillment-app/", "_blank")}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Current Date/Time */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex ${!openDash ? addtional : ""}`}>
        {/* Collapsible Sidebar */}
        <div 
          className="fixed left-0 top-0 z-50 h-full w-20 bg-white border-r border-gray-200 dark:bg-gray-700 dark:border-gray-600 flex flex-col"
        >
        {/* Logo Section */}
        <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-600">
          {!logo ? (
            <div
              className="cursor-pointer"
              onClick={() => {
                window.location.href = "";
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
                window.location.href = "https://finerworks.com/";
              }}
              className="App-logo-icon cursor-pointer w-10 h-12"
              alt="logo"
            />
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 flex flex-col py-2 space-y-1 overflow-y-auto">
          {/* Burger Menu */}
          <button
            type="button"
            className="flex flex-col items-center justify-center py-1 px-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-xs group w-full rounded-lg hover:shadow-sm"
            onClick={() => setBurgerMenuOpen(!burgerMenuOpen)}
          >
            <div className="p-1.5 rounded-lg group-hover:bg-gray-200 transition-all duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                className="text-gray-600 group-hover:scale-110 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </div>
            <span className="text-center leading-tight mt-0.5 font-medium">Menu</span>
          </button>

          {/* My Stores */}
          <button
            type="button"
            className="flex flex-col items-center justify-center py-1 px-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-xs group w-full rounded-lg hover:shadow-sm"
            onClick={() => {
              navigate("/");
            }}
          >
            <div className="p-1.5 rounded-lg group-hover:bg-gray-200 transition-all duration-200">
              <img src={store} width="24" height="24" className="group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="text-center leading-tight mt-0.5 font-medium">Stores</span>
          </button>
              
          {/* Pending Orders */}
          <button
            type="button"
            className="flex flex-col items-center justify-center py-1 px-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-xs group w-full rounded-lg hover:shadow-sm"
            onClick={() => {
              navigate("/importlist");
            }}
          >
            <div className="p-1.5 rounded-lg group-hover:bg-gray-200 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#6B7280" className="group-hover:scale-110 transition-transform duration-200">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-center leading-tight mt-0.5 font-medium">Pending</span>
          </button>

          {/* My Company */}
                <button
                  type="button"
            className="flex flex-col items-center justify-center py-1 px-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-xs group w-full rounded-lg hover:shadow-sm"
                  onClick={() => {
                    navigate("/mycompany");
                  }}
                >
            <div className="p-1.5 rounded-lg group-hover:bg-gray-200 transition-all duration-200">
              <img src={briefcase} width="24" height="24" className="group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="text-center leading-tight mt-0.5 font-medium">My Company</span>
                </button>
              

          {/* Ship Preferences */}
                <button
                  type="button"
            className="flex flex-col items-center justify-center py-1 px-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-xs group w-full rounded-lg hover:shadow-sm"
                  onClick={() => {
                    navigate("/shippingpreference");
                  }}
          >
            <div className="p-1.5 rounded-lg group-hover:bg-gray-200 transition-all duration-200">
              <img src={truck} width="24" height="24" className="group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="text-center leading-tight mt-0.5 font-medium">Shipping</span>
                </button>
                <ShipmentModal visible={open} onClose={() => setOpen(false)} collapsed={collapsed} />

          {/* Billing */}
                <button
                  type="button"
            className="flex flex-col items-center justify-center py-1 px-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-xs group w-full rounded-lg hover:shadow-sm"
                  onClick={() => {
                    navigate("/billingaddress");
                  }}
                >
            <div className="p-1.5 rounded-lg group-hover:bg-gray-200 transition-all duration-200">
              <img src={creditcard} width="24" height="24" className="group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="text-center leading-tight mt-0.5 font-medium">Billing</span>
                </button>
              <div className="relative flex h-16 items-center justify-between md:hidden"></div>
              <div className="relative flex h-16 items-center justify-self-center justify-between md:hidden">
                <div className="absolute inset-y-0 left-0 flex items-center ">
                  <div className="relative flex h-16 items-center justify-between md:hidden">
                    <div className="absolute inset-y-0 left-0 flex items-center ">
                      <button
                        onClick={() => setDash(!openDash)}  
                        type="button"
                        className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:bg-gray-100 focus:text-gray-600"
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
                
          {/* Virtual Inventory */}
                <button
                  type="button"
            className="flex flex-col items-center justify-center py-1 px-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-xs group w-full rounded-lg hover:shadow-sm"
                  onClick={() => {
                    navigate("/virtualinventory");
                  }}
                >
            <div className="p-2 rounded-lg group-hover:bg-blue-200 transition-all duration-200 flex items-center justify-center">
              <ProfileOutlined style={{ fontSize: 24, color: "#6B7280" }} className="group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="text-center leading-tight mt-0.5 font-medium">Inventory</span>
                </button>

          {/* User Profile */}
          <div className="flex flex-col items-center justify-center py-1 px-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-xs group w-full rounded-lg hover:shadow-sm">
            <div className="p-1.5 rounded-lg group-hover:bg-gray-200 transition-all duration-200">
              <UserAvatar />
            </div>
            <span className="text-center leading-tight mt-0.5 font-medium">Profile</span>
          </div>
        </div>
      </div>

      {/* Burger Menu Sidebar */}
      <div 
        className={`fixed left-20 top-0 h-full bg-white border-r border-gray-200 shadow-lg transform transition-all duration-300 ease-in-out z-40 ${
          burgerMenuOpen ? 'w-64 translate-x-0 pointer-events-auto' : 'w-0 -translate-x-full pointer-events-none'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <div className={`h-full ${burgerMenuOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
            <button
              onClick={() => setBurgerMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          
          {/* Menu Items */}
          <div className="p-4 space-y-2">
            <a 
              href="https://support.finerworks.com/how-to-use-the-order-fulfillment-app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 rounded-lg"
              onClick={() => setBurgerMenuOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Documentation</span>
            </a>
            
            <button
              onClick={() => {
                setDisconnectModalVisible(true);
                setBurgerMenuOpen(false);
              }}
              className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-all duration-200 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="font-medium">Disconnect Platform</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Hidden for now since we have sidebar */}
      {!openDash && (
        <div className="md:hidden fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40">
          <div className="bg-white w-64 h-full shadow-lg">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Navigation</h3>
              {/* Mobile navigation items can go here */}
            </div>
          </div>
        </div>
      )}
      
        {/* Disconnect Platform Modal */}
        <DisconnectPlatformModal
          visible={disconnectModalVisible}
          onClose={() => setDisconnectModalVisible(false)}
        />
        
        {/* <UploadFileModal    openModel={open} setOpen={setOpen}  /> */}
      </div>
    </>
  );
};

export default HeaderIcon;
