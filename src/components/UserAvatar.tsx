import React, { useState, useEffect } from "react";
import { Avatar, Dropdown, Modal } from "antd";
import type { MenuProps } from "antd";
import { useCookies } from "react-cookie";
import { useAppSelector, useAppDispatch } from "../store";
import { clearCustomerInfo, getCustomerInfo } from "../store/features/customerSlice";
import credit from "../../src/assets/images/credit-card-svgrepo-com.svg";
import email from "../../src/assets/images/email-svgrepo-com.svg";
import user_icon from "../../src/assets/images/user-svgrepo-com.svg";
import log_out from "../../src/assets/images/logout-svgrepo-com.svg";
import { UserOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { persistor } from "../store";
import { clearPaymentMethods } from "../store/features/paymentSlice";
import { disconnectEcommerce } from "../store/features/ecommerceSlice";
import { useNotificationContext } from "../context/NotificationContext";
import { updateCompanyInfo } from "../store/features/companySlice";
import { disconnectInventory } from "../store/features/InventorySlice";
import { resetValidSKU } from "../store/features/orderSlice";
import { removeCurrentOption } from "../store/features/shippingSlice";

const ColorList = ["#f56a00", "#7265e6", "#ffbf00", "#00a2ae"];

export default function UserAvatar() {
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  const [user, setUser] = useState("U");
  const [color, setColor] = useState(ColorList[0]);

  const dispatch = useAppDispatch();
  const customer_info = useAppSelector((state) => state.Customer.customer_info);
  const ecommerceDisconnectInfo = useAppSelector((state) => state.Ecommerce.status);
  const notificationApi = useNotificationContext();
  const companyInfo = useAppSelector((state) => state.company.company_info);
  console.log("ecommerceDisconnectInfo", ecommerceDisconnectInfo);
  const wordpressConnectionId = useAppSelector((state) => state.company.wordpress_connection_id);


  const onLogout = ()=>{
    
    localStorage.removeItem('hasVisitedCompanyPage');
   dispatch(clearPaymentMethods());
    dispatch(resetValidSKU());
    dispatch(clearCustomerInfo())
    dispatch(removeCurrentOption())
    persistor.purge();
  }


  
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <p className="text-sm  text-gray-500 flex gap-1">
          <img src={user_icon} alt="user" width={17} />
          {customer_info?.data?.account_username}
        </p>
      ),
    },
    {
      key: "2",
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.aliyun.com"
          className="flex gap-1"
        >
          <img src={email} alt="user" width={17} />
          {customer_info?.data?.account_email}
        </a>
      ),
    },
    {
      key: "3",
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://finerworks.com/MyAccount/MyCredits.aspx"
          className="flex gap-1 text-sm "
        >
          <img className="text-black" src={credit} width={18} alt="credit" />
          Account Credit:{" "}
          <p className="text-red-700 text-sm">
            ${customer_info?.data?.user_account_credits}
          </p>
        </a>
      ),
    },

    {
      key: "4",
      label: (
        <a
        
          rel="noopener noreferrer"
          href="https://finerworks.com/login.aspx?mode=logout"
          className="flex gap-1 text-sm "
          onClick={onLogout}
           
        >
          <img className="text-black" src={log_out} width={18} alt="credit" />
          Log out
        </a>
      ),
    },
  ];

  const logIn: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <a
          href={`https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`}
          rel="noopener noreferrer"
          className="text-sm  text-gray-500 flex gap-1"
        >
          <img src={user_icon} alt="user" width={17} />
          {"Login"}
        </a>
      ),
    },
  ];



  useEffect(() => {
    if (cookies?.AccountGUID) {
      dispatch(getCustomerInfo());
      setUser(customer_info?.data?.account_username[0]);
      setColor(ColorList[Math.floor(Math.random() * 3)]);
    }
  }, [cookies.AccountGUID, dispatch, customer_info?.data?.account_username]);
  useEffect(()=>{
    if(!cookies.AccountGUID){
      dispatch(clearCustomerInfo())
    }
  },[cookies.AccountGUID, dispatch])

  return (
    <>
      {cookies?.AccountGUID ? (
        <>
          <Dropdown menu={{ items }} placement="bottomRight">
            <Avatar
              style={{ backgroundColor: color, verticalAlign: "middle" }}
              className="border-2 border-blue-400 cursor-pointer shadow-md"
              size="default"
            >
              {user}
            </Avatar>
          </Dropdown>
          

        </>
      ) : (
        <Dropdown menu={{ items: logIn }} placement="bottomRight">
          <Avatar icon={<UserOutlined />} />
        </Dropdown>
      )}
    </>
  );
}
