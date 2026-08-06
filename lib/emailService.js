import nodemailer from 'nodemailer';

// Lazy-initialize transporter to avoid build-time crashes
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password',
    },
  });
}

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
      <p><a href="${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}">View Order</a></p>
      <p>Thank you for shopping with ShopSense!</p>
    `;

    await getTransporter().sendMail({
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
      <p>Great news! Your order has been shipped.</p>
      <h3>Order ID: ${order.id}</h3>
      <p><a href="${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}">Track Order</a></p>
      <p>Expected delivery: 3-5 business days</p>
    `;

    await getTransporter().sendMail({
      from: process.env.EMAIL_USER || 'noreply@shopsense.com',
      to: user.email,
      subject: `Order Shipped - Order #${order.id.substring(0, 8)}`,
      html: htmlContent,
    });

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
      <p><a href="${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}">Review Order</a></p>
      <p>Thank you for shopping with ShopSense!</p>
    `;

    await getTransporter().sendMail({
      from: process.env.EMAIL_USER || 'noreply@shopsense.com',
      to: user.email,
      subject: `Order Delivered - Order #${order.id.substring(0, 8)}`,
      html: htmlContent,
    });

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
      <p>A product you're interested in has dropped in price!</p>
      <h3>${product.name}</h3>
      <p><strong>Old Price:</strong> <strike>$${oldPrice.toFixed(2)}</strike></p>
      <p><strong>New Price:</strong> $${newPrice.toFixed(2)}</p>
      <p><strong>You Save:</strong> ${savings}%</p>
      <p><a href="${process.env.NEXT_PUBLIC_API_URL}/shopping">Shop Now</a></p>
    `;

    await getTransporter().sendMail({
      from: process.env.EMAIL_USER || 'noreply@shopsense.com',
      to: user.email,
      subject: `Price Drop Alert - ${product.name}`,
      html: htmlContent,
    });

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
      <p>${product.name} is back in stock!</p>
      <p><strong>Price:</strong> $${product.currentPrice.toFixed(2)}</p>
      <p><a href="${process.env.NEXT_PUBLIC_API_URL}/shopping">Buy Now</a></p>
    `;

    await getTransporter().sendMail({
      from: process.env.EMAIL_USER || 'noreply@shopsense.com',
      to: user.email,
      subject: `Back in Stock - ${product.name}`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Error sending back in stock email:', error);
    return false;
  }
}

export async function testEmailConnection() {
  try {
    await getTransporter().verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}
