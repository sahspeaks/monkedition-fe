import React, { useState } from "react";
import { Title } from "./Title";

const PolicyLayout = ({ children }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">{children}</div>
    </div>
  );
};

const AccordionSection = ({ title, isOpen, onClick, children }) => (
  <div className="border-b">
    <button
      className="w-full py-4 flex justify-between items-center text-left font-semibold"
      onClick={onClick}
    >
      {title}
      <span className="transform transition-transform duration-200">
        {isOpen ? "−" : "+"}
      </span>
    </button>
    <div
      className={`overflow-hidden transition-all duration-200 ${
        isOpen ? "max-h-[1000px] pb-6" : "max-h-0"
      }`}
    >
      {children}
    </div>
  </div>
);

const ReturnPolicy = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <PolicyLayout>
      <div className="mb-8">
        <div className="text-2xl">
          <Title text1={"Return"} text2={" Policy"} />
        </div>
        <p className="text-gray-600 mb-6">
          At MONKEDITION, we are committed to providing you with high-quality
          streetwear clothing. We understand that occasionally, you may need to
          return an item or seek a refund.
        </p>
      </div>

      <AccordionSection
        title="Manufacturing Defects Returns"
        isOpen={openSection === "defects"}
        onClick={() => toggleSection("defects")}
      >
        <div className="space-y-3 text-gray-600">
          <p>
            We accept returns for manufacturing defects within 7 days of
            delivery date.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Defects include holes, tears, or any product damage</li>
            <li>
              Return pickup will be arranged within 24-48 hours after approval
            </li>
            <li>Maximum of 2 pickup attempts will be made</li>
            <li>Products must be returned in original condition</li>
            <li>Quality check will be performed at our warehouse</li>
          </ul>
          <p className="text-sm italic mt-2">
            Note: Reverse pickup availability depends on your area's pincode
          </p>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Size & Fit Policy"
        isOpen={openSection === "size"}
        onClick={() => toggleSection("size")}
      >
        <div className="space-y-3 text-gray-600">
          <p>
            Please note that we do not accept returns or exchanges for size
            issues.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Detailed size charts are provided for all products</li>
            <li>Customers are advised to measure carefully before ordering</li>
            <li>Compare your measurements with our size chart</li>
          </ul>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Refund Process"
        isOpen={openSection === "refund"}
        onClick={() => toggleSection("refund")}
      >
        <div className="space-y-3 text-gray-600">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Refunds are processed within 14 business days after approval
            </li>
            <li>Prepaid orders: Refund to original payment method</li>
            <li>COD orders: Refund to provided bank details</li>
            <li>Refund initiation after successful quality check</li>
          </ul>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Order Cancellation"
        isOpen={openSection === "cancellation"}
        onClick={() => toggleSection("cancellation")}
      >
        <div className="space-y-3 text-gray-600">
          <ul className="list-disc pl-6 space-y-2">
            <li>Only available for COD orders before dispatch</li>
            <li>Prepaid orders are final and non-refundable</li>
          </ul>
        </div>
      </AccordionSection>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          For assistance, email us at monkedition@gmail.com with your name
          and order ID. We're available Monday - Saturday, 11:00 AM to 7:00 PM.
          All queries will be addressed within 24 hours.
        </p>
      </div>
    </PolicyLayout>
  );
};

const ShippingPolicy = () => {
  return (
    <PolicyLayout>
      <div className="mb-8">
        <div className="text-2xl">
          <Title text1={"Shipping"} text2={" Policy"} />
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-3">Shipping Rates</h3>
          <p className="text-gray-600">
            We offer free shipping across India for all prepaid orders. For COD
            (Cash on Delivery) orders, an additional fee is applicable to cover
            cash handling by the carrier partner.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Order Processing</h3>
          <p className="text-gray-600">
            We strive to fulfill orders as soon as you place them. Your order
            will typically be dispatched within 1-2 business days.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Delivery Time</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Metropolitan Cities: 3-5 working days</li>
            <li>Rest of India: 3-7 working days</li>
          </ul>
          <p className="mt-3 text-gray-600">
            Note: Delivery times are estimates and may vary based on your
            location and other factors , We will inform you once your order is
            placed.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Order Tracking</h3>
          <p className="text-gray-600">
            Track your package easily with a unique tracking link that will be
            sent to you via email and SMS once your order is dispatched to our
            delivery partner.
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 italic mt-6">
            * Delivery timelines may be affected during peak seasons, sales, or
            unforeseen circumstances. We appreciate your understanding.
          </p>
        </div>
      </div>
    </PolicyLayout>
  );
};

export default ShippingPolicy;

const PrivacyPolicy = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <PolicyLayout>
      <div className="mb-8">
        <div className="text-2xl">
          <Title text1={"Privacy"} text2={" Policy"} />
        </div>
        <p className="text-gray-600 mb-6">
          Your privacy is important to us. This policy outlines how we collect,
          use, and protect your information.
        </p>
      </div>

      <AccordionSection
        title="Collection of Information"
        isOpen={openSection === "collection"}
        onClick={() => toggleSection("collection")}
      >
        <div className="space-y-3 text-gray-600">
          <p>We collect and use information for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Only necessary information for business purposes is collected
            </li>
            <li>
              Information collected includes name, address, and contact details
            </li>
            <li>Credit card information is not stored on our servers</li>
            <li>Anonymous cookies are used to improve website functionality</li>
            <li>Information collected during account creation and orders</li>
          </ul>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Use of Information"
        isOpen={openSection === "usage"}
        onClick={() => toggleSection("usage")}
      >
        <div className="space-y-3 text-gray-600">
          <ul className="list-disc pl-6 space-y-2">
            <li>Process orders and provide customer service</li>
            <li>Respond to queries and complaints</li>
            <li>Customize offerings and analyze user trends</li>
            <li>Send important updates about products/services</li>
            <li>Comply with legal requirements</li>
          </ul>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Security Practices"
        isOpen={openSection === "security"}
        onClick={() => toggleSection("security")}
      >
        <div className="space-y-3 text-gray-600">
          <ul className="list-disc pl-6 space-y-2">
            <li>Implementation of reasonable security measures</li>
            <li>Regular updates to security practices</li>
            <li>Secure third-party agreements with security standards</li>
            <li>Encrypted data transmission</li>
            <li>Regular security audits and updates</li>
          </ul>
        </div>
      </AccordionSection>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          For questions about our privacy practices, please contact us at
          monkedition@gmail.com
        </p>
      </div>
    </PolicyLayout>
  );
};

const TermsOfService = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <PolicyLayout>
      <div className="mb-8">
        <div className="text-2xl">
          <Title text1={"Terms"} text2={" of Service"} />
        </div>

        <p className="text-gray-600 mb-6">
          By accessing and using our website, you agree to these terms and
          conditions. Please read them carefully.
        </p>
      </div>

      <AccordionSection
        title="Policy Applicability"
        isOpen={openSection === "applicability"}
        onClick={() => toggleSection("applicability")}
      >
        <div className="space-y-3 text-gray-600">
          <p>
            Welcome to MONKEDITION. By using our exchange portal or placing any
            orders, you agree to adhere to these terms without modifications.
          </p>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Prohibited Uses"
        isOpen={openSection === "prohibited"}
        onClick={() => toggleSection("prohibited")}
      >
        <div className="space-y-3 text-gray-600">
          <ul className="list-disc pl-6 space-y-2">
            <li>Posting defamatory or offensive content</li>
            <li>Violating intellectual property rights</li>
            <li>Spreading misinformation</li>
            <li>Using the service for illegal activities</li>
            <li>Attempting to compromise website security</li>
          </ul>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Limitation of Liability"
        isOpen={openSection === "liability"}
        onClick={() => toggleSection("liability")}
      >
        <div className="space-y-3 text-gray-600">
          <p>
            We are not liable for any direct, indirect, incidental, or
            consequential damages arising from your use of our service or
            products.
          </p>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Governing Law"
        isOpen={openSection === "jurisdiction"}
        onClick={() => toggleSection("jurisdiction")}
      >
        <div className="space-y-3 text-gray-600">
          <p>These terms are governed by the laws of India.</p>
        </div>
      </AccordionSection>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          For any questions about our terms of service, please contact our
          support team at monkedition@gmail.com
        </p>
      </div>
    </PolicyLayout>
  );
};

export { ReturnPolicy, ShippingPolicy, PrivacyPolicy, TermsOfService };
