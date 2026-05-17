import multer from "multer";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
    namespace Multer {
      interface File extends multer.File {}
    }
  }
}

export {};