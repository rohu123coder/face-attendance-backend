module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    switch (true) {
        case typeof err === 'string':
            // custom application error
            const is404 = err.toLowerCase().endsWith('not found');
            let statusCode = is404 ? 404 : 400;
            if(err.toLowerCase().includes('access'))
                statusCode = 403
            return res.status(statusCode).json({ message: err });
        case err.name === 'UnauthorizedError':
            // jwt authentication error
            return res.status(401).json({ message: 'Unauthorized' });
        case err.name === 'AccessDenied':
            return res.status(403).json({ message: err });
        default:
            return res.status(500).json({ message: err.message });
    }
}