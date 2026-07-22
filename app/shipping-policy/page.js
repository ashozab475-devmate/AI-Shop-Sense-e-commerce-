export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Shipping Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Shipping Methods</h2>
            <p>We offer the following shipping options:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Standard Shipping:</strong> 5-7 business days - FREE on orders over $50</li>
              <li><strong>Express Shipping:</strong> 2-3 business days - $9.99</li>
              <li><strong>Overnight Shipping:</strong> Next business day - $24.99</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Processing Time</h2>
            <p>Orders are processed Monday through Friday, excluding holidays. Orders placed on weekends or holidays will be processed the next business day. Processing typically takes 1-2 business days.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Shipping Costs</h2>
            <p>Shipping costs are calculated based on:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Order weight and dimensions</li>
              <li>Destination address</li>
              <li>Selected shipping method</li>
              <li>Current carrier rates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Free Shipping</h2>
            <p>Free standard shipping is available on orders totaling $50 or more (before tax). Free shipping does not apply to express or overnight shipping options.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. International Shipping</h2>
            <p>We currently ship to select countries. International orders may be subject to customs duties and taxes. Customers are responsible for any applicable customs fees.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Order Tracking</h2>
            <p>Once your order ships, you will receive a tracking number via email. You can track your shipment in real-time through our Shipping Tracker or the carrier's website.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Delivery Confirmation</h2>
            <p>All shipments require a signature upon delivery unless otherwise specified. If you're not available, the carrier will leave a notice and attempt redelivery.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Lost or Damaged Shipments</h2>
            <p>If your package arrives damaged or is lost in transit, please contact us immediately with photos and tracking information. We will work with the carrier to resolve the issue or send a replacement.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Shipping Address</h2>
            <p>Please ensure your shipping address is correct before completing your order. We cannot be responsible for packages shipped to incorrect addresses provided by the customer.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
            <p>For shipping inquiries, please contact us at shipping@shopsense.com or call +1 (555) 123-4567</p>
          </section>
        </div>
        <p className="text-gray-500 text-sm mt-8">Last updated: April 2026</p>
      </div>
    </div>
  );
}
