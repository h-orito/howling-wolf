package com.ort.howlingwolf.api.body

import com.ort.howlingwolf.domain.model.message.MessageContent
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class VillageSayBody(
    @field:NotNull(message = "発言内容は必須")
    @field:Size(max = MessageContent.inputLengthMax, message = "発言内容が長すぎます")
    val message: String?,

    @field:NotNull(message = "発言種別は必須")
    val messageType: String?,

    @field:NotNull(message = "表情種別は必須")
    val faceType: String?,

    val targetId: Int?
) {
    constructor() : this(null, null, null, null)
}
