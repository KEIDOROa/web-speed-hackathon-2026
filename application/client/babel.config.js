module.exports = (api) => {
  api.cache(() => process.env.NODE_ENV);
  const isProduction = api.env("production");

  return {
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
    plugins: [!isProduction && require.resolve("react-refresh/babel")].filter(Boolean),
  };
};
