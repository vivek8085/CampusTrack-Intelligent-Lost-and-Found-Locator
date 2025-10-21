package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.model.LostItem;
import com.campustrack.lostandfound.repository.LostItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/lostitems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class LostItemController {

    @Autowired
    private LostItemRepository lostItemRepository;

    // ✅ Report Lost Item with image upload
    @PostMapping(value = "/report", consumes = {"multipart/form-data"})
    public ResponseEntity<?> reportLostItem(
            @RequestPart("itemName") String itemName,
            @RequestPart("brand") String brand,
            @RequestPart("modelNo") String modelNo,
            @RequestPart("size") String size,
            @RequestPart("location") String location,
            @RequestPart("about") String about,
            @RequestPart("lostDateTime") String lostDateTime,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        try {
            LostItem item = new LostItem();
            item.setItemName(itemName);
            item.setBrand(brand);
            item.setModelNo(modelNo);
            item.setSize(size);
            item.setLocation(location);
            item.setAbout(about);

            // ✅ Handle date parsing safely
            try {
                item.setLostDateTime(LocalDateTime.parse(lostDateTime));
            } catch (DateTimeParseException e) {
                System.out.println("⚠ Invalid date format: " + lostDateTime);
                item.setLostDateTime(LocalDateTime.now());
            }

            // ✅ Handle image upload and store relative path
            if (image != null && !image.isEmpty()) {
                String projectDir = System.getProperty("user.dir");
                String uploadDir = projectDir + File.separator + "uploads";

                File directory = new File(uploadDir);
                if (!directory.exists()) {
                    directory.mkdirs();
                }

                String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
                String filePath = uploadDir + File.separator + fileName;
                File dest = new File(filePath);
                image.transferTo(dest);

                // Save relative path for web access
                item.setImageUrl("/uploads/" + fileName);
            }

            lostItemRepository.save(item);

            Map<String, Object> res = new HashMap<>();
            res.put("message", "✅ Lost item reported successfully!");
            res.put("itemId", item.getId());
            return ResponseEntity.ok(res);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "❌ Error saving uploaded image"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "❌ Failed to submit lost item: " + e.getMessage()));
        }
    }

    // ✅ Fetch all reported lost items
    @GetMapping("/all")
    public ResponseEntity<?> getAllLostItems() {
        try {
            return ResponseEntity.ok(lostItemRepository.findAll());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "❌ Failed to fetch lost items"));
        }
    }

    // ✅ Enable serving uploaded images
    @Bean
    public WebMvcConfigurer webMvcConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                registry.addResourceHandler("/uploads/**")
                        .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/");
            }
        };
    }
}
