import { studentRepository } from '../repositories/studentRepository';
import { academicRepository } from '../repositories/academicRepository';
import { feeRepository } from '../repositories/feeRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { achievementRepository } from '../repositories/achievementRepository';
import { certificationRepository } from '../repositories/certificationRepository';

export const studentService = {
  async getFullProfile(registerNo: string) {
    const student = await studentRepository.getByRegisterNumber(registerNo);
    if (!student) throw new Error('Student not found');

    return this.assembleFullProfile(student);
  },

  async getFullProfileById(id: string) {
    const student = await studentRepository.getById(id);
    if (!student) throw new Error('Student not found');

    return this.assembleFullProfile(student);
  },

  async assembleFullProfile(student: any) {
    const [academics, fees, payments, achievements, certifications] = await Promise.all([
      academicRepository.getByStudent(student.id),
      feeRepository.getByStudent(student.id),
      paymentRepository.getByStudent(student.id),
      achievementRepository.getByStudent(student.id),
      certificationRepository.getByStudent(student.id),
    ]);

    return {
      ...student,
      academics,
      fees,
      payments,
      achievements,
      certifications,
    };
  },

  async createStudent(data: any) {
    return await studentRepository.create(data);
  },

  async deleteStudent(id: string) {
    return await studentRepository.delete(id);
  },
};
