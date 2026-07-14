const {
  DEFAULT_ORIGINS,
  getMissingEnvironmentVariables,
  parseAllowedOrigins,
} = require("./config");

describe("environment configuration", () => {
  test("uses the production and local applications by default", () => {
    expect(parseAllowedOrigins()).toEqual(DEFAULT_ORIGINS);
  });

  test("retains trusted defaults and de-duplicates configured origins", () => {
    expect(parseAllowedOrigins(" https://app.example.com,https://app.example.com "))
      .toEqual([...DEFAULT_ORIGINS, "https://app.example.com"]);
  });

  test("reports required missing values", () => {
    expect(getMissingEnvironmentVariables({ JWT_SECRET: "secret" }))
      .toEqual(["MONGODB_URI"]);
  });
});
