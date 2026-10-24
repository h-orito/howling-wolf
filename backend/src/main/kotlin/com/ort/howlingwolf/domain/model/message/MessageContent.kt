package com.ort.howlingwolf.domain.model.message

import com.ort.dbflute.allcommon.CDef
import com.ort.howlingwolf.fw.exception.HowlingWolfBadRequestException

data class MessageContent(
    val type: MessageType,
    val num: Int?,
    val count: Int?,
    val text: String,
    val faceCode: String?
) {
    companion object {

        const val defaultLengthMax = 400
        const val defaultLineMax: Int = 20

        // 受け付ける発言本文の長さの上限 (UTF-16 単位)。文字数・行数の確認より前に、明らかに長すぎるものを弾く
        // 最大 400 文字・40 行に改行や絵文字 (2 単位) を足しても収まる値にしている
        const val inputLengthMax = 2000

        operator fun invoke(
            messageType: String,
            text: String,
            faceCode: String?
        ): MessageContent {
            val cdefMessageType = checkNotNull(CDef.MessageType.codeOf(messageType))
            return MessageContent(
                type = MessageType(cdefMessageType),
                num = null,
                count = null,
                text = removeSurrogate(text.trim()),
                faceCode = faceCode
            )
        }

        /**
         * 絵文字を除く文字列を返す
         * @param text
         * @return 4byte文字を除いた文字列
         */
        private fun removeSurrogate(text: String): String = text.filterNot { it.isSurrogate() }
    }

    fun assertMessageLength(maxLength: Int = defaultLengthMax, lineMax: Int = defaultLineMax) {
        // 行数
        if (text.replace("\r\n", "\n")
                .split("\n").size > lineMax
        ) throw HowlingWolfBadRequestException("行数オーバーです")
        // 文字数
        if (text.isEmpty()) throw HowlingWolfBadRequestException("発言内容がありません")
        // 改行は文字数としてカウントしない
        val length = text.replace("\r\n", "").replace("\n", "").length
        if (length <= 0) throw HowlingWolfBadRequestException("発言内容がありません") // 改行のみもNG
        if (maxLength < length) throw HowlingWolfBadRequestException("文字数オーバーです")
    }
}