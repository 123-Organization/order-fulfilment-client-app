import React from "react";
import { Button } from "antd";

import bigcommerce from "../assets/images/store-bigcommerce.svg";
import etsy from "../assets/images/store-etsy.svg";
import excel from "../assets/images/store-excel.svg";
import shopify from "../assets/images/store-shopify.svg";
import square from "../assets/images/store-square.svg";
import squarespace from "../assets/images/store-squarespace.svg";
import wix from "../assets/images/store-wix.svg";
import woocommerce from "../assets/images/store-woocommerce.svg";
import { useNavigate } from "react-router-dom";

const images = [
  {name : 'Squarespace', img: squarespace},
  {name : 'Shopify', img: shopify},
  {name : 'Wix', img: wix},
  {name : 'BigCommerce', img: bigcommerce},
  {name : 'Square', img: square},
  {name : 'WooCommerce', img: woocommerce},
  {name : 'Etsy', img: etsy},
  {name : 'Excel', img: excel},
];


const Landing: React.FC = (): JSX.Element => {

  const navigate = useNavigate();
  const displayTurtles = images.map(
    (image) => <div className="flex w-1/3 flex-wrap">
      <div className=" w-full p-6 m-4  md:p-2  ">
        <img
          className="block h-[100px] w-[100px] border-2  rounded-lg object-cover object-center"
          src={image.img}
        />
        <p className="text-center pt-2 font-bold text-gray-400">{image.name}</p>
      </div>
    </div>
    )

  return (
    <div className="flex justify-end items-center w-full h-full p-8">
      <div className="w-1/2 flex flex-col justify-center border-r-2 items-center h-[600px]">
        <Button onClick={()=>{ navigate('/mycompany')}} type="primary" size="large" >
          Launch wizard setup
        </Button>
        <div className="text-center text-gray-400 pt-4">
          <p>Edit basic account and payment information  </p>
          <p>needed in order to import orders from your stores.  </p>
        </div>
      </div>
      <div className="w-1/2">
        <div className="container mx-auto px-5 py-2 lg:px-32 justify-center items-center">
          <div className="-m-1 mx-4 flex flex-wrap md:-m-2">
            {displayTurtles}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing;
