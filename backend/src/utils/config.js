const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
];

const parseAllowedOrigins = (value) => {
  if (!value) {
    return DEFAULT_ORIGINS;
  }

  return [...new Set(
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
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
