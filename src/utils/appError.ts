class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number, options?: ErrorOptions) {
    super(message, options);
    this.statusCode = statusCode;
  }
}

class NotFoundError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 404, options);
  }
}

class BadRequestError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 400, options);
  }
}

export { AppError, BadRequestError, NotFoundError };
