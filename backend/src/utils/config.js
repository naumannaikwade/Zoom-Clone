const DEFAULT_ORIGINS = [
  "https://xzoom.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

const parseAllowedOrigins = (value) => {
  return [...new Set(
    [
      ...DEFAULT_ORIGINS,
      ...String(value || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ]
  )];
};

const getMissingEnvironmentVariables = (environment) => {
  return ["MONGODB_URI", "JWT_SECRET"].filter((key) => !environment[key]);
};

module.exports = {
  DEFAULT_ORIGINS,
  getMissingEnvironmentVariables,
  parseAllowedOrigins,
};
