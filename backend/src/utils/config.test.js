const {
  DEFAULT_ORIGINS,
  getMissingEnvironmentVariables,
  parseAllowedOrigins,
} = require("./config");

describe("environment configuration", () => {
  test("uses both local applications by default", () => {
    expect(parseAllowedOrigins()).toEqual(DEFAULT_ORIGINS);
  });

  test("parses and de-duplicates configured origins", () => {
    expect(parseAllowedOrigins(" https://app.example.com,https://app.example.com "))
      .toEqual(["https://app.example.com"]);
  });

  test("reports required missing values", () => {
    expect(getMissingEnvironmentVariables({ JWT_SECRET: "secret" }))
      .toEqual(["MONGODB_URI"]);
  });
});
