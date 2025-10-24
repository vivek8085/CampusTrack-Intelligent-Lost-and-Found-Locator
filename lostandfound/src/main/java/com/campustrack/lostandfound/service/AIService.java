package com.campustrack.lostandfound.service;

import com.campustrack.lostandfound.model.FoundItem;
import com.campustrack.lostandfound.model.LostItem;
import com.campustrack.lostandfound.model.MatchSuggestion;
import com.campustrack.lostandfound.repository.MatchSuggestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIService {

    private final String AI_URL = "http://127.0.0.1:8000/predict_match/";

    @Autowired
    private MatchSuggestionRepository matchSuggestionRepository;

    @Autowired
    private com.campustrack.lostandfound.service.MatchSuggestionPublisher suggestionPublisher;

    private RestTemplate restTemplate = new RestTemplate();

    public double[] getEmbedding(String description, File imageFile) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("description", description == null ? "" : description);
            if (imageFile != null && imageFile.exists()) {
                body.add("image_file", new FileSystemResource(imageFile));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(AI_URL, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> map = response.getBody();
                if (map != null && map.containsKey("embedding_vector")) {
                    List<Number> list = (List<Number>) map.get("embedding_vector");
                    double[] emb = new double[list.size()];
                    for (int i = 0; i < list.size(); i++) emb[i] = list.get(i).doubleValue();
                    return emb;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private double cosine(double[] a, double[] b) {
        if (a == null || b == null) return -1;
        int n = Math.min(a.length, b.length);
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < n; i++) {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        if (na == 0 || nb == 0) return -1;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    public void analyzeAndSaveMatches(FoundItem foundItem, List<LostItem> lostItems) {
        try {
            File imageFile = null;
            if (foundItem.getImageUrl() != null && foundItem.getImageUrl().startsWith("/uploads/")) {
                String path = System.getProperty("user.dir") + foundItem.getImageUrl();
                imageFile = new File(path);
            }

            double[] foundEmb = getEmbedding(foundItem.getAbout() == null ? foundItem.getItemName() : foundItem.getAbout(), imageFile);
            if (foundEmb == null) return;

            List<MatchSuggestion> suggestions = new ArrayList<>();
            for (LostItem li : lostItems) {
                File liImage = null;
                if (li.getImageUrl() != null && li.getImageUrl().startsWith("/uploads/")) {
                    String p = System.getProperty("user.dir") + li.getImageUrl();
                    liImage = new File(p);
                }
                double[] lostEmb = getEmbedding(li.getAbout() == null ? li.getItemName() : li.getAbout(), liImage);
                double score = cosine(foundEmb, lostEmb);
                MatchSuggestion ms = new MatchSuggestion();
                ms.setFoundItemId(foundItem.getId());
                ms.setLostItemId(li.getId());
                ms.setScore(score);
                suggestions.add(ms);
            }

            // pick top 5
            List<MatchSuggestion> top = suggestions.stream()
                    .filter(s -> s.getScore() != null && s.getScore() >= 0)
                    .sorted(Comparator.comparingDouble(MatchSuggestion::getScore).reversed())
                    .limit(5)
                    .collect(Collectors.toList());

            matchSuggestionRepository.saveAll(top);
            // publish to SSE for this found item
            suggestionPublisher.publish("found", foundItem.getId(), top);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Analyze a lost item against existing found items and store suggestions
    public void analyzeLostAndSaveMatches(LostItem lostItem, List<FoundItem> foundItems) {
        try {
            File imageFile = null;
            if (lostItem.getImageUrl() != null && lostItem.getImageUrl().startsWith("/uploads/")) {
                String path = System.getProperty("user.dir") + lostItem.getImageUrl();
                imageFile = new File(path);
            }

            double[] lostEmb = getEmbedding(lostItem.getAbout() == null ? lostItem.getItemName() : lostItem.getAbout(), imageFile);
            if (lostEmb == null) return;

            List<MatchSuggestion> suggestions = new ArrayList<>();
            for (FoundItem fi : foundItems) {
                File fiImage = null;
                if (fi.getImageUrl() != null && fi.getImageUrl().startsWith("/uploads/")) {
                    String p = System.getProperty("user.dir") + fi.getImageUrl();
                    fiImage = new File(p);
                }
                double[] foundEmb = getEmbedding(fi.getAbout() == null ? fi.getItemName() : fi.getAbout(), fiImage);
                double score = cosine(lostEmb, foundEmb);
                MatchSuggestion ms = new MatchSuggestion();
                ms.setFoundItemId(fi.getId());
                ms.setLostItemId(lostItem.getId());
                ms.setScore(score);
                suggestions.add(ms);
            }

            List<MatchSuggestion> top = suggestions.stream()
                    .filter(s -> s.getScore() != null && s.getScore() >= 0)
                    .sorted(Comparator.comparingDouble(MatchSuggestion::getScore).reversed())
                    .limit(5)
                    .collect(Collectors.toList());

            matchSuggestionRepository.saveAll(top);
            // publish to SSE for this lost item
            suggestionPublisher.publish("lost", lostItem.getId(), top);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
