package com.campustrack.lostandfound.service;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MatchSuggestionPublisher {

    private final ConcurrentHashMap<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    private String key(String type, Long id) {
        return type + ":" + id;
    }

    public SseEmitter register(String type, Long id) {
        String k = key(type, id);
        SseEmitter emitter = new SseEmitter(1000L * 60 * 30); // 30 minutes
        emitters.computeIfAbsent(k, s -> new ArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(k, emitter));
        emitter.onTimeout(() -> removeEmitter(k, emitter));
        return emitter;
    }

    private void removeEmitter(String k, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(k);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) emitters.remove(k);
        }
    }

    public void publish(String type, Long id, Object payload) {
        String k = key(type, id);
        List<SseEmitter> list = emitters.get(k);
        if (list == null) return;
        List<SseEmitter> toRemove = new ArrayList<>();
        for (SseEmitter e : list) {
            try {
                e.send(SseEmitter.event().name("matches").data(payload));
            } catch (IOException ex) {
                toRemove.add(e);
            }
        }
        for (SseEmitter r : toRemove) removeEmitter(k, r);
    }
}
