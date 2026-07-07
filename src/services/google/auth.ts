// src/services/google/auth.ts
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import * as fs from "fs";

export class GoogleAuthService {
  private workspaceAuth: JWT | null = null;
  private businessAuth: JWT | null = null;

  
  async getWorkspaceAuth(): Promise<JWT> {
    if (this.workspaceAuth) return this.workspaceAuth;

    const keyEnv = (process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS || "").trim();
    if (keyEnv.length === 0) {
      throw new Error("❌ Missing Google Workspace credentials in environment variables.");
    }
    
    const keyData = keyEnv.startsWith("{") ? JSON.parse(keyEnv) : JSON.parse(fs.readFileSync(keyEnv, "utf8"));

    this.workspaceAuth = new JWT({
      email: keyData.client_email,
      key: keyData.private_key,
      scopes: [
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.orgunit",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/contacts",
      ],
      subject: process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL,
    });

    return this.workspaceAuth;
  }

  
  async getBusinessAuth(): Promise<JWT> {
    if (this.businessAuth) return this.businessAuth;

    const keyEnv = (process.env.GOOGLE_BUSINESS_SERVICE_ACCOUNT_KEY || "").trim();
    if (keyEnv.length === 0) {
      throw new Error("❌ Missing Google Business service account credentials in environment variables.");
    }

    const keyData = keyEnv.startsWith("{") ? JSON.parse(keyEnv) : JSON.parse(fs.readFileSync(keyEnv, "utf8"));

    this.businessAuth = new JWT({
      email: keyData.client_email,
      key: keyData.private_key,
      scopes: [
        "https://www.googleapis.com/auth/content",
        "https://www.googleapis.com/auth/analytics",
        "https://www.googleapis.com/auth/webmasters",
      ],
    });

    return this.businessAuth;
  }

  async generateAccessToken(
    type: "workspace" | "business"
  ): Promise<string> {
    const auth = type === "workspace" ? this.workspaceAuth : this.businessAuth;

    if (!auth) {
      throw new Error(`${type} auth not initialized`);
    }

    const token = await auth.getAccessToken();
    return token.token || "";
  }
}