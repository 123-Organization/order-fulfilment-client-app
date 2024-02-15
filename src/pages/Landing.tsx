import React, { useState } from "react";
import { Button } from "antd";
import { ReactSpreadsheetImport } from "react-spreadsheet-import";
import type XLSX from "xlsx-ugnis"


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

export enum StepType {
  upload = "upload",
  selectSheet = "selectSheet",
  selectHeader = "selectHeader",
  matchColumns = "matchColumns",
  validateData = "validateData",
}


const fields = [
  {
    // Visible in table header and when matching columns.
    label: "Name",
    // This is the key used for this field when we call onSubmit.
    key: "name",
    // Allows for better automatic column matching. Optional.
    alternateMatches: ["first name", "first"],
    // Used when editing and validating information.
    fieldType: {
      // There are 3 types - "input" / "checkbox" / "select".
      type: "input",
    },
    // Used in the first step to provide an example of what data is expected in this field. Optional.
    example: "Stephanie",
    // Can have multiple validations that are visible in Validation Step table.
    validations: [
      {
        // Can be "required" / "unique" / "regex"
        rule: "required",
        errorMessage: "Name is required",
        // There can be "info" / "warning" / "error" levels. Optional. Default "error".
        level: "error",
      },
    ],
  },
] as const

const Landing: React.FC = (): JSX.Element => {

const [openExcel, setOpenExcel] = useState(false); 
 // Determines if modal is visible.
 const isOpen: boolean = true;

 // Called when flow is closed without reaching submit.
 function onClose() {}
 // Called after user completes the flow. Provides data array, where data keys matches your field keys.
 function onSubmit(data: any) {
   console.log('import',data);
   alert(data);
 }

 const fields = [
   {
     // Visible in table header and when matching columns.
     label: "Name",
     // This is the key used for this field when we call onSubmit.
     key: "name",
     // Allows for better automatic column matching. Optional.
     alternateMatches: ["first name", "first"],
     // Used when editing and validating information.
     fieldType: {
       // There are 3 types - "input" / "checkbox" / "select".
       type: "input"
     },
     // Used in the first step to provide an example of what data is expected in this field. Optional.
     example: "Stephanie",
     // Can have multiple validations that are visible in Validation Step table.
     validations: [
       {
         // Can be "required" / "unique" / "regex"
         rule: "required",
         errorMessage: "Name is required",
         // There can be "info" / "warning" / "error" levels. Optional. Default "error".
         level: "error"
       }
     ]
   },
   {
     // Visible in table header and when matching columns.
     label: "Pitch",
     // This is the key used for this field when we call onSubmit.
     key: "pitch",
     // Allows for better automatic column matching. Optional.
     // Used when editing and validating information.
     fieldType: {
       // There are 3 types - "input" / "checkbox" / "select".
       type: "input"
     },
     // Used in the first step to provide an example of what data is expected in this field. Optional.
     example: "We are working on",
     // Can have multiple validations that are visible in Validation Step table.
     validations: [
       {
         // Can be "required" / "unique" / "regex"
         rule: "required",
         errorMessage: "Pitch is required",
         // There can be "info" / "warning" / "error" levels. Optional. Default "error".
         level: "error"
       }
     ]
   },
   {
     // Visible in table header and when matching columns.
     label: "State",
     // This is the key used for this field when we call onSubmit.
     key: "state",
     // Allows for better automatic column matching. Optional.
     alternateMatches: ["states"],
     // Used when editing and validating information.
     fieldType: {
       // There are 3 types - "input" / "checkbox" / "select".
       type: "input"
     },
     // Used in the first step to provide an example of what data is expected in this field. Optional.
     example: "In Progress",
     // Can have multiple validations that are visible in Validation Step table.
     validations: [
       {
         // Can be "required" / "unique" / "regex"
         rule: "required",
         errorMessage: "Name is required",
         // There can be "info" / "warning" / "error" levels. Optional. Default "error".
         level: "error"
       }
     ]
   },
   {
     // Visible in table header and when matching columns.
     label: "Status",
     // This is the key used for this field when we call onSubmit.
     key: "status",
     // Allows for better automatic column matching. Optional.
     alternateMatches: ["first name", "first"],
     // Used when editing and validating information.
     fieldType: {
       // There are 3 types - "input" / "checkbox" / "select".
       type: "input"
     },
     // Used in the first step to provide an example of what data is expected in this field. Optional.
     example: "Identified",
     // Can have multiple validations that are visible in Validation Step table.
     validations: [
       {
         // Can be "required" / "unique" / "regex"
         rule: "required",
         errorMessage: "Name is required",
         // There can be "info" / "warning" / "error" levels. Optional. Default "error".
         level: "error"
       }
     ]
   },
   {
     // Visible in table header and when matching columns.
     label: "Tags",
     // This is the key used for this field when we call onSubmit.
     key: "tags",
     // Allows for better automatic column matching. Optional.
     alternateMatches: ["first name", "first"],
     // Used when editing and validating information.
     fieldType: {
       // There are 3 types - "input" / "checkbox" / "select".
       type: "input"
     },
     // Used in the first step to provide an example of what data is expected in this field. Optional.
     example: "Stephanie",
     // Can have multiple validations that are visible in Validation Step table.
     validations: [
       {
         // Can be "required" / "unique" / "regex"
         rule: "required",
         errorMessage: "Name is required",
         // There can be "info" / "warning" / "error" levels. Optional. Default "error".
         level: "error"
       }
     ]
   }
 ] as const;


  const navigate = useNavigate();
  const importData =  (imgname:string) => { 
    if(imgname==='Excel'){
      setOpenExcel(true) 

    }
  };

  const displayTurtles = images.map(
    (image) => <div className="flex w-1/3 flex-wrap">
      <div className=" w-full p-6 m-4  md:p-2  " onClick={()=>importData(image.name)}>
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
      { openExcel && <ReactSpreadsheetImport isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} fields={fields} />}
    </div>
  )
}

export default Landing;
