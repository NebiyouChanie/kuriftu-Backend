class customError extends Error {
    constructor( message, statusCode ){
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
        this.isOperational = true; //if it is oprational error 
        Error.captureStackTrace( this, this.constructor )
    }
}

module.exports = customError