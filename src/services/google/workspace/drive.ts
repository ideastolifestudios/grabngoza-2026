// @ts-nocheck
// src/services/google/workspace/drive.ts
import { google } from "googleapis";

export class GoogleWorkspaceDriveService {
  private drive = google.drive({ version: "v3" });

  async createSharedDrive(name: string) {
    const auth = await this.getAuth();

    const result = await this.drive.drives.create({
      auth,
      requestBody: {
        name: name,
      },
      fields: "id,name",
    });

    return result.data;
  }

  async createFolder(driveName: string, folderName: string) {
    const auth = await this.getAuth();

    const driveId = await this.getDriveId(driveName);

    const result = await this.drive.files.create({
      auth,
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [driveId],
      },
      fields: "id,name",
      supportsAllDrives: true,
    });

    return result.data;
  }

  async uploadFile(
    driveName: string,
    fileName: string,
    fileContent: Buffer,
    mimeType: string
  ) {
    const auth = await this.getAuth();

    const driveId = await this.getDriveId(driveName);

    const result = await this.drive.files.create({
      auth,
      requestBody: {
        name: fileName,
        parents: [driveId],
      },
      media: {
        mimeType: mimeType,
        body: fileContent,
      },
      supportsAllDrives: true,
    });

    return result.data;
  }

  async shareFile(fileId: string, email: string, role: "reader" | "writer") {
    const auth = await this.getAuth();

    await this.drive.permissions.create({
      auth,
      fileId: fileId,
      requestBody: {
        role: role,
        type: "user",
        emailAddress: email,
      },
      supportsAllDrives: true,
    });

    return { fileId, email, role, status: "shared" };
  }

  private async getDriveId(driveName: string): Promise<string> {
    // Cache and retrieve from database
    const cached = await db.googleDrive.findUnique({
      where: { name: driveName },
    });

    if (cached) return cached.driveId;

    // Fallback: search for drive
    throw new Error(`Drive "${driveName}" not found`);
  }

  private async getAuth() {
    // Implementation in next section
  }
}