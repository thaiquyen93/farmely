package com.smartagrirent.monitoring.service;

import com.smartagrirent.monitoring.dto.response.WeatherResponse;

import java.util.Map;

public interface WeatherService {

    WeatherResponse getCurrentWeather(Integer plotId);

    WeatherResponse getWeatherForecast(Integer plotId);

    Map<String, Object> getWateringPolicy(Integer plotId);
}
