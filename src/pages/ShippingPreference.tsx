import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { Checkbox, Form, Input, Select, Tabs, Radio, Space, notification } from "antd";
import { updateShipping } from "../store/features/shippingSlice";
import type { TabsProps } from "antd";
import ShippingPreferencesOption from "../components/ShippingPreferencesOption";


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
    (state) => state.Ecommerce.ecommerceConnectorInfo
  );
  const companyInfo = useAppSelector((state) => state.company.company_info);
  const shippingPreferences = companyInfo?.data?.shipping_preferences;

  console.log("shippingPreferences:", shippingPreferences);
  
  // Initialize with default values
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(["1", "1", "1"]);
  const [optionClicked, setOptionClicked] = useState<boolean>(false);
  console.log("selectedPreferences", selectedPreferences);

  useEffect(() => {
    // Only update if shippingPreferences exists and is an array
    if (Array.isArray(shippingPreferences) && shippingPreferences.length > 0) {
      setSelectedPreferences([...shippingPreferences]);
    } else if (shippingPreferences === undefined || shippingPreferences === null) {
      // If no preferences exist yet, keep using the default values
      console.log("No shipping preferences found, using defaults");
    }
  }, [shippingPreferences]);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false); // Set to false after the first render
      return; // Exit early on the first render
    }

    if (selectedPreferences && selectedPreferences.length > 0) {
      // Update shipping preferences
      dispatch(
        updateShipping(selectedPreferences)
      );
      if (optionClicked) {
        openNotificationWithIcon({
          type: "success",
          message: "Shipping Preferences Updated",
          description: "Your shipping preferences have been updated successfully.",
        });
      }
    }
  }, [selectedPreferences, dispatch]);

  const handlePreferenceChange = (preference: string, index: number) => {
    const updatedPreferences = [...selectedPreferences];
    // Ensure the array is at least as long as the index we're trying to set
    while (updatedPreferences.length <= index) {
      updatedPreferences.push("1"); // Add default value if needed
    }
    updatedPreferences[index] = preference;
    setSelectedPreferences(updatedPreferences);
    setOptionClicked(true);
  };

  // Function to safely get preference value
  const getPreferenceValue = (index: number): string => {
    return selectedPreferences && selectedPreferences.length > index 
      ? selectedPreferences[index] 
      : "1";
  };

  const { Option } = Select;
  type SizeType = Parameters<typeof Form>[0]["size"];

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: <strong className="text-gray-400">Preference 1</strong>,
      children: (
        <ShippingPreferencesOption 
          onChange={(pref) => handlePreferenceChange(String(pref), 0)} 
          initialValue={getPreferenceValue(0)}
          
        />
      ),
    },
    {
      key: "2",
      label: <strong className="text-gray-400">Preference 2</strong>,
      children: (
        <ShippingPreferencesOption 
          onChange={(pref) => handlePreferenceChange(String(pref), 1)} 
          initialValue={getPreferenceValue(1)}
        />
      ), 
    },
    {
      key: "3",
      label: <strong className="text-gray-400">Preference 3</strong>,
      children: (
        <ShippingPreferencesOption 
          onChange={(pref) => handlePreferenceChange(String(pref), 2)} 
          initialValue={getPreferenceValue(2)}
        />
      ), 
    },
  ];

  return (
    <div className="flex flex-col md:flex-row justify-center items-start w-full min-h-screen p-4 md:p-8">
      {/* Left side - Info */}
      <div className="w-full md:w-1/2 flex flex-col justify-start items-center md:border-r-2 md:pr-6 pb-8 md:pb-0">
        <div className="w-full max-w-md px-4 py-2 text-gray-400">
          <h2 className="text-xl font-bold mb-4">Shipping Preferences</h2>
          <p className="mb-2">
            You can have up to 3 shipping preferences. In the rare instance a
            option is not available, the option in your next "preference"
            will be used.
          </p>
        </div>
      </div>
      
      {/* Right side - Tabs */}
      <div className="w-full md:w-1/2 flex justify-start items-start md:pl-6">
        <div className="w-full max-w-lg">
          <div className="mt-4 md:mt-0">
            <Tabs
              defaultActiveKey="1"
              items={items}
              onChange={onChange}
              className="w-full"
              size="large"
              tabBarGutter={24}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPreference;
