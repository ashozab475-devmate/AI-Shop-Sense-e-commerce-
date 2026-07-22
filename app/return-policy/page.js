export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Return Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Return Window</h2>
            <p>We offer a 30-day return window from the date of purchase. Items must be returned within this period to be eligible for a refund or exchange.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Condition Requirements</h2>
            <p>Items must be:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Unused and in original condition</li>
              <li>In original packaging with all accessories</li>
              <li>Free from damage or wear</li>
              <li>Include all documentation and manuals</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Non-Returnable Items</h2>
            <p>The following items cannot be returned:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Clearance or final sale items</li>
              <li>Customized or personalized items</li>
              <li>Perishable items</li>
              <li>Items marked as non-returnable</li>
              <li>Digital products or software</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How to Return</h2>
            <p>To initiate a return:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Log into your account and go to Orders</li>
              <li>Select the item you wish to return</li>
              <li>Click "Return Item" and select a reason</li>
              <li>Print the prepaid shipping label</li>
              <li>Pack the item securely and ship it back</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Refund Processing</h2>
            <p>Once we receive and inspect your return:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We will verify the item condition (1-2 business days)</li>
              <li>Process your refund (3-5 business days)</li>
              <li>Refunds are issued to the original payment method</li>
              <li>Shipping costs are non-refundable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Exchanges</h2>
            <p>We offer free exchanges for defective items within 30 days. Contact us to arrange an exchange.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Defective Items</h2>
            <p>If you receive a defective item, please contact us immediately with photos and a description of the defect. We will provide a prepaid return label and send a replacement at no cost.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Partial Returns</h2>
            <p>If you ordered multiple items and only want to return some, you can return items individually. Each item will be processed separately.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Return Shipping</h2>
            <p>We provide prepaid return shipping labels for most items. Simply print the label and drop off your package at any carrier location.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
            <p>For return inquiries, please contact us at returns@shopsense.com or visit our Returns page.</p>
          </section>
        </div>
        <p className="text-gray-500 text-sm mt-8">Last updated: April 2026</p>
      </div>
    </div>
  );
}
