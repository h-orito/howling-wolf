package com.ort.howlingwolf.api.controller

import com.nhaarman.mockitokotlin2.mock
import com.nhaarman.mockitokotlin2.never
import com.nhaarman.mockitokotlin2.verify
import com.nhaarman.mockitokotlin2.whenever
import com.ort.howlingwolf.application.service.AutogenerateVillageService
import com.ort.howlingwolf.domain.model.reserved.ReservedVillages
import com.ort.howlingwolf.fw.exception.ControllerExceptionHandler
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyInt
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders

class ReservedVillageControllerTest {
    private val service: AutogenerateVillageService = mock()
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(ReservedVillageController(service))
            .setControllerAdvice(ControllerExceptionHandler())
            .build()
    }

    @Test
    @DisplayName("limit が範囲内なら取得する")
    fun withinLimit() {
        whenever(service.findReservedVillages(10)).thenReturn(ReservedVillages(list = emptyList()))
        mockMvc.perform(get("/reserved-village/list").param("limit", "10")).andExpect(status().isOk)
        verify(service).findReservedVillages(10)
    }

    @Test
    @DisplayName("limit の指定がなければ 3 件")
    fun defaultLimit() {
        whenever(service.findReservedVillages(3)).thenReturn(ReservedVillages(list = emptyList()))
        mockMvc.perform(get("/reserved-village/list")).andExpect(status().isOk)
        verify(service).findReservedVillages(3)
    }

    @Test
    @DisplayName("limit が上限を超えるか 0 以下なら取得しない")
    fun outOfRange() {
        listOf("11", "100000000", "0", "-1").forEach { limit ->
            mockMvc.perform(get("/reserved-village/list").param("limit", limit))
                .andExpect(status().is4xxClientError)
        }
        verify(service, never()).findReservedVillages(anyInt())
    }
}
