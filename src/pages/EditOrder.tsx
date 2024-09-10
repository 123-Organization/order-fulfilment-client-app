import React, { useEffect, useState } from "react";
import { Button, Form, Input, Select } from "antd";
import { useNavigate } from "react-router-dom";

import shoppingCart from "../assets/images/shopping-cart-228.svg";
import uploadYourLogo from "../assets/images/upload-your-logo.svg";
import { getStates } from "country-state-picker";
import type { SelectProps } from "antd";
import { countryType } from "../types/ICountry";
import PopupModal from "../components/PopupModal";
import VirtualInvModal from "../components/VirtualInvModal";

type productType = {
  name?: string; // Optional because not all entries have 'name'
  value: string;
  options?: any;
};

// Define the array directly

const countryList = require("../json/country.json");
const { TextArea } = Input;

const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]["size"];

const EditOrder: React.FC = () => {
  const [popupVisible, setPopupVisible] = useState(false);
  const navigate = useNavigate();
  const newProductList: productType[] = [
    {
      name: "Create New",
      value: "/NewProduct",
      options: () => navigate("/NewProduct"), 
    },
    {
      name: "Enter Product code",
      value: "",
      options: () => setPopupVisible(true), 
    },
    {
      name: "Select from Inventory",
      value: "/Inventory",
      options: ()=> setVirtualInv(true),
    },
  ];

  const [componentSize, setComponentSize] = useState<SizeType | "default">(
    "default"
  );
  const [stateData, setStateData] = useState<{ label: string; value: string; }[]>([]);
  const [listVisble, SetListVisble] = useState(false);
  const [virtualINv, setVirtualInv] = useState(false);

  const setStates = (value: string = "us") => {
    let states = getStates(value);
    let data: countryType[] = (states || []).map((d: string) => ({
      label: d,
      value: d,
    }));

    setStateData(data);
  };

  const onChange = (value: string) => {
    console.log(`selected ${value}`);
    setStates(value?.toLowerCase());
  };

  const onSearch = (value: string) => {
    console.log("search:", value);
    //setStates(value);
  };

  // Filter `option.label` match the user type `input`
  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    setStates();
  }, []);

  const displayTurtles = (
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{ size: componentSize }}
      className="w-full flex flex-col items-center"
    >
      <Form.Item name="country_code" className="w-full ">
        <div className="relative">
          <Select
            allowClear
            className="fw-input1 "
            showSearch
            defaultValue={"US"}
            onChange={onChange}
            onSearch={onSearch}
            filterOption={filterOption}
            options={countryList}
          ></Select>
          <label htmlFor="floating_outlined" className="fw-label">
            Country
          </label>
        </div>
      </Form.Item>
      <Form.Item name="company_name" className="w-full ">
        <div className="relative">
          <Input className="fw-input" />
          <label htmlFor="floating_outlined" className="fw-label">
            My Company Name
          </label>
        </div>
      </Form.Item>
      <Form.Item name="first_name" className="w-full ">
        <div className="relative">
          <Input className="fw-input" />
          <label htmlFor="floating_outlined" className="fw-label">
            First Name
          </label>
        </div>
      </Form.Item>
      <Form.Item name="last_name" className="w-full ">
        <div className="relative">
          <Input className="fw-input" />
          <label htmlFor="floating_outlined" className="fw-label">
            Last Name
          </label>
        </div>
      </Form.Item>
      <Form.Item name="address_1" className="w-full ">
        <div className="relative">
          <Input className="fw-input" />
          <label htmlFor="floating_outlined" className="fw-label">
            Address Line 1
          </label>
        </div>
      </Form.Item>
      <Form.Item name="address_2" className="w-full ">
        <div className="relative">
          <Input className="fw-input" />
          <label htmlFor="floating_outlined" className="fw-label">
            Address Line 2
          </label>
        </div>
      </Form.Item>
      <Form.Item name="city" className="w-full ">
        <div className="relative">
          <Input className="fw-input" />
          <label htmlFor="floating_outlined" className="fw-label">
            City
          </label>
        </div>
      </Form.Item>

      <Form.Item name="state" className="w-full ">
        <div className="relative">
          <Select
            placeholder="State"
            allowClear
            showSearch
            className="fw-input1 "
            filterOption={filterOption}
            options={stateData}
          >
            <label htmlFor="floating_outlined" className="fw-label">
              State
            </label>
          </Select>
        </div>
      </Form.Item>

      <Form.Item name="zip_postal_code" className="w-full ">
        <div className="relative">
          <Input className="fw-input" />
          <label htmlFor="floating_outlined" className="fw-label">
            Zip
          </label>
        </div>
      </Form.Item>

      <Form.Item name="phone" className="w-full ">
        <div className="relative">
          <Input className="fw-input" />
          <label htmlFor="floating_outlined" className="fw-label">
            Phone
          </label>
        </div>
      </Form.Item>

      <TextArea rows={4} maxLength={6} />
    </Form>
  );

  const displayTurtlesTotal = (
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{ size: componentSize }}
      className="w-full text-left text-400 country_code_importlist_form"
    >
      <Form.Item name="country_code_importlist">
        <div className="relative w-full text-gray-500">
          <Select
            // allowClear
            className="w-full  "
            showSearch
            placeholder="Order status"
            optionFilterProp="children"
            onChange={onChange}
            onSearch={onSearch}
            filterOption={filterOption}
            value={"economy"}
            options={[
              {
                value: "economy",
                label: "Economy Parcel - $14.95",
              },
              {
                value: "shipped",
                label: "Shipped Parcel - $18.95",
              },
            ]}
          ></Select>
          <label htmlFor="floating_outlined" className="fw-label ">
            Shipping Method
          </label>
        </div>
      </Form.Item>
    </Form>
  );

  return (
    <div className="flex max-md:flex-col  justify-end items-start w-full h-full p-8">
      <div className="w-1/3 max-md:w-full md:border-r-2 max-md:pb-4 max-md:border-b-2">
        <div className="container mx-auto px-5 py-2 lg:px-8 md:px-4 justify-center items-center">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
            <p className="text-lg text-gray-400 py-4 font-bold">Recipient</p>
            {displayTurtles}
          </div>
        </div>
      </div>

      <div className="w-1/2 max-md:w-full flex flex-col justify-start md:border-r-2  max-md:border-b-2 max-md:pb-6  items-center h-[800px] max-md:h-auto">
        <div className="text-left w-full px-4 text-gray-400 pt-4">
          <p className="text-lg pb-4 text-gray-400  font-bold">Cart</p>
          <label className="h-[220px] max-md:h-auto inline-flex  justify-between w-full p-5 text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
            <div className="block relative pb-4 w-full">
              <p className="text-right">
                Quantity <br />
                <label className="text-center w-40">1</label>
              </p>
              <div className="justify-between pt-6  rounded-lg  sm:flex sm:justify-start">
                <img
                  src="https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1131&q=80"
                  // src="https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                  alt="product-image"
                  className="rounded-lg"
                  width={116}
                  height={26}
                />
                <div className="sm:ml-4 flex flex-col w-full sm:justify-between">
                  <div className="w-full text-sm">John Doe</div>
                  <div className="w-full text-sm">1234 Elm Street</div>
                  <div className="w-full text-sm">Suite 567</div>
                  <div className="w-full text-sm">
                    Cityvile, Statevile 98567
                  </div>
                </div>
              </div>
              <p className="flex">
                <button
                  data-tooltip-target="tooltip-document"
                  type="button"
                  className="max-md:pl-2 mt-2 inline-flex  flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
                >
                  <svg
                    className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 20"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z"
                    />
                  </svg>
                </button>
                <div className="w-40 ml-20 pt-3">
                  <Button
                    key="submit"
                    className="   w-full text-gray-500"
                    size={"small"}
                    type="default"
                  >
                    Add / Change Image
                  </Button>
                </div>
                <div className=" text-sm  absolute right-2 -bottom-3">
                  $75.00 ea
                </div>
              </p>
            </div>
          </label>
        </div>
        <div className="mt-4 w-full ml-10 bg-transparent">
          <Button
            key="submit"
            className=" flex-col w-[130px] text-white bg-green-600 rounded-lg text-center font-semibold border-gray-500"
            size={"small"}
            style={{ backgroundColor: "#6fc64f" }}
            type="default"
            onClick={() => SetListVisble(!listVisble)}
          >
            + Add Product
          </Button>
          <div className="ml-4">
            {newProductList.map((product, index) => (
              <ul className={listVisble ? "block " : "hidden"}>
                <li key={index}>
                  <Button
                    key="submit"
                    className="   w-4/12 text-gray-500 "
                    size={"small"}
                    type="default"
                    onClick={product.options}
                  >
                    {product.name}
                  </Button>
                </li>
              </ul>
            ))}
            <PopupModal visible={popupVisible} onClose={() => setPopupVisible(false)} />
            <VirtualInvModal visible={virtualINv} onClose={() => setVirtualInv(false)} />
          </div>
        </div>
      </div>

      <div className="w-1/3 max-md:w-full mt-1">
        <div className="container mx-auto px-5 py-2 lg:px-8 md:px-4 justify-start items-center">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
            <p className="text-lg my-2 pb-4 text-gray-400 text-left font-bold">
              Shippings & Totals
            </p>
            <div className="block w-full text-gray-400 text-right">
              {displayTurtlesTotal}
              <div className="w-full text-sm pt-11"></div>
              <div className="w-full text-sm">Sub Total: $75.00</div>
              <div className="w-full text-sm">Discount: ($0.00)</div>
              <div className="w-full text-sm">Shipping : $14.95</div>
              <div className="w-full text-sm">Sales Tax : $5.25</div>
              <div className="w-full text-sm">Grand Total : $95.25</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrder;
