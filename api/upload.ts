import app from "../server/app";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const isStream = req.url && req.url.includes("stream");
  req.url = isStream ? "/api/upload?stream=true" : "/api/upload";
  return app(req, res);
}
