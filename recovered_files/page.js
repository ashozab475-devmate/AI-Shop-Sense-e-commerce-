// pages/about.js (or app/about/page.js in Next.js 13+ app directory)
'use client';


export default function About() {
  return (
    <>
      <Head>
        <title>About ShopSense</title>
        <meta name="description" content="Learn more about ShopSense, the smart e-commerce platform." />
      </Head>
      
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            About ShopSense
          </h1>
          <p className="text-lg text-center text-gray-600 mb-12">
            Discover how ShopSense revolutionizes e-commerce with smart, AI-driven solutions.
          </p>
          
          {/* Cards Container */}
          <div className="flex flex-wrap justify-center items-center gap-8">
            {/* Card 1: What is ShopSense */}
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">What is ShopSense?</h2>
              <p className="text-gray-600">
                ShopSense is a cutting-edge e-commerce platform that leverages AI and machine learning to provide personalized shopping experiences. It connects buyers and sellers seamlessly, offering smart recommendations, predictive analytics, and intuitive tools for modern commerce.
              </p>
            </div>
            
            {/* Card 2: Key Features */}
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Key Features</h2>
              <ul className="text-gray-600 list-disc list-inside">
                <li>AI-powered product recommendations</li>
                <li>Real-time inventory management</li>
                <li>Secure payment gateways</li>
                <li>Advanced analytics dashboard</li>
                <li>Mobile-optimized shopping experience</li>
              </ul>
            </div>
            
            {/* Card 3: Our Mission */}
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
              <p className="text-gray-600">
                At ShopSense, our mission is to empower businesses and consumers alike by making e-commerce smarter, faster, and more accessible. We strive to innovate continuously, ensuring every interaction is personalized and efficient.
              </p>
            </div>
            
            {/* Card 4: Why Choose Us */}
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Why Choose ShopSense?</h2>
              <p className="text-gray-600">
                With a focus on user-centric design and data-driven insights, ShopSense stands out for its reliability, scalability, and commitment to privacy. Join thousands of users who trust us for their e-commerce needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
