import Error from "./error.js";
import chalk from "chalk";

function Handler(err, req, res, next) {
  console.log(
    chalk.white.bgRed.bold(` *Error: ${JSON.stringify(err.message)} * `)
  );
  if (err instanceof Error) {
    res.status(err.code).json({ success: false, message: err.message });
    return;
  }
  res.status(500).json({
    success: false,
    message: "Oops! Something went wrong",
  });
}

export default Handler;
