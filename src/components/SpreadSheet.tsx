import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
import { useRef, useState } from "react";
import { registerAllModules } from "handsontable/registry";
import { HotTable } from "@handsontable/react-wrapper";
import * as XLSX from "xlsx";
import { Steps, Button, Alert, Modal, ConfigProvider, Result } from "antd";
import {
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  FileExcelOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import style from "../pages/Pgaes.module.css";
import cssModule from "./SpreadSheet.module.css";
import { UploadOrdersExcel } from "../store/features/orderSlice";
import { useAppDispatch, useAppSelector } from "../store";
import { useNavigate } from "react-router-dom";

registerAllModules();

type SpreadsheetData = (string | number)[][];

interface ValidationError {
  row: number;
  column: string;
  message: string;
}

interface SpreadSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const requiredFields = [
  "order_po",
  "ship_first_name",
  "ship_last_name",
  "ship_address_1",
  "ship_city",
  "ship_state_code",
  "ship_zip",
  "ship_phone",
  "product_qty",
  "product_sku",
];

const hotSettings = {
  stretchH: "all" as const,
  autoWrapRow: true,
  autoWrapCol: true,
  rowHeaders: true,
  colHeaders: true,
  height: 400,
  licenseKey: "non-commercial-and-evaluation",
  className: cssModule.customHotTable,
  contextMenu: true,
  manualColumnResize: true,
  manualRowResize: true,
  filters: true,
  dropdownMenu: true,
  headerTooltips: true,
  columnSorting: true,
  afterGetColHeader: (col: number, TH: HTMLElement) => {
    TH.className = "custom-header";
  },
} as const;

export default function SpreadSheet({ isOpen, onClose }: SpreadSheetProps) {
  const hotRef = useRef<any>(null);
  const [data, setData] = useState<SpreadsheetData>([]);
  const navigate = useNavigate();
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const uploadStatus = useAppSelector((state) => state.order.uploadStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [stepStatus, setStepStatus] = useState<
    "error" | "finish" | "wait" | "process" | undefined
  >("process");
  const [confirmation, setConfirmation] = useState({
    first: "in progress",
    second: "wait",
    third: "wait",
  });
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const dispatch = useAppDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
      ) {
        processFile(file);
      }
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const binaryStr = event.target?.result;
      if (typeof binaryStr !== "string") return;

      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];

      const jsonData = XLSX.utils.sheet_to_json(ws, {
        header: 1,
      }) as SpreadsheetData;
      setData(jsonData);
      setStep(1);
      setConfirmation({
        first: "Finished",
        second: "in progress",
        third: "wait",
      });
    };

    reader.readAsBinaryString(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const binaryStr = event.target?.result;
      if (typeof binaryStr !== "string") return;

      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];

      const jsonData = XLSX.utils.sheet_to_json(ws, {
        header: 1,
      }) as SpreadsheetData;
      setData(jsonData);
      setStep(1);
      setConfirmation({
        first: "Finished",
        second: "in progress",
        third: "wait",
      });
    };

    reader.readAsBinaryString(file);
  };

  const validateData = () => {
    const errors: ValidationError[] = [];
    const headers = data[0] as string[];

    // Validate headers
    const missingFields = requiredFields.filter(
      (field) => !headers.includes(field)
    );
    if (missingFields.length > 0) {
      errors.push({
        row: 0,
        column: "headers",
        message: `Missing required columns: ${missingFields.join(", ")}`,
      });
    }

    // Validate data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      headers.forEach((header, columnIndex) => {
        if (requiredFields.includes(header) && !row[columnIndex]) {
          errors.push({
            row: i,
            column: header,
            message: `Missing required value for ${header}`,
          });
        }
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmitOrders = async () => {
    setIsLoading(true);
    try {
      // Convert data to orders
      const headers = data[0] as string[];
      const orders = data.slice(1).map((row) => {
        const order: Record<string, any> = {};
        headers.forEach((header, index) => {
          order[header] = row[index];
        });
        return order;
      });

      // Here you would typically send the orders to your API
      // await api.createOrders(orders);
      const postOrders = orders.map((order) => {
        return {
          order_po: order.order_po,
          recipient: {
            first_name: order.ship_first_name,
            last_name: order.ship_last_name,
            company_name: order.ship_company_name,
            address_1: order.ship_address_1,
            address_2: order.ship_address_2,
            address_3: "",
            city: order.ship_city,
            state: order.ship_state_code,
            province: order.ship_province,
            zip_postal_code: order.ship_zip,
            country_code: order.ship_country_code,
            phone: order.ship_phone,
            email: "dumdum@gmail.com",
            address_order_po: "",
          },
          order_items: [
            {
              product_qty: order.product_qty,
              product_sku: order.product_sku,
              image_url_1: order.product_image_file_url,
              product_url_thumbnail: order.product_image_file_url,
              product_cropping: order.product_cropping,
            },
          ],
          order_status: "Processing",
          shipping_code: order.shipping_code,
          test_mode: true,
        };
      });
      
      dispatch(
        UploadOrdersExcel({
          accountId: customerInfo?.data?.account_id,
          payment_token: customerInfo?.data?.payment_profile_id,
          orders: [...postOrders],
        })
      );
      console.log("to send", orders);

      setStep(3);
      setStepStatus("finish");
      setConfirmation({
        first: "Finished",
        second: "Finished",
        third: "Finished",
      });
    } catch (error) {
      setStepStatus("error");
      setConfirmation({ ...confirmation, third: "Error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      const isValid = validateData();
      if (!isValid) {
        setStepStatus("error");
        return;
      }
      setConfirmation({
        first: "Finished",
        second: "Finished",
        third: "in progress",
      });
      setStep(2);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
      setStepStatus("process");
      if (step === 2) {
        setConfirmation({
          first: "Finished",
          second: "in progress",
          third: "wait",
        });
      } else {
        setConfirmation({
          first: "in progress",
          second: "wait",
          third: "wait",
        });
      }
    }
  };

  const handleClose = () => {
    setStep(0);
    setData([]);
    setValidationErrors([]);
    setStepStatus("process");
    setConfirmation({ first: "in progress", second: "wait", third: "wait" });
    onClose();
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "exported_data.xlsx");
  };

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <div
            className={`${cssModule.uploadContainer} ${
              isDragging ? cssModule.dragActive : ""
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className={cssModule.hiddenInput}
            />
            <FileExcelOutlined className={cssModule.uploadIcon} />
            <p className={cssModule.uploadText}>
              Click or drag Excel file to upload
            </p>
            <p className={cssModule.uploadSubText}>
              Support for .xlsx or .xls files
            </p>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            {validationErrors.length > 0 ? (
              <Alert
                message={`Validation Errors (${validationErrors.length})`}
                description={
                  <ul className="max-h-40 overflow-auto list-disc pl-4">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-red-600">
                        Row {error.row + 1}, {error.column}: {error.message}
                      </li>
                    ))}
                  </ul>
                }
                type="error"
                showIcon
              />
            ) : (
              <Alert
                message="Data Validation Successful"
                type="success"
                showIcon
              />
            )}
            <div className="border rounded-lg overflow-hidden shadow-inner bg-white">
              <HotTable ref={hotRef} data={data} {...hotSettings} />
            </div>
          </div>
        );
      case 2:
        return (
          <ConfigProvider
            theme={{
              components: {
                Result: {
                  titleFontSize: 20,
                  iconFontSize: 64,
                },
              },
            }}
          >
            <Result
              icon={<ExclamationCircleOutlined className="text-blue-500" />}
              title="Ready to Create Orders"
              subTitle={`${
                data.length - 1
              } orders will be created. Please confirm to proceed.`}
            />
          </ConfigProvider>
        );
      case 3:
        return (
          <ConfigProvider
            theme={{
              components: {
                Result: {
                  titleFontSize: 20,
                  iconFontSize: 64,
                },
              },
            }}
          >
            <Result
              status="success"
              title="Orders Ready For Import!"
              subTitle={`${data.length - 1} Rows to be submitted`}
            />
          </ConfigProvider>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">Import Orders</span>
          {data.length > 0 && (
            <span className="text-sm text-gray-500">
              ({data.length - 1} orders)
            </span>
          )}
        </div>
      }
      open={true}
      onCancel={handleClose}
      width={1200}
      footer={null}
      maskClosable={false}
      className={cssModule.customModal}
    >
      <div className="space-y-6">
        <Steps
          current={step}
          status={stepStatus}
          items={[
            {
              title: "Upload",
              description: "Select Excel File",
            },
            {
              title: confirmation.first,
              description: "Validate Data",
            },
            {
              title: confirmation.second,
              description: "Create Orders",
            },
          ]}
        />

        <div className="mt-8">{renderContent()}</div>

        <div className="flex justify-between pt-4 border-t mt-6">
          <div className="w-full">
            {step === 3 && (
              <div className="flex justify-between">
                <Button onClick={handleClose}>Done</Button>
                <Button
                  type="primary"
                  onClick={() => navigate("/importlist")}
                  loading={uploadStatus === "loading"}
                >
                  {uploadStatus === "loading" ? "Processing..." : (
                    <>
                      Go to orders <ArrowRightOutlined />
                    </>
                  )}
                </Button>
              </div>
            )}

            {data.length > 0 && step !== 3 && (
              <Button onClick={exportToExcel}>Export to Excel</Button>
            )}
          </div>

          <div className="flex gap-2">
            {step > 0 && step < 3 && (
              <Button onClick={handlePrev}>Previous</Button>
            )}

            {step === 1 && (
              <Button type="primary" onClick={handleNext}>
                Next
              </Button>
            )}

            {step === 2 && (
              <Button
                type="primary"
                onClick={handleSubmitOrders}
                loading={isLoading}
              >
                Create Orders
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Add this CSS to your global styles or module CSS
const styles = `
.custom-hot-table .handsontable {
  font-size: 14px;
}

.custom-hot-table .handsontable .custom-header {
  background: #f0f2f5;
  font-weight: 600;
  text-align: center;
}

.custom-hot-table .handsontable td {
  padding: 8px 4px;
}

.custom-modal .ant-modal-content {
  padding: 0;
}

.custom-modal .ant-modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f2f5;
  margin-bottom: 0;
}

.custom-modal .ant-modal-body {
  padding: 24px;
}

.custom-modal .ant-steps-item-title {
  font-weight: 500;
}

${style.fileInput} {
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

${style.fileInput}:hover {
  border-color: #1890ff;
}
`;
