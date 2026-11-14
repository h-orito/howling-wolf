package com.ort.howlingwolf.application.service

import com.nhaarman.mockitokotlin2.any
import com.nhaarman.mockitokotlin2.doThrow
import com.nhaarman.mockitokotlin2.mock
import com.nhaarman.mockitokotlin2.never
import com.nhaarman.mockitokotlin2.reset
import com.nhaarman.mockitokotlin2.verify
import com.nhaarman.mockitokotlin2.verifyNoMoreInteractions
import com.nhaarman.mockitokotlin2.whenever
import com.ort.howlingwolf.infrastructure.repository.DiscordRepository
import com.ort.howlingwolf.infrastructure.repository.SlackRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.context.ApplicationEventPublisher
import org.springframework.context.annotation.AnnotationConfigApplicationContext
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.TransactionDefinition
import org.springframework.transaction.annotation.EnableTransactionManagement
import org.springframework.transaction.support.AbstractPlatformTransactionManager
import org.springframework.transaction.support.DefaultTransactionStatus
import org.springframework.transaction.support.TransactionTemplate

class DeveloperNotificationServiceTest {

    /** DB を使わずにトランザクションの commit / rollback と同期処理だけを再現する */
    class FakeTransactionManager : AbstractPlatformTransactionManager() {
        override fun doGetTransaction(): Any = Any()
        override fun doBegin(transaction: Any, definition: TransactionDefinition) {}
        override fun doCommit(status: DefaultTransactionStatus) {}
        override fun doRollback(status: DefaultTransactionStatus) {}
    }

    @Configuration
    @EnableTransactionManagement
    class Config {
        @Bean
        fun transactionManager(): PlatformTransactionManager = FakeTransactionManager()

        @Bean
        fun slackRepository(): SlackRepository = mock()

        @Bean
        fun discordRepository(): DiscordRepository = mock()

        @Bean
        fun developerNotificationService(
            eventPublisher: ApplicationEventPublisher,
            slackRepository: SlackRepository,
            discordRepository: DiscordRepository
        ) = DeveloperNotificationService(eventPublisher, slackRepository, discordRepository)
    }

    private lateinit var context: AnnotationConfigApplicationContext
    private lateinit var service: DeveloperNotificationService
    private lateinit var slackRepository: SlackRepository
    private lateinit var discordRepository: DiscordRepository
    private lateinit var transactionTemplate: TransactionTemplate

    @BeforeEach
    fun setUp() {
        context = AnnotationConfigApplicationContext(Config::class.java)
        service = context.getBean(DeveloperNotificationService::class.java)
        slackRepository = context.getBean(SlackRepository::class.java)
        discordRepository = context.getBean(DiscordRepository::class.java)
        transactionTemplate = TransactionTemplate(context.getBean(PlatformTransactionManager::class.java))
        reset(slackRepository, discordRepository)
    }

    @AfterEach
    fun tearDown() {
        context.close()
    }

    @Test
    @DisplayName("トランザクション中は送らず、commit 後に Slack と Discord へ送る")
    fun sendAfterCommit() {
        transactionTemplate.executeWithoutResult {
            service.notifyAfterCommit(10, "重複検出")
            verify(slackRepository, never()).postToSlack(any(), any())
            verify(discordRepository, never()).post(any(), any())
        }
        verify(slackRepository).postToSlack(10, "重複検出")
        verify(discordRepository).post(10, "重複検出")
    }

    @Test
    @DisplayName("rollback されたら送らない")
    fun notSendWhenRollback() {
        transactionTemplate.executeWithoutResult { status ->
            service.notifyAfterCommit(10, "重複検出")
            status.setRollbackOnly()
        }
        verifyNoMoreInteractions(slackRepository, discordRepository)
    }

    @Test
    @DisplayName("トランザクションの外から呼ばれたらその場で送る")
    fun sendWithoutTransaction() {
        service.notifyAfterCommit(10, "重複検出")
        verify(slackRepository).postToSlack(10, "重複検出")
        verify(discordRepository).post(10, "重複検出")
    }

    @Test
    @DisplayName("Slack への送信に失敗しても Discord へは送り、呼び出し元に例外を投げない")
    fun slackFailureDoesNotStopDiscord() {
        doThrow(RuntimeException("slack error")).whenever(slackRepository).postToSlack(any(), any())
        transactionTemplate.executeWithoutResult {
            service.notifyAfterCommit(10, "重複検出")
        }
        verify(discordRepository).post(10, "重複検出")
    }
}
