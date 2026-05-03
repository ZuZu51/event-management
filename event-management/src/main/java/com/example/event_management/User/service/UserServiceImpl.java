package com.example.event_management.User.service;

import com.example.event_management.User.dto.UpdateUserInfoDTO;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.entity.School;
import com.example.event_management.User.entity.Department;
import com.example.event_management.User.repository.UserRepository;
import com.example.event_management.User.repository.SchoolRepository;
import com.example.event_management.User.repository.DepartmentRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<User> getUserByGoogleId(String googleId) {
        return userRepository.findByGoogleId(googleId);
    }

    @Override
    public User createUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public User updateUser(Long id, UpdateUserInfoDTO dto) {
        return userRepository.findById(id)
                .map(existing -> {
                    if (dto.getName() != null) existing.setName(dto.getName());
                    if (dto.getFullname() != null) existing.setFullName(dto.getFullname());
                    if (dto.getAvatar() != null) existing.setAvatar(dto.getAvatar());
                    if (dto.getDateOfBirth() != null) existing.setDateOfBirth(dto.getDateOfBirth());
                    if (dto.getGender() != null) existing.setGender(dto.getGender());
                    if (dto.getStudentId() != null) existing.setStudentId(dto.getStudentId());
                    if (dto.getTeacherId() != null) existing.setTeacherId(dto.getTeacherId());
                    if (dto.getSchoolId() != null) {
                        schoolRepository.findById(dto.getSchoolId())
                                .ifPresent(existing::setSchool);
                    }
                    if (dto.getDepartmentId() != null) {
                        departmentRepository.findById(dto.getDepartmentId())
                                .ifPresent(existing::setDepartment);
                    }
                    return userRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
