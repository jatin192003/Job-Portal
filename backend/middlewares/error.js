class ErrorHandler extends Error{
    constructor(message, statuscode){
        super(message);
        this.statuscode = statuscode
    }
}

export const errorMiddleware = (err, req, res, next) =>{
    err.statuscode = err.statuscode || 500;
    err.message = err.message || "Internal Server Error"

    if (err.message === "CastError"){
        const message = `Invalid ${err.path}`
        err = new ErrorHandler(message, 400)
    }

    if(err.code === 11000){
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`
        err = new ErrorHandler(message, 400)
    }

    if(err.code === "JsonWebTokenError"){
        const message = `Json Web Token is invalid, Try again`
        err = new ErrorHandler(message, 400)
    }

    if(err.code === "TokenExpiredError"){
        const message = `Json Web token is expired, try again`
        err = new ErrorHandler(message, 400)
    }

    return res.status(err.statuscode).json({
        success: false,
        message: err.message,
    })


}

export default ErrorHandler;