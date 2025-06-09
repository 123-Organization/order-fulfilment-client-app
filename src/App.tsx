import React from "react";
import "./App.css";
import { Layout, theme } from "antd";
import Router from "./routes";
import { useState } from "react";
import HeaderIcon from "./components/HeaderIcon";
import BottomIcon from "./components/BottomIcon";
import { useLocation } from "react-router-dom";
import { notification } from "antd";
import FileManagementIframe from "./components/FileManagmentIframe";
import { NotificationProvider } from "./context/NotificationContext";

const { Header, Footer, Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  
  const location = useLocation();
  console.log(location.pathname);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    
    <Layout className="layout ">
     
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <HeaderIcon collapsed={collapsed} setCollapsed={setCollapsed} />
      </Header>
      <Content className=" " style={{ padding: "50px" }}>
        <div
          className="site-layout-content sm:min-h-[600px] max-sm:min-h-screen"
          style={{ background: colorBgContainer }}
        >
          <NotificationProvider>
          <Router />
          </NotificationProvider>
        </div>
        
      </Content>
      {location.pathname !== "/" && (
        <Footer style={{ textAlign: "center", backgroundColor: "#fff" }}>
          <BottomIcon collapsed={collapsed} setCollapsed={setCollapsed} />
        </Footer>
      )}
    </Layout>
  );
}

export default App;
