package com.ort.howlingwolf.infrastructure.repository

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.stereotype.Repository
import org.springframework.web.client.RestTemplate

@Repository
class DiscordRepository {

    companion object {
        private val logger = LoggerFactory.getLogger(DiscordRepository::class.java)

        // Discord の書式・メンションの記号をエスケープし、ユーザーが入力した本文をそのまま表示させる
        private val markdownCharacters = setOf('\\', '*', '_', '~', '`', '|', '>', '<', '[', ']', '(', ')', '#', '-', '@', ':')

        internal fun escapeMarkdown(text: String): String = buildString {
            text.forEach {
                if (it in markdownCharacters) append('\\')
                append(it)
            }
        }

        internal fun createRequest(masterUserId: String, villageId: Int, message: String): Request = Request(
            content = "<@!$masterUserId>\nhttps://howling-wolf.com/village?id=$villageId\n${escapeMarkdown(message)}",
            // 開発者へのメンションだけを許可する
            allowedMentions = AllowedMentions(users = listOf(masterUserId))
        )
    }

    @Value("\${discord.webhook-url:}")
    private lateinit var webhookUrl: String

    @Value("\${discord.master-userid:}")
    private lateinit var masterUserId: String

    fun post(villageId: Int, message: String) {
        if (webhookUrl.isEmpty()) return
        try {
            val restTemplate = RestTemplate()
            val request = createRequest(masterUserId, villageId, message)
            val formHeaders = HttpHeaders()
            formHeaders.contentType = MediaType.APPLICATION_JSON
            formHeaders.add(HttpHeaders.USER_AGENT, "RestTemplate")
            val formEntity = HttpEntity(request, formHeaders)
            restTemplate.exchange(webhookUrl, HttpMethod.POST, formEntity, String::class.java)
        } catch (e: Exception) {
            logger.error("discord投稿に失敗しました", e)
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    data class Request(
        val content: String,
        // メンションは既定では一切解釈させない
        @get:JsonProperty("allowed_mentions")
        val allowedMentions: AllowedMentions = AllowedMentions()
    ) : java.io.Serializable

    @JsonInclude(JsonInclude.Include.NON_NULL)
    data class AllowedMentions(
        val parse: List<String> = emptyList(),
        val users: List<String>? = null
    ) : java.io.Serializable
}
