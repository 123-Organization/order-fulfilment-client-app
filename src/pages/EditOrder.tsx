import React, { useEffect, useState } from "react";
import { Form, Input, Select } from "antd";
import { useParams } from "react-router-dom";
import { getStates } from "country-state-picker";
import { countryType } from "../types/ICountry";
import { useAppDispatch, useAppSelector } from "../store";
import {
  updateOrderStatus,
  fetchSingleOrderDetails,
  setUpdatedValues,
} from "../store/features/orderSlice";
import UpdatePopup from "../components/UpdatePopup";
import convertUsStateAbbrAndName from "../services/state";

const countryList = require("../json/country.json");

const EditOrder: React.FC = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();

  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const orderData = useAppSelector((state) => state.order.order) || {};
  const orderEdited = useAppSelector((state) => state.order.orderEdited) || [];
  const { phone } = useAppSelector(
    (state) => state.company.company_info?.data?.billing_info
  ) || {};

  const order = orderData.data ? orderData.data[0] : {};
  const { recipient } = order || {};

  const recipientErrors = useAppSelector(
    (state) => (state.Shipping as any).recipientErrors || {}
  );
  const orderErrors: Record<string, string[]> = recipient
    ? recipientErrors[order?.order_po] || {}
    : {};

  const [form] = Form.useForm();
  const [changedValues, setChangedValues] = useState<any>({});
  const [stateData, setStateData] = useState<{ label: string; value: string }[]>([]);
  const [stateCodeShort, setStateCodeShort] = useState(recipient?.state_code);

  const hasRecipientPhone = Boolean(recipient?.phone && String(recipient.phone).trim());
  const phoneValue = hasRecipientPhone ? recipient.phone : phone || "";
  const isPhoneEditable = hasRecipientPhone;

  const initialValues = React.useMemo(
    () => ({
      country_code: order?.country_code || recipient?.country_code || "US",
      company_name: recipient?.company_name || "",
      first_name: recipient?.first_name || "",
      last_name: recipient?.last_name || "",
      address_1: recipient?.address_1 || "",
      address_2: recipient?.address_2 || "",
      city: recipient?.city || "",
      state_code: recipient?.state_code || stateCodeShort,
      zip_postal_code: recipient?.zip_postal_code?.toString() || "",
      phone: phoneValue,
    }),
    [order, recipient, phone, phoneValue]
  );

  useEffect(() => {
    dispatch(fetchSingleOrderDetails({ accountId: customerInfo?.data?.account_id, orderFullFillmentId: id }));
  }, [dispatch]);

  useEffect(() => { form.setFieldsValue(initialValues); }, [form, initialValues]);

  useEffect(() => {
    if (recipient?.state_code || recipient?.state) {
      setStateCodeShort(convertUsStateAbbrAndName(recipient?.state_code?.toLowerCase()));
    }
  }, [recipient]);

  const setStates = (value: string = "us") => {
    const states = getStates(value);
    const data: countryType[] = (states || []).map((d: string) => ({ label: d, value: d }));
    setStateData(data);
  };

  useEffect(() => { setStates(); }, []);

  const filterOption = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const handleCountryChange = (value: string) => {
    setStates(value?.toLowerCase());
    form.setFieldValue("state_code", undefined);
  };

  // Snapshot initial values once loaded so we can detect any change
  const initialSnapshot = React.useRef<any>(null);
  useEffect(() => {
    if (!initialSnapshot.current && recipient) {
      initialSnapshot.current = {
        country_code: order?.country_code || recipient?.country_code || "US",
        company_name: recipient?.company_name || "",
        first_name: recipient?.first_name || "",
        last_name: recipient?.last_name || "",
        address_1: recipient?.address_1 || "",
        address_2: recipient?.address_2 || "",
        city: recipient?.city || "",
        state_code: recipient?.state_code || "",
        zip_postal_code: recipient?.zip_postal_code?.toString() || "",
        phone: phoneValue,
      };
    }
  }, [recipient]);

  const handleValuesChange = (changed: any, allValues: any) => {
    if (changed?.state_code !== undefined) {
      changed.state_code = changed.state_code
        ? convertUsStateAbbrAndName(changed.state_code)
        : "";
    }
    // Show the update button as soon as ANY value differs from the snapshot
    const snap = initialSnapshot.current || {};
    const hasChanged = Object.keys(allValues).some(
      (k) => String(allValues[k] ?? "") !== String(snap[k] ?? "")
    );
    dispatch(updateOrderStatus({ status: hasChanged, clicked: false }));
    const updatedRecipient = { ...allValues, ...changed };
    if (!updatedRecipient.state_code && updatedRecipient.country_code?.toLowerCase() !== "us") {
      updatedRecipient.province = updatedRecipient.city;
    }

    dispatch(setUpdatedValues({ ...order, recipient: updatedRecipient }));
    setChangedValues((prev: any) => ({ ...prev, ...changed }));
  };

  const hasErrors = Object.keys(orderErrors).length > 0;

  const fieldLabel = (text: string, optional = false) => (
    <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {text}
      {optional && <span style={{ fontWeight: 400, color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}> (opt)</span>}
    </span>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        {/* Card header */}
        <div
          style={{
            padding: "14px 24px 12px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: "#eff6ff",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="16" height="16" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>Edit Shipping Address</p>
              <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>Order #{order?.order_po || id}</p>
            </div>
          </div>

          {hasErrors && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600, color: "#dc2626",
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 6, padding: "3px 8px", flexShrink: 0,
            }}>
              <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {Object.keys(orderErrors).length} issue{Object.keys(orderErrors).length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Form body */}
        <div style={{ padding: "16px 24px 20px" }}>
          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onValuesChange={handleValuesChange}
            size="small"
          >
            {/* Country */}
            <Form.Item
              name="country_code" label={fieldLabel("Country")}
              rules={[{ required: true, message: "Required" }]}
              validateStatus={orderErrors["country_code"] ? "error" : undefined}
              help={orderErrors["country_code"]?.[0]}
              style={{ marginBottom: 8 }}
            >
              <Select showSearch allowClear placeholder="Select country" onChange={handleCountryChange} filterOption={filterOption} options={countryList} />
            </Form.Item>

            {/* First / Last */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Form.Item name="first_name" label={fieldLabel("First Name")} rules={[{ required: true, message: "Required" }]} style={{ marginBottom: 8 }}>
                <Input placeholder="First name" />
              </Form.Item>
              <Form.Item name="last_name" label={fieldLabel("Last Name")} rules={[{ required: true, message: "Required" }]} style={{ marginBottom: 8 }}>
                <Input placeholder="Last name" />
              </Form.Item>
            </div>

            {/* Company */}
            <Form.Item name="company_name" label={fieldLabel("Company", true)} style={{ marginBottom: 8 }}>
              <Input placeholder="Company name" />
            </Form.Item>

            {/* Address 1 */}
            <Form.Item
              name="address_1" label={fieldLabel("Address Line 1")}
              rules={[{ required: true, message: "Required" }]}
              validateStatus={orderErrors["address_1"] ? "error" : undefined}
              help={orderErrors["address_1"]?.[0]}
              style={{ marginBottom: 8 }}
            >
              <Input placeholder="Street address" />
            </Form.Item>

            {/* Address 2 */}
            <Form.Item name="address_2" label={fieldLabel("Address Line 2", true)} style={{ marginBottom: 8 }}>
              <Input placeholder="Apt, suite, floor…" />
            </Form.Item>

            {/* City / State / Zip */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Form.Item
                name="city" label={fieldLabel("City")}
                rules={[{ required: true, message: "Required" }]}
                validateStatus={orderErrors["city"] ? "error" : undefined}
                help={orderErrors["city"]?.[0]}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="City" />
              </Form.Item>
              <Form.Item
                name="state_code" label={fieldLabel("State")}
                validateStatus={orderErrors["state_code"] ? "error" : undefined}
                help={orderErrors["state_code"]?.[0]}
                style={{ marginBottom: 8 }}
              >
                <Select showSearch allowClear placeholder="State" filterOption={filterOption} options={stateData} />
              </Form.Item>
              <Form.Item
                name="zip_postal_code" label={fieldLabel("Zip / Postal")}
                rules={[{ required: true, message: "Required" }]}
                validateStatus={orderErrors["zip_postal_code"] ? "error" : undefined}
                help={orderErrors["zip_postal_code"]?.[0]}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="Postal code" />
              </Form.Item>
            </div>

            {/* Phone */}
            <Form.Item
              name="phone"
              label={fieldLabel(isPhoneEditable ? "Phone (Recipient)" : "Phone (Billing — read only)")}
              style={{ marginBottom: 0 }}
            >
              <Input
                placeholder="Phone number"
                disabled={!isPhoneEditable}
                style={!isPhoneEditable ? { backgroundColor: "#f9fafb", cursor: "not-allowed", color: "#9ca3af" } : {}}
              />
            </Form.Item>
          </Form>
        </div>
      </div>

      {/* Save popup — triggered by BottomIcon */}
      <UpdatePopup
        ChangedValues={changedValues}
        visible={orderEdited.clicked}
        onClose={() => dispatch(updateOrderStatus({ status: false, clicked: false }))}
      />
    </div>
  );
};

export default EditOrder;
