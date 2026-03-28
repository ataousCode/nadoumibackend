import BaseRepository from "./base.repository.js";
import bcrypt from "bcryptjs";

class AdminRepository extends BaseRepository {
  constructor() {
    super("Admin");
  }

  async findByEmail(email) {
    const admin = await this.model.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!admin) throw new Error("Admin not found");
    return admin;
  }

  async findByEmailOrNull(email) {
    return await this.model.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByIdWithoutPassword(id) {
    return await this.model.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        role: true,
        lastLoginAt: true,
        lastLoginIp: true,
        profilePicture: true,
        createdAt: true,
      },
    });
  }

  async update(id, updateData) {
    // We already have super.update, but we need custom logic for passwords/emails
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    return super.update(id, updateData);
  }

  async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    return await this.model.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateProfilePicture(id, profilePicturePath) {
    return await this.model.update({
      where: { id },
      data: { profilePicture: profilePicturePath },
    });
  }
}

export default new AdminRepository();
