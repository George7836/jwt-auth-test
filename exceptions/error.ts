export default class ApiError extends Error {
  status: number;
  errors: unknown[];

  constructor(status: number, message: string, errors: unknown[] = []) {
    super("");
    this.message = message;
    this.errors = errors;
    this.status = status;
  }

  static UnauthorizedError() {
    return new ApiError(401, "User is not logged in");
  }

  static BadRequest(message: string, errors: unknown[] = []) {
    return new ApiError(400, message, errors);
  }
}
