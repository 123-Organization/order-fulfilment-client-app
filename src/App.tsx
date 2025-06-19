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

const { Header, Footer, Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  
  const location = useLocation();
  console.log(location.pathname);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const helpContent = (
    <div className="flex flex-col gap-3 min-w-[200px]">
      <a 
        href="https://support.finerworks.com/how-to-use-the-order-fulfillment-app/" 
        className="px-4 py-2 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium flex items-center"
        onClick={() => setHelpVisible(false)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Documentation
      </a>
      <a 
        href="https://finerworks.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="px-4 py-2 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium flex items-center"
        onClick={() => setHelpVisible(false)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Finerworks
      </a>
    </div>
  );

  return (
    <NotificationProvider>
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

        {/* Floating Help Button */}
        <Popover 
          content={helpContent}
          trigger="click"
          placement="leftTop"
          open={helpVisible}
          onOpenChange={setHelpVisible}
          overlayClassName="help-popover"
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            className="fixed bottom-16 right-14 shadow-lg flex items-center justify-center bg-blue-600 hover:bg-blue-700"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </Popover>
      </Layout>
    </NotificationProvider>
  );
}

export default App;
