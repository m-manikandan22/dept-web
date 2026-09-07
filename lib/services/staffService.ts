import { studentRepository } from '../repositories/studentRepository';
import { achievementRepository } from '../repositories/achievementRepository';
import { certificationRepository } from '../repositories/certificationRepository';

export const staffService = {
  async listStudents(filters: any) {
    return await studentRepository.getAll(filters);
  },
};
