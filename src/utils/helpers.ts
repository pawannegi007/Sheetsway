import { Response } from "express";
import * as crypto from "crypto";
import config from "config";

const APPLICATION_SECRET = config.get<string>("application.secret");

export class AppResponse {
  static success(
    res: Response,
    message: string = "Request Successful",
    data: any = null,
    code: number = 200,
  ) {
    return res.status(code).json({
      status: "success",
      message,
      data,
      errors: null,
    });
  }

  static error(
    res: Response,
    message: string = "An error occurred",
    errors: any = null,
    code: number = 400,
  ) {
    return res.status(code).json({
      status: "error",
      message,
      data: null,
      errors,
    });
  }
}

export class Encryption {
  private static readonly algorithm = "aes-256-gcm";
  // Ensure the key is 32 bytes for AES-256
  private static readonly key = crypto
    .createHash("sha256")
    .update(APPLICATION_SECRET)
    .digest("base64")
    .substring(0, 32);
  private static readonly ivLength = 16; // AES block size / GCM standard
  private static readonly authTagLength = 16; // GCM standard

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(Encryption.ivLength);
    const cipher = crypto.createCipheriv(
      Encryption.algorithm,
      Encryption.key,
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // Prepend IV and AuthTag to the encrypted data
    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
  }

  static decrypt(encryptedText: string): string {
    const data = Buffer.from(encryptedText, "base64");
    const iv = data.subarray(0, Encryption.ivLength);
    const authTag = data.subarray(
      Encryption.ivLength,
      Encryption.ivLength + Encryption.authTagLength,
    );
    const encrypted = data.subarray(
      Encryption.ivLength + Encryption.authTagLength,
    );

    const decipher = crypto.createDecipheriv(
      Encryption.algorithm,
      Encryption.key,
      iv,
    );
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  }

  static encryptObject(obj: any): string {
    const jsonString = JSON.stringify(obj);
    return Encryption.encrypt(jsonString);
  }

  static decryptObject(encryptedText: string): any {
    const jsonString = Encryption.decrypt(encryptedText);
    return JSON.parse(jsonString);
  }
}

export function isTokenExpired(tokenSet: BaseTokenSet): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (tokenSet.expires_at) {
    return now >= tokenSet.expires_at;
  }

  if (tokenSet.expires_in && tokenSet.created_at) {
    return now >= tokenSet.created_at + tokenSet.expires_in;
  }
  // Assume expired if we don't have enough data
  return true;
}
