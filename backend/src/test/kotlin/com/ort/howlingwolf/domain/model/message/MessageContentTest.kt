package com.ort.howlingwolf.domain.model.message

import com.ort.dbflute.allcommon.CDef
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

class MessageContentTest {
    private fun textOf(text: String): String =
        MessageContent.invoke(CDef.MessageType.通常発言.code(), text, CDef.FaceType.通常.code()).text

    // 変更前の実装 (1 文字ごとに正規表現で判定)
    private fun legacyRemoveSurrogate(text: String): String =
        text.chunked(1).filter { c -> !c.matches("[\\uD800-\\uDFFF]".toRegex()) }.joinToString(separator = "")

    @Test
    @DisplayName("絵文字など 4 バイト文字を取り除く")
    fun removesSurrogatePairs() {
        assertEquals("おはようございます", textOf("おは😀よう🐺ございます"))
    }

    @Test
    @DisplayName("変更前の実装と同じ結果になる")
    fun sameAsLegacy() {
        listOf(
            "",
            "通常の発言です。\n改行もあります",
            "🐺🐺🐺",
            "𠮷野家と𩸽",
            "a\uD800b\uDC00c", // 対になっていないサロゲート
            ">>1 >>*2 アンカー付き",
        ).forEach { assertEquals(legacyRemoveSurrogate(it.trim()), textOf(it)) }
    }
}
