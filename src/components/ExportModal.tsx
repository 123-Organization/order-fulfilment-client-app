import React from "react";
import { Modal, Button, Input, Tag } from "antd";

import bigcommerce from "../assets/images/store-bigcommerce.svg";
import etsy from "../assets/images/store-etsy.svg";
import excel from "../assets/images/store-excel.svg";
import shopify from "../assets/images/store-shopify.svg";
import square from "../assets/images/store-square.svg";
import squarespace from "../assets/images/store-squarespace.svg";
import wix from "../assets/images/store-wix.svg";
import woocommerce from "../assets/images/store-woocommerce.svg";

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
}

const images = [
  { name: "Squarespace", img: squarespace },
  { name: "Shopify", img: shopify },
  { name: "Wix", img: wix },
  { name: "BigCommerce", img: bigcommerce },
  { name: "Square", img: square },
  { name: "WooCommerce", img: woocommerce },
  { name: "Etsy", img: etsy },
  { name: "Excel", img: excel }
];



const ExportModal: React.FC<ExportModalProps> = ({ visible, onClose }) => {
  
  const handleProductCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onClose();
  }

  const importData = (imgname: string) => {
    // if (imgname === "Excel") {
    //   setOpenExcel(true);
    // }

    // if (imgname === "WooCommerce") {
    //   if (!openBtnConnected) {
    //     dispatch(
    //       ecommerceConnector({
    //         account_key: "81de5dba-0300-4988-a1cb-df97dfa4e372"
    //       })
    //     );
    //   }
    //   else{
    //     navigate("/importfilter?type=WooCommerce")
    //   }
    // }
  };

  return (
    <Modal
      title="Select Export option"
      visible={visible}
      width={'55%'}
      onCancel={onClose}  // Close modal when clicking outside or on 'X'
      
    >
      <div className="w-full">
        <div className="container mx-auto px-5 py-2 lg:px-10 justify-center items-center">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
                {  
                images.map((image) => (
                  <div className="flex w-1/3 max-sm:w-1/2 max-[400px]:w-full flex-wrap">
                  <div
                    className="w-full   md:p-2 flex flex-col items-center "
                    onClick={() => importData(image.name)}
                  >
                    {
                    (image.name === "WooCommerce" ) &&
                    <Tag className="absolute ml-12 -mt-3" color="#52c41a">
                      Connected
                    </Tag>
                    }
                    <img
                      className={`block h-[100px] w-[100px] border-2 cursor-pointer rounded-lg object-cover object-center ${image.name === "WooCommerce" ? "grayscale-100": "grayscale"}`}
                      src={image.img}
                    />
                    <p className="text-center pt-2 font-bold text-gray-400">{image.name}</p>
                  </div>
                </div>
              ))
            }
          </div>
          </div>
          </div>
    </Modal>
  );
};

export default ExportModal;
