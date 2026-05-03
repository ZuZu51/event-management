import { callApi } from "../common/helper/callApi";

export interface School {
  id?: number;
  name: string;
}

export interface Department {
  id?: number;
  name: string;
  schoolId: number;
  schoolName?: string;
}

export interface EventCategory {
  id?: number;
  label: string;
  value: string;
  active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  id?: number;
  active?: boolean;
}

export const schoolService = {
  // ==================== SCHOOLS ====================
  
  /**
   * Lấy tất cả trường
   */
  getAllSchools: async (): Promise<ApiResponse<School[]>> => {
    console.log('🔌 Gọi API: GET /admin/schools');
    const response = await callApi<ApiResponse<School[]>, null>("GET", "admin/schools", null, true);
    console.log('📥 API Response - getAllSchools:', response);
    return response;
  },

  /**
   * Lấy danh sách trường hoạt động
   */
  getActiveSchools: async (): Promise<ApiResponse<School[]>> => {
    return await callApi<ApiResponse<School[]>, null>("GET", "admin/schools/active", null, true);
  },

  /**
   * Lấy trường theo ID
   */
  getSchoolById: async (schoolId: number): Promise<ApiResponse<School>> => {
    return await callApi<ApiResponse<School>, null>("GET", `admin/schools/${schoolId}`, null, true);
  },

  /**
   * Tạo trường mới
   */
  createSchool: async (school: School): Promise<ApiResponse<School>> => {
    return await callApi<ApiResponse<School>, School>("POST", "admin/schools", school, true);
  },

  /**
   * Cập nhật trường
   */
  updateSchool: async (schoolId: number, school: School): Promise<ApiResponse<School>> => {
    return await callApi<ApiResponse<School>, School>("PUT", `admin/schools/${schoolId}`, school, true);
  },

  /**
   * Xóa trường
   */
  deleteSchool: async (schoolId: number): Promise<ApiResponse<any>> => {
    return await callApi<ApiResponse<any>, null>("DELETE", `admin/schools/${schoolId}`, null, true);
  },

  // ==================== DEPARTMENTS ====================
  
  /**
   * Lấy các khoa theo trường
   */
  getDepartmentsBySchool: async (schoolId: number): Promise<ApiResponse<Department[]>> => {
    return await callApi<ApiResponse<Department[]>, null>("GET", `admin/schools/${schoolId}/departments`, null, true);
  },

  /**
   * Tạo khoa mới
   */
  createDepartment: async (schoolId: number, department: { name: string }): Promise<ApiResponse<Department>> => {
    return await callApi<ApiResponse<Department>, { name: string }>("POST", `admin/schools/${schoolId}/departments`, department, true);
  },

  /**
   * Cập nhật khoa
   */
  updateDepartment: async (schoolId: number, deptId: number, department: { name: string }): Promise<ApiResponse<Department>> => {
    return await callApi<ApiResponse<Department>, { name: string }>("PUT", `admin/schools/${schoolId}/departments/${deptId}`, department, true);
  },

  /**
   * Xóa khoa
   */
  deleteDepartment: async (schoolId: number, deptId: number): Promise<ApiResponse<any>> => {
    return await callApi<ApiResponse<any>, null>("DELETE", `admin/schools/${schoolId}/departments/${deptId}`, null, true);
  },

  // ==================== EVENT CATEGORIES ====================
  
  /**
   * Lấy tất cả danh mục sự kiện
   */
  getAllCategories: async (): Promise<ApiResponse<EventCategory[]>> => {
    console.log('🔌 Gọi API: GET /admin/categories');
    const response = await callApi<ApiResponse<EventCategory[]>, null>("GET", "admin/categories", null, true);
    console.log('📥 API Response - getAllCategories:', response);
    return response;
  },

  /**
   * Lấy danh mục sự kiện hoạt động
   */
  getActiveCategories: async (): Promise<ApiResponse<EventCategory[]>> => {
    return await callApi<ApiResponse<EventCategory[]>, null>("GET", "admin/categories/active", null, true);
  },

  /**
   * Lấy danh mục theo ID
   */
  getCategoryById: async (categoryId: number): Promise<ApiResponse<EventCategory>> => {
    return await callApi<ApiResponse<EventCategory>, null>("GET", `admin/categories/${categoryId}`, null, true);
  },

  /**
   * Tạo danh mục mới
   */
  createCategory: async (category: EventCategory): Promise<ApiResponse<EventCategory>> => {
    return await callApi<ApiResponse<EventCategory>, EventCategory>("POST", "admin/categories", category, true);
  },

  /**
   * Cập nhật danh mục
   */
  updateCategory: async (categoryId: number, category: EventCategory): Promise<ApiResponse<EventCategory>> => {
    return await callApi<ApiResponse<EventCategory>, EventCategory>("PUT", `admin/categories/${categoryId}`, category, true);
  },

  /**
   * Xóa danh mục
   */
  deleteCategory: async (categoryId: number): Promise<ApiResponse<any>> => {
    return await callApi<ApiResponse<any>, null>("DELETE", `admin/categories/${categoryId}`, null, true);
  },

  /**
   * Chuyển đổi trạng thái danh mục
   */
  toggleCategoryStatus: async (categoryId: number): Promise<any> => {
    return await callApi<any, null>("PUT", `admin/categories/${categoryId}/toggle-active`, null, true);
  },
};
