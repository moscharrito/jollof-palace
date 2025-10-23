import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, errorHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validation';
import Joi from 'joi';

describe('Middleware', () => {
  describe('Error Handler', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        url: '/test',
        method: 'GET',
        body: {},
        params: {},
        query: {},
        headers: {},
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      mockNext = jest.fn();
    });

    it('should handle ValidationError', () => {
      const error = new ValidationError('Validation failed', [
        { field: 'name', message: 'Name is required' }
      ]);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ field: 'name', message: 'Name is required' }],
          timestamp: expect.any(String),
          requestId: expect.any(String),
        },
      });
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('Resource not found');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        },
      });
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        },
      });
    });
  });

  describe('Validation Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        body: {},
      };
      mockRes = {};
      mockNext = jest.fn();
    });

    it('should validate valid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
      });

      mockReq.body = { name: 'John', age: 25 };

      const middleware = validateBody(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body).toEqual({ name: 'John', age: 25 });
    });

    it('should throw ValidationError for invalid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
      });

      mockReq.body = { name: 'John' }; // Missing age

      const middleware = validateBody(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(ValidationError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should strip unknown fields', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      mockReq.body = { name: 'John', unknownField: 'value' };

      const middleware = validateBody(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body).toEqual({ name: 'John' });
    });
  });
});