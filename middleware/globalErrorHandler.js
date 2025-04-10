const customError = require('../utils/CustomErrorhandlerClass')

// devlopment errors (errors that will be send to the developer)
const devErrors = (res,error) => {
    res.status(error.statusCode).json({
        status : error.status,
        message : error.message,
        stackTrace : error.stack,
        error : error
    });
}

// erros that will be send to the end user(with out reavealing too much about the error)
const prodErrors = (res,error) => {
    
    // we only want to send operational errors to the user not development user
    // errors from mongodb are not operational errors e.g validation error but we need to mark this errors and not a generic response
    if(error.isOperational){ // is operational will only be availabel error from our customeerror class. monog wont have htis custome error class
        res.status(error.statusCode).json({
            status : error.status,
            message : error.message,
        });
    }else {
        res.status(500).json({ // e.g mongodb errors
            status : "error",
            message : "Something went wrong! Please try agian later."
        });
    }
    }


// cast error
const castErrorHandler = (error)=>{
    const messages =`Invalid ${error.path} : ${error.value}`
    return new customError(messages,400)
}

// validation error
const validationErrorHandler = (error) => {
    const messages = Object.values(error.errors).map(val => val.message).join(', ');
    return new customError(messages, 400);
}

// duplicate error
const duplicateErrorHandler = (error) => {
    const field = Object.keys(error.keyValue)[0];
    const messages = `The ${field} '${error.keyValue[field]}' is already taken.`;
    return new customError(messages, 400);
};

//Jwt expired error
const expiredJWTHandler= (error) =>{
     return new customError( "JWT has expired. please login again", 401)
} 

// invalid token/seginture
const JWTErrorHandler= (error) =>{
     return new customError( "Invalid token.", 401)
}  


module.exports = (error,req,res,next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        devErrors(res,error);
    }else if (process.env.NODE_ENV === 'production'){
        if (error.name === 'CastError') error = castErrorHandler(error)
        if (error.name === 'ValidationError') error = validationErrorHandler(error)
        if (error.code === 11000) error = error = duplicateErrorHandler(error)
        if (error.name === 'TokenExpiredError') error = error = expiredJWTHandler(error)
        if (error.name === 'JsonWebTokenError') error = error = JWTErrorHandler(error)
        
        prodErrors(res,error);
    }
}
 