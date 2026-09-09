import app from "../server/app";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: any, res: any) {
  const originalUrl =
    req.headers["x-matched-path"] ||
    req.headers["x-invoke-path"] ||
    req.headers["x-forwarded-uri"] ||
    req.url;

  if (originalUrl && originalUrl !== "/api" && originalUrl !== "/api/") {
    req.url = originalUrl;
  }

  return app(req, res);
}
