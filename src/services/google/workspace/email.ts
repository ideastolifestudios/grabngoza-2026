import { google } from "googleapis";
import { GoogleAuthService } from "../auth";

export class GoogleWorkspaceEmailService {
  private admin = google.admin({ version: "directory_v1" });
  private authService = new GoogleAuthService();

  async createUserEmail(userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: "manager" | "support" | "warehouse" | "marketing" | "owner";
  }) {
    try {
      const auth = await this.authService.getWorkspaceAuth();

      const newUser = {
        primaryEmail: userData.email,
        name: {
          givenName: userData.firstName,
          familyName: userData.lastName,
        },
        orgUnitPath: `/Departments/${userData.role}`,
        password: this.generateTemporaryPassword(),
      };

      const result = await this.admin.users.insert({
        auth,
        requestBody: newUser,
      } as any);

      return {
        success: true,
        email: result.data.primaryEmail,
        userId: result.data.id,
        tempPassword: newUser.password,
        status: "created",
      };
    } catch (error) {
      return {
        success: false,
        email: userData.email,
        error: String(error),
      };
    }
  }

  async updateUserRole(
    email: string,
    role: "manager" | "support" | "warehouse" | "marketing" | "owner"
  ) {
    try {
      const auth = await this.authService.getWorkspaceAuth();

      await this.admin.users.update({
        auth,
        userKey: email,
        requestBody: {
          orgUnitPath: `/Departments/${role}`,
        },
      } as any);

      return {
        success: true,
        email,
        role,
        status: "updated",
      };
    } catch (error) {
      return {
        success: false,
        email,
        error: String(error),
      };
    }
  }

  async deactivateUser(email: string) {
    try {
      const auth = await this.authService.getWorkspaceAuth();

      await this.admin.users.update({
        auth,
        userKey: email,
        requestBody: {
          suspended: true,
        },
      } as any);

      return {
        success: true,
        email,
        status: "deactivated",
      };
    } catch (error) {
      return {
        success: false,
        email,
        error: String(error),
      };
    }
  }

  async getUserInfo(email: string) {
    try {
      const auth = await this.authService.getWorkspaceAuth();

      const result = await this.admin.users.get({
        auth,
        userKey: email,
      } as any);

      return {
        success: true,
        user: result.data,
      };
    } catch (error) {
      return {
        success: false,
        email,
        error: String(error),
      };
    }
  }

  async listUsers(maxResults: number = 50) {
    try {
      const auth = await this.authService.getWorkspaceAuth();

      const result = await this.admin.users.list({
        auth,
        customer: "my_customer",
        maxResults,
        orderBy: "email",
      } as any);

      return {
        success: true,
        users: result.data.users || [],
      };
    } catch (error) {
      return {
        success: false,
        users: [],
        error: String(error),
      };
    }
  }

  private generateTemporaryPassword(): string {
    const length = 12;
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
