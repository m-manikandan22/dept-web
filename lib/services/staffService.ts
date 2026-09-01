import { studentRepository } from '../repositories/studentRepository';
import { achievementRepository } from '../repositories/achievementRepository';
import { certificationRepository } from '../repositories/certificationRepository';

export const staffService = {
  async listStudents(filters: any) {
    return await studentRepository.getAll(filters);
  },

  async verifyAchievement(achievementId: string, status: string, staffId: string) {
    return await achievementRepository.verify(achievementId, status, staffId);
  },

  async verifyCertification(certId: string, status: string, staffId: string) {
    return await certificationRepository.verify(certId, status, staffId);
  },

  async getVerificationQueues() {
    const [achievements, certifications] = await Promise.all([
      achievementRepository.getVerificationQueue(),
      certificationRepository.getVerificationQueue(),
    ]);
    return { achievements, certifications };
  },
};
