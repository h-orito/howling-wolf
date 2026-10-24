package com.ort.howlingwolf.infrastructure.repository

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder

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
    @DisplayName("Slack: 制御記号をエスケープする")
    fun slackEscape() {
        assertEquals(
            "&lt;!channel&gt; &lt;https://evil.example|偽&gt; A&amp;B",
            SlackRepository.escape("<!channel> <https://evil.example|偽> A&B")
        )
    }
}
