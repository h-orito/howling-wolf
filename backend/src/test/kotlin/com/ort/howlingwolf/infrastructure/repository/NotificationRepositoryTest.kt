package com.ort.howlingwolf.infrastructure.repository

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder
import org.springframework.web.client.ResourceAccessException
import java.net.ServerSocket
import java.net.SocketTimeoutException
import java.time.Duration

class NotificationRepositoryTest {
    // RestTemplate の JSON 変換と同じ設定
    private val objectMapper = Jackson2ObjectMapperBuilder.json().build<com.fasterxml.jackson.databind.ObjectMapper>()

    @Test
    @DisplayName("Discord: 開発者へのメンションだけを許可し、本文のメンション・書式は無効にする")
    fun discordRequest() {
        val request = DiscordRepository.createRequest("123", 10, "@everyone <@&456> [偽](https://evil.example) **太字**")
        val json = objectMapper.readTree(objectMapper.writeValueAsString(request))

        assertEquals(
            "<@!123>\nhttps://howling-wolf.com/village?id=10\n" +
                "\\@everyone \\<\\@&456\\> \\[偽\\]\\(https\\:/" + "/evil.example\\) \\*\\*太字\\*\\*",
            json["content"].asText()
        )
        assertEquals(0, json["allowed_mentions"]["parse"].size())
        assertEquals(listOf("123"), json["allowed_mentions"]["users"].map { it.asText() })
        assertFalse(json.has("allowedMentions"))
    }

    @Test
    @DisplayName("Discord: 接続 5 秒・読み取り 10 秒のタイムアウトを設定する")
    fun discordTimeout() {
        assertEquals(Duration.ofSeconds(5), DiscordRepository.CONNECT_TIMEOUT)
        assertEquals(Duration.ofSeconds(10), DiscordRepository.READ_TIMEOUT)
    }

    @Test
    @DisplayName("Discord: 応答が返ってこなければ読み取りのタイムアウトで打ち切る")
    fun discordReadTimeout() {
        // 接続は受け付けるが応答を返さないサーバー
        ServerSocket(0).use { server ->
            val restTemplate = DiscordRepository.createRestTemplate(Duration.ofSeconds(5), Duration.ofMillis(300))
            val startedAt = System.nanoTime()
            val e = assertThrows(ResourceAccessException::class.java) {
                restTemplate.postForObject("http://127.0.0.1:${server.localPort}/", "{}", String::class.java)
            }
            val elapsed = Duration.ofNanos(System.nanoTime() - startedAt)
            assertTrue(e.cause is SocketTimeoutException, e.cause.toString())
            assertTrue(elapsed < Duration.ofSeconds(5), elapsed.toString())
        }
    }
}
