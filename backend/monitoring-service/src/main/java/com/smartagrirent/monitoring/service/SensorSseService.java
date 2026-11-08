package com.smartagrirent.monitoring.service;

import com.smartagrirent.monitoring.dto.response.SensorReadingResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SensorSseService {

    private static final Logger log = LoggerFactory.getLogger(SensorSseService.class);
    private static final Long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    // Map plotId -> List of active SseEmitters. PlotId = 0 or null represents global broadcast
    private final Map<Integer, List<SseEmitter>> plotEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Integer plotId, SensorReadingResponse initialData) {
        Integer key = (plotId != null) ? plotId : 0;
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        plotEmitters.computeIfAbsent(key, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(key, emitter));
        emitter.onTimeout(() -> removeEmitter(key, emitter));
        emitter.onError(e -> removeEmitter(key, emitter));

        // Send connection established event
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of(
                            "message", "SSE stream connected successfully for plot " + (key == 0 ? "ALL" : key),
                            "plotId", key
                    ), MediaType.APPLICATION_JSON));

            // If initial data is provided, send immediately
            if (initialData != null) {
                emitter.send(SseEmitter.event()
                        .name("SENSOR_UPDATE")
                        .data(initialData, MediaType.APPLICATION_JSON));
            }
        } catch (IOException e) {
            log.warn("Failed to send initial SSE payload: {}", e.getMessage());
            removeEmitter(key, emitter);
        }

        log.info("Client subscribed to SSE for plotId {}. Active connections: {}", key, plotEmitters.get(key).size());
        return emitter;
    }

    public void broadcastReading(SensorReadingResponse reading) {
        if (reading == null) return;

        // 1. Send to plot-specific subscribers
        sendToSubscribers(reading.getPlotId(), reading);

        // 2. Send to global subscribers (plotId = 0)
        sendToSubscribers(0, reading);
    }

    private void sendToSubscribers(Integer key, SensorReadingResponse reading) {
        List<SseEmitter> emitters = plotEmitters.get(key);
        if (emitters == null || emitters.isEmpty()) return;

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("SENSOR_UPDATE")
                        .data(reading, MediaType.APPLICATION_JSON));
            } catch (IOException | IllegalStateException e) {
                log.debug("Removing dead SSE emitter for key {}: {}", key, e.getMessage());
                removeEmitter(key, emitter);
            }
        }
    }

    private void removeEmitter(Integer key, SseEmitter emitter) {
        List<SseEmitter> list = plotEmitters.get(key);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                plotEmitters.remove(key);
            }
        }
    }
}
