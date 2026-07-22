// Error handling middleware for Next.js
// Place this in: app/api/error-handler.js

export function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      
      // Return 200 with error message instead of 500
      return res.status(200).json({
        error: error.message || 'An error occurred',
        success: false,
        data: null
      });
    }
  };
}

export function handleError(error, req, res) {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req?.url,
    method: req?.method
  });

  // Always return 200 with error field
  return res.status(200).json({
    error: error.message || 'Internal server error',
    success: false,
    data: null
  });
}

export default withErrorHandler;
