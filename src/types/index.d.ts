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
    // This fixes: Namespace 'Express' has no exported member 'Multer'
    namespace Multer {
      interface File extends multer.File {}
    }
  }
}