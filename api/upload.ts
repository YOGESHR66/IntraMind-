import app from "../server/app";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: any, res: any) {
  const isStream = req.url && req.url.includes("stream");
  req.url = isStream ? "/api/upload?stream=true" : "/api/upload";
  return app(req, res);
}
