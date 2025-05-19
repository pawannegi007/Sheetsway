declare global {
  namespace Express {
    // Extend the Request interface to include "user"
    interface Request {
      user?: UserAuthData;
    }
  }
}

export {};
