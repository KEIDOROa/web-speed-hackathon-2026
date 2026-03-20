const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "> 0.5%, last 2 versions, not dead",
        corejs: "3",
        modules: false,
        useBuiltIns: "usage",
      },
    ],
    [
      "@babel/preset-react",
      {
        development: !isProduction,
        runtime: "automatic",
      },
    ],
  ],
};
