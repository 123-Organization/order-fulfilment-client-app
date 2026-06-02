import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Switch } from "antd";
import { useAppSelector, useAppDispatch } from "../store";
import { useCookies } from "react-cookie";
import { disconnectEcommerce, disconnectShopify, resetStatus } from "../store/features/ecommerceSlice";
import { disconnectInventory } from "../store/features/InventorySlice";
import {
  clearShopifyCredentials,
  setConnectionVerificationStatus,
  updateCompanyInfo,
} from "../store/features/companySlice";
import { useNotificationContext } from "../context/NotificationContext";

interface PlatformSettingsModalProps {
  platform: string;
  hasOrderSync: boolean;
  orderSyncOn: boolean;
  orderSyncLoading: boolean;
  orderSyncDisconnecting: boolean;
  onOrderSyncToggle: (newValue: boolean, e: React.MouseEvent) => void;
  onDisconnected: () => void;
  isDark: boolean;
}

const PlatformSettingsModal: React.FC<PlatformSettingsModalProps> = ({
  platform,
  hasOrderSync,
  orderSyncOn,
  orderSyncLoading,
  orderSyncDisconnecting,
  onOrderSyncToggle,
  onDisconnected,
  isDark,
}) => {
  const dispatch = useAppDispatch();
  const [cookies] = useCookies(["Session", "AccountGUID"]);
  const notificationApi = useNotificationContext();
  const companyInfo = useAppSelector((state) => state.company.company_info);
  const wordpressConnectionId = useAppSelector((state) => state.company.wordpress_connection_id);
  const shopifyShop = useAppSelector((state) => state.company.shopify_shop);

  const [open, setOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [gearSpinning, setGearSpinning] = useState(false);
  // Fixed-position coords for the floating modal
  const [modalCoords, setModalCoords] = useState<{ top: number; right: number } | null>(null);

  const btnRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on outside click or scroll
  const closeModal = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        modalRef.current && !modalRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) closeModal();
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", closeModal, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", closeModal, true);
    };
  }, [open, closeModal]);

  const handleGearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGearSpinning(true);
    setTimeout(() => setGearSpinning(false), 600);

    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setModalCoords({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  };

  const getConnectionId = (): string | undefined => {
    const conns = companyInfo?.data?.connections || [];
    const conn = conns.find((c: any) => c.name === platform);
    if (platform === "Shopify") return shopifyShop || conn?.id;
    if (platform === "WooCommerce") return conn?.id?.split("?")[0] || wordpressConnectionId;
    return conn?.id;
  };

  const handleDisconnect = async (checked: boolean) => {
    if (checked) return; // already connected — noop
    setDisconnecting(true);
    try {
      const accountKey = cookies.AccountGUID;
      const slug = platform.toLowerCase();

      if (platform === "Squarespace" || platform === "Wix") {
        const res = await fetch(
          `https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/stores/disconnect?slug=${slug}&account_key=${accountKey}`,
          { method: "POST" }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `Failed to disconnect ${platform}`);
        }
        if (platform === "Squarespace") {
          localStorage.removeItem("squarespace_token");
          localStorage.removeItem("squarespace_access_token");
          localStorage.removeItem("squarespace_account_key");
        }
        dispatch(resetStatus());
        dispatch(updateCompanyInfo({}));
      } else if (platform === "Shopify") {
        await dispatch(disconnectShopify({ account_key: accountKey }));
        dispatch(clearShopifyCredentials());
        dispatch(resetStatus());
        dispatch(updateCompanyInfo({}));
      } else {
        // WooCommerce
        await dispatch(disconnectEcommerce({ client_id: accountKey, platformName: slug, domainName: getConnectionId() }));
        await dispatch(disconnectInventory({ data: { account_key: accountKey, platform: slug } }));
        dispatch(resetStatus());
        dispatch(setConnectionVerificationStatus("disconnected"));
        dispatch(updateCompanyInfo({}));
      }

      notificationApi?.success({
        message: `${platform} Disconnected`,
        description: `${platform} has been successfully disconnected.`,
      });
      setOpen(false);
      onDisconnected();
    } catch (err: any) {
      notificationApi?.error({
        message: "Disconnection Failed",
        description: err?.message || `Failed to disconnect ${platform}. Please try again.`,
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const bg     = isDark ? "#0d1625" : "#ffffff";
  const border = isDark ? "#1e2d42" : "#e8edf5";
  const text   = isDark ? "#c8d0dc" : "#374151";
  const sub    = isDark ? "#4e6280" : "#9ca3af";

  // The floating modal rendered into document.body via portal
  const floatingModal = open && modalCoords
    ? ReactDOM.createPortal(
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: modalCoords.top,
            right: modalCoords.right,
            width: 240,
            background: bg,
            border: `1.5px solid ${border}`,
            borderRadius: 16,
            boxShadow: isDark
              ? "0 20px 60px rgba(0,0,0,.7), 0 4px 16px rgba(0,0,0,.5)"
              : "0 20px 60px rgba(0,0,0,.16), 0 4px 16px rgba(0,0,0,.1)",
            padding: "14px 16px 12px",
            zIndex: 99999,
            animation: "psm-pop .2s cubic-bezier(.34,1.56,.64,1) both",
          }}
        >
          <style>{`
            @keyframes psm-pop {
              0%   { opacity:0; transform:scale(.82) translateY(-8px); }
              70%  { opacity:1; transform:scale(1.02) translateY(2px); }
              100% { transform:scale(1) translateY(0); }
            }
            .psm-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; }
            .psm-row + .psm-row { border-top: 1px solid ${border}; }
          `}</style>

          {/* Header */}
          <p style={{ margin: "0 0 8px", fontSize: 10.5, fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: 0.8 }}>
            {platform} Settings
          </p>

          {/* Auto-fulfill */}
          {hasOrderSync && (
            <div className="psm-row">
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text }}>Auto-fulfill</p>
                <p style={{ margin: 0, fontSize: 11, color: sub }}>Auto-import new orders</p>
              </div>
              <Switch
                size="small"
                checked={orderSyncOn}
                loading={orderSyncLoading || orderSyncDisconnecting}
                onChange={(val, e) => onOrderSyncToggle(val, e as unknown as React.MouseEvent)}
                style={{ background: orderSyncOn ? "#14b8a6" : undefined }}
              />
            </div>
          )}

          {/* Disconnect */}
          <div className="psm-row">
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text }}>Connected</p>
              <p style={{ margin: 0, fontSize: 11, color: sub }}>Toggle off to disconnect</p>
            </div>
            <Switch
              size="small"
              checked={true}
              loading={disconnecting}
              onChange={handleDisconnect}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </div>

          {/* Warning */}
          <p style={{
            margin: "10px 0 0",
            fontSize: 10.5,
            lineHeight: 1.5,
            color: isDark ? "#f97316" : "#b45309",
            background: isDark ? "rgba(249,115,22,.1)" : "#fff7ed",
            border: `1px solid ${isDark ? "rgba(249,115,22,.25)" : "#fed7aa"}`,
            borderRadius: 8,
            padding: "6px 8px",
          }}>
            ⚠ Disconnecting removes all data and cannot be undone.
          </p>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <style>{`
        @keyframes gear-float {
          0%, 100% { transform: translateY(0px); box-shadow: 0 4px 12px rgba(59,130,246,.25); }
          50%       { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(59,130,246,.4); }
        }
        @keyframes gear-spin-in { from{transform:rotate(0deg)} to{transform:rotate(180deg)} }
        .gear-trigger {
          animation: gear-float 2.8s ease-in-out infinite;
          transition: background .2s, border-color .2s, filter .15s;
        }
        .gear-trigger:hover { filter: brightness(1.25) !important; }
        .gear-trigger:active { transform: scale(.85) !important; }
        .gear-open { animation: none !important; }
      `}</style>

      {/* Gear button — floats off the top-right corner of the card */}
      <div
        ref={btnRef}
        className={`gear-trigger${open ? " gear-open" : ""}`}
        onClick={handleGearClick}
        title="Platform settings"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: open
            ? (isDark ? "#1e3a6e" : "#dbeafe")
            : (isDark ? "#162240" : "#eff6ff"),
          border: `2px solid ${open ? (isDark ? "#3b82f6" : "#60a5fa") : (isDark ? "#2d4a7a" : "#bfdbfe")}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 20,
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={open ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#3b82f6" : "#4b8ef5")}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            display: "inline-block",
            animation: gearSpinning ? "gear-spin-in .6s ease-out" : "none",
          }}
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </div>

      {floatingModal}
    </>
  );
};

export default PlatformSettingsModal;
