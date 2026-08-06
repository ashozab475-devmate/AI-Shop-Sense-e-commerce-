/**
 * Product Controller
 * Handles product-related request/response logic
 */

import { ProductModel } from '../models/Product';

export class ProductController {
  /**
   * GET /api/products  — list with filters
   */
  static async index(searchParams) {
    try {
      const page     = parseInt(searchParams.get?.('page')     || searchParams.page     || 1);
      const limit    = parseInt(searchParams.get?.('limit')    || searchParams.limit    || 20);
      const category =           searchParams.get?.('category') || searchParams.category || null;
      const search   =           searchParams.get?.('search')   || searchParams.search   || null;
      const minPrice = searchParams.get?.('minPrice') ? parseFloat(searchParams.get('minPrice')) : null;
      const maxPrice = searchParams.get?.('maxPrice') ? parseFloat(searchParams.get('maxPrice')) : null;
      const sortBy   =           searchParams.get?.('sortBy')   || searchParams.sortBy   || 'createdAt';
      const sortOrder=           searchParams.get?.('sortOrder')|| searchParams.sortOrder|| 'desc';

      const result = await ProductModel.findAll({
        page, limit, category, search, minPrice, maxPrice, sortBy, sortOrder,
      });

      return { success: true, ...result, status: 200 };
    } catch (error) {
      console.error('ProductController.index error:', error);
      return { success: false, error: 'Failed to fetch products', status: 500 };
    }
  }

  /**
   * GET /api/products/:id  — single product
   */
  static async show(id) {
    try {
      if (!id) return { success: false, error: 'Product ID required', status: 400 };

      const product = await ProductModel.findById(id, {
        reviews: true,
        demandMetrics: true,
      });

      if (!product) return { success: false, error: 'Product not found', status: 404 };

      return { success: true, product, status: 200 };
    } catch (error) {
      console.error('ProductController.show error:', error);
      return { success: false, error: 'Failed to fetch product', status: 500 };
    }
  }

  /**
   * POST /api/products  — create
   */
  static async create(data) {
    try {
      const required = ['name', 'category', 'basePrice'];
      for (const field of required) {
        if (!data[field]) {
          return { success: false, error: `${field} is required`, status: 400 };
        }
      }

      const product = await ProductModel.create(data);
      return { success: true, product, status: 201 };
    } catch (error) {
      console.error('ProductController.create error:', error);
      return { success: false, error: 'Failed to create product', status: 500 };
    }
  }

  /**
   * PUT /api/products/:id  — update
   */
  static async update(id, data) {
    try {
      if (!id) return { success: false, error: 'Product ID required', status: 400 };

      const existing = await ProductModel.findById(id);
      if (!existing) return { success: false, error: 'Product not found', status: 404 };

      const product = await ProductModel.update(id, data);
      return { success: true, product, status: 200 };
    } catch (error) {
      console.error('ProductController.update error:', error);
      return { success: false, error: 'Failed to update product', status: 500 };
    }
  }

  /**
   * DELETE /api/products/:id  — delete
   */
  static async destroy(id) {
    try {
      if (!id) return { success: false, error: 'Product ID required', status: 400 };

      const existing = await ProductModel.findById(id);
      if (!existing) return { success: false, error: 'Product not found', status: 404 };

      await ProductModel.delete(id);
      return { success: true, message: 'Product deleted', status: 200 };
    } catch (error) {
      console.error('ProductController.destroy error:', error);
      return { success: false, error: 'Failed to delete product', status: 500 };
    }
  }

  /**
   * GET /api/products/featured
   */
  static async featured(limit = 10) {
    try {
      const products = await ProductModel.findFeatured(limit);
      return { success: true, products, status: 200 };
    } catch (error) {
      console.error('ProductController.featured error:', error);
      return { success: false, error: 'Failed to fetch featured products', status: 500 };
    }
  }
}
