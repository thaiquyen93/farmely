package com.farmely.cultivation.service;

import com.farmely.cultivation.dto.request.CreateDiaryRequest;
import com.farmely.cultivation.dto.request.UpdateDiaryRequest;
import com.farmely.cultivation.dto.response.FarmDiaryResponse;

import java.util.List;

public interface FarmDiaryService {

    List<FarmDiaryResponse> getAllDiaries(Integer rentalId);

    FarmDiaryResponse getDiaryById(Integer diaryId);

    FarmDiaryResponse createDiary(CreateDiaryRequest request);

    FarmDiaryResponse updateDiary(Integer diaryId, UpdateDiaryRequest request);

    void deleteDiary(Integer diaryId);
}
