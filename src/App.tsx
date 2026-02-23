import React from "react";
import "./App.css";
import { Layout, theme, Popover, Button } from "antd";
import Router from "./routes";
import { useState } from "react";
import HeaderIcon from "./components/HeaderIcon";
import BottomIcon from "./components/BottomIcon";
import { useLocation } from "react-router-dom";
import { notification } from "antd";
import FileManagementIframe from "./components/FileManagmentIframe";
import { NotificationProvider } from "./context/NotificationContext";
import { SearchProvider } from "./context/SearchContext";

const { Header, Footer, Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [iframe, setIframe] = useState(false);
  
  const location = useLocation();

  const {
    token: { colorBgContainer },
  } = theme.useToken();
  return (
    <NotificationProvider>
      <SearchProvider>
      <Layout className="min-h-screen">
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <HeaderIcon collapsed={collapsed} setCollapsed={setCollapsed} />
        </Header>
        <Content style={{ padding: "50px" }}>
          {/* Top Navigation Links */}
          <div
            className="site-layout-content sm:min-h-[600px] max-sm:min-h-screen"
            style={{ background: colorBgContainer }}
          >
            <Router />
          </div>
        </Content>
        {location.pathname !== "/" && (
          <Footer style={{ textAlign: "center", backgroundColor: "#fff" }}>
            <BottomIcon collapsed={collapsed} setCollapsed={setCollapsed} />
          </Footer>
        )}

        {/* File Management Iframe - globally available */}
        <FileManagementIframe iframe={iframe} setIframe={setIframe} />

        {/* Floating Help Button */}
      </Layout>
      </SearchProvider>
    </NotificationProvider>
  );
}

export default App;
