class apierror extends Error {
  constructor(
    statuscode,
    message = "something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statuscode = statuscode || 500;
    this.data = null;
    this.message = message;
    this.errors = errors;

    if (this.stack) this.stack = this.stack;
    else {
      error.capturestacktrace(this, this.constructor);
    }
  }
};

export default apierror;
