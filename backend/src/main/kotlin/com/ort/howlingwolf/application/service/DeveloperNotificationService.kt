package com.ort.howlingwolf.application.service

import com.ort.howlingwolf.infrastructure.repository.DiscordRepository
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

/**
 * 開発者向けの通知 (Discord)
 *
 * 通知はトランザクションの commit 後に送る。
 * 外部への送信を待つ間、村の行ロックなどを持ち続けないようにするため。
 * rollback された場合は送らない。トランザクションの外から呼ばれた場合はその場で送る。
 */
@Service
class DeveloperNotificationService(
    private val eventPublisher: ApplicationEventPublisher,
    private val discordRepository: DiscordRepository
) {

    companion object {
        private val logger = LoggerFactory.getLogger(DeveloperNotificationService::class.java)
    }

    data class DeveloperNotificationEvent(
        val villageId: Int,
        val message: String
    )

    fun notifyAfterCommit(villageId: Int, message: String) {
        eventPublisher.publishEvent(DeveloperNotificationEvent(villageId, message))
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    fun send(event: DeveloperNotificationEvent) {
        // commit 済みなので、通知に失敗しても呼び出し元の処理は失敗させない
        try {
            discordRepository.post(event.villageId, event.message)
        } catch (e: Exception) {
            logger.error("discord投稿に失敗しました: {}", e.javaClass.simpleName)
        }
    }
}
