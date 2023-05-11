class Error {
  constructor(success, code, message) {
    this.success = success;
    this.code = code;
    this.message = message;
  }
  static badRequest(msg) {
    return new Error(false, 500, msg);
  }
  static internal(msg) {
    return new Error(false, 202, msg);
  }
  static notFound(msg) {
    return new Error(false, 404, msg);
  }
}

module.exports=Error;


