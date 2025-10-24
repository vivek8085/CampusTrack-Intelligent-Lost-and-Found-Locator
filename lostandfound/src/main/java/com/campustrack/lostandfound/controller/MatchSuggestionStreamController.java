package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.service.MatchSuggestionPublisher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/stream/matches")
public class MatchSuggestionStreamController {

    @Autowired
    private MatchSuggestionPublisher publisher;

    // clients subscribe for suggestions related to a found item
    @GetMapping(value = "/found/{id}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamFound(@PathVariable Long id) {
        return publisher.register("found", id);
    }

    // clients subscribe for suggestions related to a lost item
    @GetMapping(value = "/lost/{id}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamLost(@PathVariable Long id) {
        return publisher.register("lost", id);
    }
}
