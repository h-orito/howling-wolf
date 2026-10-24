package com.ort.howlingwolf.api.body

import com.ort.howlingwolf.domain.model.message.MessageContent
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class VillageParticipateBody(
    @field:NotNull(message = "charaIdは必須")
    val charaId: Int?,

    @field:NotNull(message = "firstRequestSkillは必須")
    val firstRequestSkill: String?,

    @field:NotNull(message = "secondRequestSkillは必須")
    val secondRequestSkill: String?,

    @field:NotNull(message = "joinMessageは必須")
    @field:Size(max = MessageContent.inputLengthMax, message = "発言内容が長すぎます")
    val joinMessage: String?,

    val joinPassword: String?,

    val spectator: Boolean?
) {
    constructor() : this(null, null, null, null, null, null) {}
}
