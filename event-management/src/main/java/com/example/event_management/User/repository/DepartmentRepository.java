package com.example.event_management.User.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.event_management.User.entity.Department;
import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findBySchoolIdAndActiveTrue(Long schoolId);
    List<Department> findByActiveTrue();
}
