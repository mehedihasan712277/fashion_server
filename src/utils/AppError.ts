export default class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    errors?: { path: string; message: string }[] | undefined; // ✅ explicit undefined

    constructor(message: string, statusCode: number, errors?: { path: string; message: string }[]) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errors = errors ?? undefined; // ✅ safe assignment

        Error.captureStackTrace(this, this.constructor);
    }
}
