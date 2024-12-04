import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { Checkbox, Form, Input, Select, Tabs, Radio, Space,notification } from "antd";
import { updateCompanyInfo, updateShipping } from "../store/features/orderSlice";
import type { TabsProps } from "antd";
import ShippingPreferencesOption from "../components/ShippingPreferencesOption";
import { updateLanguageServiceSourceFile } from "typescript";

type NotificationType = "success" | "info" | "warning" | "error";
interface NotificationAlertProps {
  type: NotificationType;
  message: string;
  description: string;
}

const onChange = (key: string) => {
  console.log(key);
};

const ShippingPreference: React.FC = () => {
  const [isFirstRender, setIsFirstRender] = useState(true);

  const openNotificationWithIcon = ({
    type,
    message,
    description,
  }: NotificationAlertProps) => {
    notification[type]({
      message,
      description,
    });
  };

  const dispatch = useAppDispatch();
  const ecommerceConnectorInfo = useAppSelector(
    (state) => state.order.ecommerceConnectorInfo
  );
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([1, 1, 1]);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false); // Set to false after the first render
      return; // Exit early on the first render
    }

    if (selectedPreferences.length > 0) {
      dispatch(
        updateShipping({
          shipping_preferences: [...selectedPreferences],
        })
      );
      openNotificationWithIcon({
        type: "success",
        message: "Shipping Preferences Updated",
        description: "Your shipping preferences have been updated successfully.",
      });
    }
  }, [selectedPreferences, dispatch]); // Removed ecommerceConnectorInfo if unnecessary

  const handlePreferenceChange = (preference: string, index: number) => {
    const updatedPreferences = [...selectedPreferences];
    updatedPreferences[index] = preference;
    setSelectedPreferences(updatedPreferences);
  };

  const { Option } = Select;
  type SizeType = Parameters<typeof Form>[0]["size"];

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: <strong className="text-gray-400">Preference 1</strong>,
      children: <ShippingPreferencesOption onChange={(pref) => handlePreferenceChange(pref, 0)} />,
    },
    {
      key: "2",
      label: <strong className="text-gray-400">Preference 2</strong>,
      children: <ShippingPreferencesOption onChange={(pref) => handlePreferenceChange(pref, 1)} />, 
    },
    {
      key: "3",
      label: <strong className="text-gray-400">Preference 3</strong>,
      children: <ShippingPreferencesOption onChange={(pref) => handlePreferenceChange(pref, 2)} />, 
    },
  ];

  return (
    <div className="flex max-md:flex-col justify-end items-center  w-full h-full p-8 max-md:py-8 max-md:px-4 max-sm:-ml-[30px]">
      <div className="w-1/2 flex flex-col justify-start md:border-r-2 items-center md:h-[600px]">
        <div className="container mx-auto  py-2 md:px-32 justify-center items-center w-full text-gray-400 ">
          <p className="text-lg  font-bold">Shipping Preferences </p>
          <p className="pt-5">
            You can have up to 3 shipping preferences. In the rare instance a{" "}
            <br />
            option is not available, the option in your next "preference" <br />
            will be used.
          </p>
        </div>
      </div>
      <div className="w-1/2 flex justify-start h-screen max-md:-ml-[30px]">
        <div className="container mx-auto md:px-5 py-2  justify-start items-center">
          <div className="mt-4 mx-4 flex flex-wrap md:-m-2 justify-start items-center">
            <Tabs
              defaultActiveKey="1"
              items={items}
              onChange={onChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPreference;
