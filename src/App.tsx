import React from "react";
import "./App.css";
import { Layout, theme, ConfigProvider } from "antd";
import Router from "./routes";
import { useState } from "react";
import HeaderIcon from "./components/HeaderIcon";
import BottomIcon from "./components/BottomIcon";
import { useLocation } from "react-router-dom";
import FileManagementIframe from "./components/FileManagmentIframe";
import { NotificationProvider } from "./context/NotificationContext";
import { SearchProvider } from "./context/SearchContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

const { Header, Footer, Content } = Layout;

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [iframe, setIframe] = useState(false);
  const location = useLocation();
  const { isDark } = useTheme();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgBase:       isDark ? "#0f1724" : "#ffffff",
          colorTextBase:     isDark ? "#e8edf5" : "#000000",
          colorBorder:       isDark ? "#1e2d42" : "#d9d9d9",
          colorBgContainer:  isDark ? "#0f1724" : "#ffffff",
          colorBgElevated:   isDark ? "#131e30" : "#ffffff",
          colorBgLayout:     isDark ? "#080c14" : "#f5f5f5",
          colorBgSpotlight:  isDark ? "#0a2520" : "#f0f0f0",
          colorPrimary:      isDark ? "#14b8a6" : "#1677ff",
          colorLink:         isDark ? "#14b8a6" : "#1677ff",
          colorText:         isDark ? "#e8edf5" : "#000000",
          colorTextSecondary: isDark ? "#8892a4" : "#666666",
          colorTextTertiary:  isDark ? "#4e5a6e" : "#999999",
          colorFill:         isDark ? "#131e30" : "#f5f5f5",
          colorFillSecondary: isDark ? "#0f1724" : "#f0f0f0",
          colorFillTertiary:  isDark ? "#0a1020" : "#e8e8e8",
          colorSplit:        isDark ? "#1e2d42" : "#f0f0f0",
        },
      }}
    >
      <NotificationProvider>
        <SearchProvider>
          <Layout className="min-h-screen">
            <Header
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: isDark ? "#060a12" : "#fff",
                borderBottom: isDark ? "1px solid #1e2d42" : "1px solid #f0f0f0",
              }}
            >
              <HeaderIcon collapsed={collapsed} setCollapsed={setCollapsed} />
            </Header>
            <Content
              style={{
                padding: "50px",
                background: isDark ? "#080c14" : undefined,
              }}
            >
              <div
                className="site-layout-content sm:min-h-[600px] max-sm:min-h-screen"
                style={{ background: isDark ? "#080c14" : colorBgContainer }}
              >
                <Router />
              </div>
            </Content>
            {location.pathname !== "/" && (
              <Footer
                style={{
                  textAlign: "center",
                  backgroundColor: isDark ? "#060a12" : "#fff",
                  borderTop: isDark ? "1px solid #1e2d42" : "1px solid #f0f0f0",
                }}
              >
                <BottomIcon collapsed={collapsed} setCollapsed={setCollapsed} />
              </Footer>
            )}
            <FileManagementIframe iframe={iframe} setIframe={setIframe} />
          </Layout>
        </SearchProvider>
      </NotificationProvider>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

export default App;
