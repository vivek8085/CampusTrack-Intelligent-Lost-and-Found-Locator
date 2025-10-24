package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.model.FoundItem;
import com.campustrack.lostandfound.repository.FoundItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/founditems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FoundItemController {

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private com.campustrack.lostandfound.repository.LostItemRepository lostItemRepository;

    @Autowired
    private com.campustrack.lostandfound.service.AIService aiService;

    @PostMapping(value = "/report", consumes = {"multipart/form-data"})
    public ResponseEntity<?> reportFoundItem(
            @RequestPart("itemName") String itemName,
            @RequestPart("brand") String brand,
            @RequestPart("modelNo") String modelNo,
            @RequestPart("size") String size,
            @RequestPart("location") String location,
            @RequestPart("about") String about,
            @RequestPart("foundDateTime") String foundDateTime,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        try {
            FoundItem item = new FoundItem();
            item.setItemName(itemName);
            item.setBrand(brand);
            item.setModelNo(modelNo);
            item.setSize(size);
            item.setLocation(location);
            item.setAbout(about);

            // ✅ Handle found date/time safely
            try {
                item.setFoundDateTime(LocalDateTime.parse(foundDateTime));
            } catch (DateTimeParseException e) {
                item.setFoundDateTime(LocalDateTime.now());
            }

            // ✅ Handle image upload
            if (image != null && !image.isEmpty()) {
                String projectDir = System.getProperty("user.dir");
                Path uploadDirPath = Paths.get(projectDir, "uploads");

                if (!Files.exists(uploadDirPath)) {
                    Files.createDirectories(uploadDirPath);
                }

                String original = image.getOriginalFilename();
                String cleanName = Paths.get(original).getFileName().toString();
                String fileName = System.currentTimeMillis() + "_" + cleanName;
                Path destPath = uploadDirPath.resolve(fileName);

                try (InputStream in = image.getInputStream()) {
                    Files.copy(in, destPath, StandardCopyOption.REPLACE_EXISTING);
                }

                item.setImageUrl("/uploads/" + fileName);
            }

            foundItemRepository.save(item);

            // After saving, analyze for possible matches asynchronously
            new Thread(() -> {
                try {
                    java.util.List<com.campustrack.lostandfound.model.LostItem> lostItems = lostItemRepository.findAll();
                    aiService.analyzeAndSaveMatches(item, lostItems);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();

            Map<String, Object> res = new HashMap<>();
            res.put("message", "✅ Found item reported successfully!");
            res.put("itemId", item.getId());
            return ResponseEntity.ok(res);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "❌ Error saving uploaded image"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "❌ Failed to submit found item: " + e.getMessage()));
        }
    }

    // ✅ Fetch all found items
    @GetMapping("/all")
    public ResponseEntity<List<FoundItem>> getAllFoundItems() {
        List<FoundItem> items = foundItemRepository.findAll();
        return ResponseEntity.ok(items);
    }
}
