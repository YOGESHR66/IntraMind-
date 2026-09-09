import app from "../server/app";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: any, res: any) {
  req.url = "/api/chunks";
  return app(req, res);
}
