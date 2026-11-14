package com.ort.howlingwolf.infrastructure.repository

import com.slack.api.Slack
import com.slack.api.SlackConfig
import com.slack.api.util.http.SlackHttpClient
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.Duration


@Service
class SlackRepository {

    companion object {
        // 応答が遅くても呼び出し元を長く待たせないよう、接続と読み取りにタイムアウトを設定する
        internal val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(5)
        internal val READ_TIMEOUT: Duration = Duration.ofSeconds(10)

        // Slack が制御記号として解釈する &, <, > をエスケープし、<!channel> やリンク記法を無効にする
        internal fun escape(text: String): String =
            text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        // SDK の既定の設定 (プロキシなど) を引き継いだうえでタイムアウトだけを変える
        internal fun createSlack(config: SlackConfig, connectTimeout: Duration, readTimeout: Duration): Slack {
            val okHttpClient = SlackHttpClient.buildOkHttpClient(config).newBuilder()
                .connectTimeout(connectTimeout)
                .readTimeout(readTimeout)
                .build()
            return Slack.getInstance(config, SlackHttpClient(okHttpClient))
        }
    }

    @Value("\${slack.token:}")
    private val slackToken: String? = null

    private val slack: Slack = createSlack(SlackConfig.DEFAULT, CONNECT_TIMEOUT, READ_TIMEOUT)

    fun postToSlack(villageId: Int, msg: String) {
        slackToken ?: return
        slack.methods(slackToken).chatPostMessage { req ->
            req.channel("howling-wolf")
                .text("vid: ${villageId}\n${escape(msg)}")
                .mrkdwn(false)
                .linkNames(false)
        }
    }
}
