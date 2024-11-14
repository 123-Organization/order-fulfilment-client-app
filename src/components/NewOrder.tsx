import React, { useState, useEffect } from "react";
import { Modal, Button } from "antd";

export default function NewOrder({ iframe, setIframe }) {
  const [addedProducts, setAddedProducts] = useState([]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      console.log("Message event:", event);

      // Check if the message is coming from the expected origin (you can replace '*' with a specific domain for security)
      if (event.origin !== "https://finerworks.com") return;

      // Parse the data (since it seems like a stringified JSON array)
      try {
        const data = JSON.parse(event.data);  // Parse the stringified JSON

        if (Array.isArray(data)) {
          // Assuming the structure is an array of products, update the state
          setAddedProducts(data);

          // Close the iframe
          setIframe(false);
        }
      } catch (error) {
        console.error("Error parsing message data:", error);
      }
    };

    // Attach the event listener
    window.addEventListener("message", handleMessage);

    // Clean up the event listener when the component is unmounted
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

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
          sandbox="allow-scripts allow-forms allow-same-origin"
        />
      </Modal>

    </div>
  );
}
