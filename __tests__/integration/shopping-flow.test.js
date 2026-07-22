import { GET as getProducts } from '@/app/api/products/route';
import { GET as getCart, POST as addToCart } from '@/app/api/cart/route';
import { jwtVerify } from 'jose';

jest.mock('jose');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    cart: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    cartItem: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  })),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Shopping Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Browse Products and Add to Cart', () => {
    it('should complete full shopping flow: browse -> select -> add to cart', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Laptop',
          currentPrice: 999.99,
          basePrice: 1000,
          imageUrl: 'laptop.jpg',
          category: 'Electronics',
          stock: 10,
          rating: 4.5,
          reviewCount: 100,
        },
        {
          id: 'prod-2',
          name: 'Mouse',
          currentPrice: 29.99,
          basePrice: 30,
          imageUrl: 'mouse.jpg',
          category: 'Electronics',
          stock: 50,
          rating: 4.2,
          reviewCount: 200,
        },
      ];

      // Step 1: User browses products
      prisma.product.findMany.mockResolvedValueOnce(mockProducts);
      prisma.product.count.mockResolvedValueOnce(2);

      const browseRequest = {
        nextUrl: new URL('http://localhost:3000/api/products?category=Electronics'),
      };

      const browseResponse = await getProducts(browseRequest);
      expect(browseResponse.status).toBe(200);

      // Step 2: User adds product to cart
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.cart.findUnique.mockResolvedValueOnce(null); // No existing cart
      prisma.cart.create.mockResolvedValueOnce({
        id: 'cart-1',
        userId: 'user-123',
      });

      prisma.cartItem.create.mockResolvedValueOnce({
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-1',
        quantity: 1,
        price: 999.99,
      });

      const addToCartRequest = {
        headers: new Map([['authorization', 'Bearer token']]),
        cookies: new Map([['auth-token', 'token']]),
        json: jest.fn().mockResolvedValueOnce({
          productId: 'prod-1',
          quantity: 1,
        }),
      };

      const addResponse = await addToCart(addToCartRequest);
      expect(addResponse.status).toBe(200);

      // Step 3: User views cart
      prisma.cart.findUnique.mockResolvedValueOnce({
        id: 'cart-1',
        userId: 'user-123',
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'prod-1',
            quantity: 1,
            price: 999.99,
            product: mockProducts[0],
          },
        ],
      });

      const cartRequest = {
        headers: new Map([['authorization', 'Bearer token']]),
        cookies: new Map([['auth-token', 'token']]),
      };

      const cartResponse = await getCart(cartRequest);
      expect(cartResponse.status).toBe(200);
    });

    it('should handle adding multiple products to cart', async () => {
      jwtVerify.mockResolvedValue({
        payload: { userId: 'user-123' },
      });

      const products = [
        { id: 'prod-1', name: 'Laptop', price: 999.99 },
        { id: 'prod-2', name: 'Mouse', price: 29.99 },
        { id: 'prod-3', name: 'Keyboard', price: 79.99 },
      ];

      prisma.cart.findUnique.mockResolvedValueOnce(null);
      prisma.cart.create.mockResolvedValueOnce({ id: 'cart-1', userId: 'user-123' });

      // Add first product
      prisma.cartItem.create.mockResolvedValueOnce({
        id: 'item-1',
        productId: 'prod-1',
        quantity: 1,
        price: 999.99,
      });

      const request1 = {
        headers: new Map([['authorization', 'Bearer token']]),
        cookies: new Map([['auth-token', 'token']]),
        json: jest.fn().mockResolvedValueOnce({
          productId: 'prod-1',
          quantity: 1,
        }),
      };

      const response1 = await addToCart(request1);
      expect(response1.status).toBe(200);

      // Add second product
      prisma.cartItem.create.mockResolvedValueOnce({
        id: 'item-2',
        productId: 'prod-2',
        quantity: 2,
        price: 29.99,
      });

      const request2 = {
        headers: new Map([['authorization', 'Bearer token']]),
        cookies: new Map([['auth-token', 'token']]),
        json: jest.fn().mockResolvedValueOnce({
          productId: 'prod-2',
          quantity: 2,
        }),
      };

      const response2 = await addToCart(request2);
      expect(response2.status).toBe(200);

      // Add third product
      prisma.cartItem.create.mockResolvedValueOnce({
        id: 'item-3',
        productId: 'prod-3',
        quantity: 1,
        price: 79.99,
      });

      const request3 = {
        headers: new Map([['authorization', 'Bearer token']]),
        cookies: new Map([['auth-token', 'token']]),
        json: jest.fn().mockResolvedValueOnce({
          productId: 'prod-3',
          quantity: 1,
        }),
      };

      const response3 = await addToCart(request3);
      expect(response3.status).toBe(200);
    });

    it('should prevent adding out-of-stock products', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'prod-1',
        stock: 0, // Out of stock
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        cookies: new Map([['auth-token', 'token']]),
        json: jest.fn().mockResolvedValueOnce({
          productId: 'prod-1',
          quantity: 1,
        }),
      };

      const response = await addToCart(request);
      expect(response.status).toBe(400);
    });

    it('should prevent adding quantity exceeding stock', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'prod-1',
        stock: 5,
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        cookies: new Map([['auth-token', 'token']]),
        json: jest.fn().mockResolvedValueOnce({
          productId: 'prod-1',
          quantity: 10, // Exceeds stock
        }),
      };

      const response = await addToCart(request);
      expect(response.status).toBe(400);
    });

    it('should filter products by category', async () => {
      const electronicsProducts = [
        { id: 'prod-1', name: 'Laptop', category: 'Electronics' },
        { id: 'prod-2', name: 'Mouse', category: 'Electronics' },
      ];

      prisma.product.findMany.mockResolvedValueOnce(electronicsProducts);
      prisma.product.count.mockResolvedValueOnce(2);

      const request = {
        nextUrl: new URL('http://localhost:3000/api/products?category=Electronics'),
      };

      const response = await getProducts(request);
      expect(response.status).toBe(200);
    });

    it('should search products by name', async () => {
      const searchResults = [
        { id: 'prod-1', name: 'Laptop Pro', category: 'Electronics' },
      ];

      prisma.product.findMany.mockResolvedValueOnce(searchResults);
      prisma.product.count.mockResolvedValueOnce(1);

      const request = {
        nextUrl: new URL('http://localhost:3000/api/products?search=Laptop'),
      };

      const response = await getProducts(request);
      expect(response.status).toBe(200);
    });
  });
});
