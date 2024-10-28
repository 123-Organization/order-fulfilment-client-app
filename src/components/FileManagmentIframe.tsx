import React, { useState } from 'react';
import { Modal, Button } from 'antd';

export default function FileManagementIframe({iframe, setIframe}) {
  



  return (
    <div>
      <Modal
        title="File Management"
        visible={iframe === true}
        onOk={() => setIframe(false)}
        onCancel={() => setIframe(false)}
        width="80%"
        footer={null} // Remove footer if you don't want any buttons in the modal footer
      >
        <iframe
          src="http://localhost.finerworks.com:3000/#/thumbnail" 
          width="100%"
          height="550px"
          style={{ border: 'none' }}
          title="File Management"
        />
      </Modal>
    </div>
  );
}
