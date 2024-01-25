import React from 'react';
import './App.css';
import { Layout, theme } from 'antd';
import Router from "./routes";

import HeaderIcon from './components/HeaderIcon';
import BottomIcon from './components/BottomIcon';

const { Header, Footer, Content } = Layout;

function App() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  
  return (
    <Layout className="layout">
      <Header style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', }}>
        <HeaderIcon />
      </Header>
      <Content style={{ padding: '50px' }}>
        <div className="site-layout-content" style={{ background: colorBgContainer, minHeight: '600px' }}>
          <Router />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', backgroundColor: '#fff', }}>
        {/* <BottomIcon /> */}
     </Footer>
    </Layout>
  );
}

export default App;
