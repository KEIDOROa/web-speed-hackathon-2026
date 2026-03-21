/// <reference types="webpack-dev-server" />
const path = require("path");
const fs = require("fs");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const webpack = require("webpack");

// CSSをHTMLにインライン化するプラグイン
class InlineCssPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("InlineCssPlugin", (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        "InlineCssPlugin",
        (data, cb) => {
          const cssLinkRegex = /<link\s+href="([^"]*\.css)"\s+rel="stylesheet"\s*\/?>/g;
          let html = data.html;
          let match;
          while ((match = cssLinkRegex.exec(data.html)) !== null) {
            const cssPath = match[1].startsWith("/") ? match[1].slice(1) : match[1];
            const cssAsset = compilation.assets[cssPath];
            if (cssAsset) {
              const cssContent = cssAsset.source();
              html = html.replace(match[0], `<style>${cssContent}</style>`);
            }
          }
          data.html = html;
          cb(null, data);
        }
      );
    });
  }
}

/** エントリで読み込む script に対応する preload を head に差し込み、LCP/TBT 改善を狙う */
class ScriptPreloadPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("ScriptPreloadPlugin", (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        "ScriptPreloadPlugin",
        (data, cb) => {
          const scriptSrcRegex = /<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/g;
          const preloads = [];
          let match;
          while ((match = scriptSrcRegex.exec(data.html)) !== null) {
            preloads.push(`<link rel="preload" href="${match[1]}" as="script" />`);
          }
          if (preloads.length > 0) {
            data.html = data.html.replace(/<head>/i, `<head>\n${preloads.join("\n")}\n`);
          }
          cb(null, data);
        },
      );
    });
  }
}

const SRC_PATH = path.resolve(__dirname, "./src");
const PUBLIC_PATH = path.resolve(__dirname, "../public");
const UPLOAD_PATH = path.resolve(__dirname, "../upload");
const DIST_PATH = path.resolve(__dirname, "../dist");

const isProduction = process.env.NODE_ENV === "production";

/** @type {import('webpack').Configuration} */
const config = {
  devServer: {
    historyApiFallback: true,
    host: "0.0.0.0",
    hot: true,
    port: 8080,
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:3000",
        ws: true,
      },
    ],
    static: [PUBLIC_PATH, UPLOAD_PATH],
  },
  devtool: isProduction ? false : "inline-source-map",
  entry: {
    main: [
      path.resolve(SRC_PATH, "./index.css"),
      path.resolve(SRC_PATH, "./buildinfo.ts"),
      path.resolve(SRC_PATH, "./index.tsx"),
    ],
  },
  mode: isProduction ? "production" : "development",
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(jsx?|tsx?|mjs|cjs)$/,
        use: [{ loader: "babel-loader" }],
      },
      {
        test: /\.css$/i,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: "css-loader", options: { url: false } },
          { loader: "postcss-loader" },
        ],
      },
      {
        resourceQuery: /binary/,
        type: "asset/resource",
        generator: {
          filename: "assets/[name]-[contenthash][ext]",
        },
      },
    ],
  },
  output: {
    chunkFilename: (pathData) => {
      const name = pathData.chunk?.name;
      return name
        ? `scripts/${name}-[contenthash].js`
        : `scripts/chunk-[contenthash].js`;
    },
    filename: "scripts/[name]-[contenthash].js",
    path: DIST_PATH,
    publicPath: "/",
    clean: true,
  },
  plugins: [
    ...(!isProduction ? [new ReactRefreshWebpackPlugin()] : []),
    // negaposi-analyzer-jaのpn_ja.dic.jsonがnpmパッケージのfilesに含まれていないため、ローカルコピーを使う
    new webpack.NormalModuleReplacementPlugin(
      /pn_ja\.dic\.json$/,
      path.resolve(SRC_PATH, "utils/pn_ja.dic.json"),
    ),
    new webpack.ProvidePlugin({
      AudioContext: ["standardized-audio-context", "AudioContext"],
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      // Heroku では SOURCE_VERSION 環境変数から commit hash を参照できます
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: isProduction ? "production" : "development",
    }),
    new MiniCssExtractPlugin({
      filename: "styles/[name]-[contenthash].css",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "node_modules/katex/dist/fonts"),
          to: path.resolve(DIST_PATH, "styles/fonts"),
        },
      ],
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(SRC_PATH, "./index.html"),
      scriptLoading: "defer",
    }),
    new ScriptPreloadPlugin(),
    ...(isProduction ? [new InlineCssPlugin()] : []),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".mjs", ".cjs", ".jsx", ".js"],
    alias: {
      "bayesian-bm25$": path.resolve(__dirname, "node_modules", "bayesian-bm25/dist/index.js"),
      ["kuromoji$"]: path.resolve(__dirname, "node_modules", "kuromoji/build/kuromoji.js"),
      "@ffmpeg/ffmpeg$": path.resolve(
        __dirname,
        "node_modules",
        "@ffmpeg/ffmpeg/dist/esm/index.js",
      ),
      "@ffmpeg/core$": path.resolve(
        __dirname,
        "node_modules",
        "@ffmpeg/core/dist/umd/ffmpeg-core.js",
      ),
      "@ffmpeg/core/wasm$": path.resolve(
        __dirname,
        "node_modules",
        "@ffmpeg/core/dist/umd/ffmpeg-core.wasm",
      ),
      "@imagemagick/magick-wasm/magick.wasm$": path.resolve(
        __dirname,
        "node_modules",
        "@imagemagick/magick-wasm/dist/magick.wasm",
      ),
    },
    fallback: {
      fs: false,
      path: false,
      url: false,
    },
  },
  optimization: {
    minimize: isProduction,
    splitChunks: {
      chunks: "all",
      maxInitialRequests: 20,
      maxAsyncRequests: 20,
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-redux|redux)[\\/]/,
          name: "react-vendor",
          chunks: "all",
          priority: 20,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "initial",
          priority: 10,
        },
      },
    },
    concatenateModules: true,
    usedExports: true,
    providedExports: true,
    sideEffects: true,
  },
  cache: {
    type: "filesystem",
  },
  ignoreWarnings: [
    {
      module: /@ffmpeg/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
};

module.exports = config;
