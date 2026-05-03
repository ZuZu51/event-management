package com.example.event_management.User.service;

import com.example.event_management.User.dto.UpdateUserInfoDTO;
import com.example.event_management.User.entity.User;
import java.util.List;
import java.util.Optional;

public interface UserService {
    List<User> getAllUsers();
    Optional<User> getUserById(Long id);
    Optional<User> getUserByEmail(String email);
    Optional<User> getUserByGoogleId(String googleId);
    User createUser(User user);
    User updateUser(Long id, UpdateUserInfoDTO dto);
    void deleteUser(Long id);
}
