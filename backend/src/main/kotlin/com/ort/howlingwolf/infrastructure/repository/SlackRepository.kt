package com.ort.howlingwolf.infrastructure.repository

import com.slack.api.Slack
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service


@Service
class SlackRepository {

    companion object {
        // Slack が制御記号として解釈する &, <, > をエスケープし、<!channel> やリンク記法を無効にする
        internal fun escape(text: String): String =
            text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    }

    @Value("\${slack.token:}")
    private val slackToken: String? = null

    fun postToSlack(villageId: Int, msg: String) {
        slackToken ?: return
        val slack = Slack.getInstance()
        slack.methods(slackToken).chatPostMessage { req ->
            req.channel("howling-wolf")
                .text("vid: ${villageId}\n${escape(msg)}")
                .mrkdwn(false)
                .linkNames(false)
        }
    }
}
