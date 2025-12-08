import path from "path";

import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";

export default (_env, argv) => {
  return {
    stats: "minimal",
    entry: "./src/main.ts",

    output: {
      path: path.resolve(process.cwd(), "dist"),
      filename: "bundle.js",
      clean: true,
    },

    devServer: {
      compress: true,
      allowedHosts: "all",
      static: false,
      client: {
        logging: "warn",
        overlay: {
          errors: true,
          warnings: false,
        },
        progress: true,
      },
      port: 3000,
      host: "0.0.0.0",
    },

    performance: { hints: false },

    devtool: argv.mode === "development" ? "eval-source-map" : undefined,

    optimization: {
      minimize: argv.mode === "production",
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 6,
            compress: { drop_console: false },
            output: { comments: false, beautify: false },
          },
        }),
      ],
    },

    module: {
      rules: [
        {
          test: /\.ts(x)?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },

    plugins: [

      new CopyPlugin({
        patterns: [{ from: "public/" }],
      }),


      new HtmlWebpackPlugin({
        template: "./index.ejs",
        hash: true,
        minify: false,
      }),
    ],
  };
};
