/** Error thrown by gh-apple-oauth operations. */
export class GhAppleOAuthError extends Error {
  /** Machine-readable error code. */
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GhAppleOAuthError";
    this.code = code;

    // Fix prototype chain for instanceof checks in transpiled code.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
