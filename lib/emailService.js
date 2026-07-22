import nodemailer from 'nodemailer';

// Create transporter (using Gmail or your email service)
// For production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

// Alternative: Use SMTP configuration
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: true,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });

export async function sendOrderConfirmationEmail(user, order) {
  try {
    const itemsList = order.items
      .map(item => `<li>${item.productName} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`)
      .join('');

    const htmlContent = `
      <h2>Order Confirmation</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for your order! Here are your order details:</p>
      
      <h3>Order ID: ${order.id}</h3>
      <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
      <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
      
      <h3>Items:</h3>
      <ul>${itemsList}</ul>
      
      <p>Your order is being processed and will be shipped soon.</p>
      <p>You can track your order status at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}">View Order</a></p>
      
      <p>Thank you for shopping with ShopSense!</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@shopsense.com',
      to: user.email,
      subject: `Order Confirmation - Order #${order.id.substring(0, 8)}`,
      html: htmlContent,
    });

    console.log(`Order confirmation email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
}

export async function sendOrderShippedEmail(user, order) {
  try {
    const htmlContent = `
      <h2>Your Order Has Been Shipped!</h2>
      <p>Hi ${user.name},</p>
      <p>Great news! Your order has been shipped and is on its way to you.</p>
      
      <h3>Order ID: ${order.id}</h3>
      <p><strong>Tracking:</strong> You can track your shipment at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}">View Order</a></p>
      
      <p>Expected delivery: 3-5 business days</p>
      
      <p>Thank you for your patience!</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@shopsense.com',
      to: user.email,
      subject: `Order Shipped - Order #${order.id.substring(0, 8)}`,
      html: htmlContent,
    });

    console.log(`Order shipped email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending order shipped email:', error);
    return false;
  }
}

export async function sendOrderDeliveredEmail(user, order) {
  try {
    const htmlContent = `
      <h2>Your Order Has Been Delivered!</h2>
      <p>Hi ${user.name},</p>
      <p>Your order has been successfully delivered!</p>
      
      <h3>Order ID: ${order.id}</h3>
      <p><strong>Delivered on:</strong> ${new Date().toLocaleDateString()}</p>
      
      <p>We hope you enjoy your purchase. If you have any questions or concerns, please don't hesitate to contact us.</p>
      
      <p>Would you like to leave a review? <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}">Review Order</a></p>
      
      <p>Thank you for shopping with ShopSense!</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@shopsense.com',
      to: user.email,
      subject: `Order Delivered - Order #${order.id.substring(0, 8)}`,
      html: htmlContent,
    });

    console.log(`Order delivered email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending order delivered email:', error);
    return false;
  }
}

export async function sendPriceDropEmail(user, product, oldPrice, newPrice) {
  try {
    const savings = ((oldPrice - newPrice) / oldPrice * 100).toFixed(1);

    const htmlContent = `
      <h2>Price Drop Alert!</h2>
      <p>Hi ${user.name},</p>
      <p>Good news! A product you're interested in has dropped in price!</p>
      
      <h3>${product.name}</h3>
      <p><strong>Old Price:</strong> <strike>$${oldPrice.toFixed(2)}</strike></p>
      <p><strong>New Price:</strong> $${newPrice.toFixed(2)}</p>
      <p><strong>You Save:</strong> ${savings}%</p>
      
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/shopping">Shop Now</a></p>
      
      <p>This is a limited time offer!</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@shopsense.com',
      to: user.email,
      subject: `Price Drop Alert - ${product.name}`,
      html: htmlContent,
    });

    console.log(`Price drop email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending price drop email:', error);
    return false;
  }
}

export async function sendBackInStockEmail(user, product) {
  try {
    const htmlContent = `
      <h2>Back in Stock!</h2>
      <p>Hi ${user.name},</p>
      <p>Great news! A product you were interested in is back in stock!</p>
      
      <h3>${product.name}</h3>
      <p><strong>Price:</strong> $${product.currentPrice.toFixed(2)}</p>
      
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/shopping">Buy Now</a></p>
      
      <p>Limited stock available!</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@shopsense.com',
      to: user.email,
      subject: `Back in Stock - ${product.name}`,
      html: htmlContent,
    });

    console.log(`Back in stock email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending back in stock email:', error);
    return false;
  }
}

export async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log('Email service is ready to send emails');
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}
