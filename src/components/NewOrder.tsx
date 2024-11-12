import React, { useState } from "react";
import { Modal, Button } from "antd";

export default function NewOrder({ iframe, setIframe }) {
  return (
    <div>
      <Modal
        title="File Management"
        visible={iframe === true}
        onOk={() => setIframe(false)}
        onCancel={() => setIframe(false)}
        width="80%"
        footer={null}
      >
        <iframe
          src="https://finerworks.com/apps/orderform/post3.aspx"
          width="100%"
          height="550px"
          style={{ border: "none" }}
          title="File Management"
        />
      </Modal>
    </div>
  );
}
