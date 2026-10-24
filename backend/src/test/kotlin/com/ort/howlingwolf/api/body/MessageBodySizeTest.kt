package com.ort.howlingwolf.api.body

import com.ort.howlingwolf.domain.model.message.MessageContent
import jakarta.validation.Validation
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

class MessageBodySizeTest {
    private val validator = Validation.buildDefaultValidatorFactory().validator

    private fun say(message: String) = VillageSayBody(message, "NORMAL_SAY", "NORMAL", null)
    private fun participate(message: String) = VillageParticipateBody(1, "VILLAGER", "VILLAGER", message, null, false)

    @Test
    @DisplayName("上限までの発言本文は受け付ける")
    fun withinLimit() {
        val text = "あ".repeat(MessageContent.inputLengthMax)
        assertTrue(validator.validate(say(text)).isEmpty())
        assertTrue(validator.validate(participate(text)).isEmpty())
    }

    @Test
    @DisplayName("上限を超える発言本文は受け付けない")
    fun overLimit() {
        val text = "あ".repeat(MessageContent.inputLengthMax + 1)
        assertEquals(setOf("message"), validator.validate(say(text)).map { it.propertyPath.toString() }.toSet())
        assertEquals(setOf("joinMessage"), validator.validate(participate(text)).map { it.propertyPath.toString() }.toSet())
    }
}
