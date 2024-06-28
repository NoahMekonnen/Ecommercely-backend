


class ExpressError extends Error {
    constructor(message, status){
        super();
        this.message = message;
        this.status = status;
    }
}

/** 404 NOT FOUND ERROR */
class NotFoundError extends ExpressError{
    constructor(message="Not Found", status){
        super(message, 404);
    }
}

/** 400 BAD REQUEST ERROR */
class BadRequestError extends ExpressError{
    constructor(message, status){
        super(message, 400)
    }
}

/** */
class UnauthorizedError extends ExpressError{
    constructor(message="You don't have access to this", status){
        super(message, 401)
    }
}

module.exports = {
    NotFoundError,
    BadRequestError,
    UnauthorizedError
}