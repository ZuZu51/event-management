import { callApi } from '../common/helper/callApi';

interface School {
  id: number;
  name: string;
  code?: string | null;
  city?: string | null;
}

interface Department {
  id: number;
  name: string;
  code?: string | null;
  schoolId?: number;
}

class SchoolDepartmentService {
  /**
   * Get all schools
   */
  async getSchools(): Promise<School[]> {
    try {
      const response = await callApi<School[]>('GET', 'api/auth/schools', undefined, false);
      console.log('📥 Schools Response:', response);
      return response || [];
    } catch (error) {
      console.error('❌ Error loading schools:', error);
      return [];
    }
  }

  /**
   * Get departments by school ID
   */
  async getDepartmentsBySchool(schoolId: number): Promise<Department[]> {
    try {
      console.log(`🔌 Gọi API: GET api/auth/departments?schoolId=${schoolId}`);
      const response = await callApi<Department[]>('GET', `api/auth/departments?schoolId=${schoolId}`, undefined, false);
      console.log('📥 Departments Response:', response);
      console.log('📥 Departments Response Type:', typeof response);
      console.log('📥 Departments Response Length:', response?.length);
      return response || [];
    } catch (error) {
      console.error('❌ Error loading departments:', error);
      return [];
    }
  }
}

export default new SchoolDepartmentService();
