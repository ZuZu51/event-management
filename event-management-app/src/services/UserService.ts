import { callApi } from '../common/helper/callApi';

interface UserProfile {
  id: number;
  fullname: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  studentId?: string;
  teacherId?: string;
  school?: { id: number; name: string };
  department?: { id: number; name: string };
  avatar?: string;
  active?: boolean;
  role?: string;
}

interface UpdateUserDTO {
  fullname?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  studentId?: string;
  teacherId?: string;
  schoolId?: number;
  departmentId?: number;
}

class UserService {
  /**
   * Get user profile by ID
   */
  async getUserById(userId: number): Promise<UserProfile> {
    return callApi<UserProfile>('GET', `users/${userId}`, undefined, true);
  }

  /**
   * Update user profile
   */
  async updateUser(userId: number, data: UpdateUserDTO): Promise<UserProfile> {
    return callApi<UserProfile>('PUT', `users/${userId}`, data, true);
  }

  /**
   * Update single field
   */
  async updateUserField(userId: number, field: string, value: any): Promise<UserProfile> {
    const data: any = {};
    data[field] = value;
    return this.updateUser(userId, data);
  }
}

export default new UserService();
