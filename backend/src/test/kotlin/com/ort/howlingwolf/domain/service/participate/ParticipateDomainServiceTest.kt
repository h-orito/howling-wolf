package com.ort.howlingwolf.domain.service.participate

import com.ort.howlingwolf.domain.model.player.Player
import com.ort.howlingwolf.domain.model.village.blacklist.BlacklistPlayers
import com.ort.howlingwolf.domain.model.village.Village
import com.ort.howlingwolf.domain.model.village.participant.VillageParticipant
import com.ort.howlingwolf.domain.model.village.participant.VillageParticipants
import com.ort.howlingwolf.fw.exception.HowlingWolfBusinessException
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.RETURNS_DEEP_STUBS
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`

class ParticipateDomainServiceTest {
    private val service = ParticipateDomainService()
    private val player = Player(
        id = 1,
        nickname = "player",
        twitterUserName = null,
        otherSiteName = null,
        introduction = null,
        isRestrictedParticipation = false,
        introducedPlayerIds = listOf(2)
    )

    private fun participant(playerId: Int): VillageParticipant {
        val p = mock(VillageParticipant::class.java)
        `when`(p.playerId).thenReturn(playerId)
        return p
    }

    private fun village(
        participantPlayerIds: List<Int> = listOf(3),
        spectatorPlayerIds: List<Int> = emptyList(),
        isAvailable: Boolean = true,
        isAlreadyParticipateCharacter: Boolean = false
    ): Village {
        val participants = VillageParticipants(participantPlayerIds.size, participantPlayerIds.map { participant(it) })
        val spectators = VillageParticipants(spectatorPlayerIds.size, spectatorPlayerIds.map { participant(it) })
        val village = mock(Village::class.java, RETURNS_DEEP_STUBS)
        `when`(village.participant).thenReturn(participants)
        `when`(village.spectator).thenReturn(spectators)
        `when`(village.isAvailableParticipate()).thenReturn(isAvailable)
        `when`(village.isAvailableSpectate(20)).thenReturn(isAvailable)
        `when`(village.isAlreadyParticipateCharacter(5)).thenReturn(isAlreadyParticipateCharacter)
        `when`(village.setting.rules.forBeginner).thenReturn(false)
        `when`(village.blacklistPlayers).thenReturn(BlacklistPlayers(emptyList()))
        return village
    }

    private fun assertCapacity(village: Village, isSpectate: Boolean = false) =
        service.assertParticipateCapacity(player, village, 5, isSpectate, 20)

    @Test
    @DisplayName("空きがあり、未参加で、キャラが重複していなければ参加・見学できる")
    fun available() {
        assertDoesNotThrow { assertCapacity(village()) }
        assertDoesNotThrow { assertCapacity(village(), isSpectate = true) }
    }

    @Test
    @DisplayName("既に参加・見学しているプレイヤーは参加できない")
    fun alreadyParticipating() {
        assertThrows<HowlingWolfBusinessException> { assertCapacity(village(participantPlayerIds = listOf(3, 1))) }
        assertThrows<HowlingWolfBusinessException> { assertCapacity(village(spectatorPlayerIds = listOf(1)), isSpectate = true) }
    }

    @Test
    @DisplayName("定員に達していれば参加・見学できない")
    fun full() {
        assertThrows<HowlingWolfBusinessException> { assertCapacity(village(isAvailable = false)) }
        assertThrows<HowlingWolfBusinessException> { assertCapacity(village(isAvailable = false), isSpectate = true) }
    }

    @Test
    @DisplayName("既に使われているキャラでは参加できない")
    fun duplicatedCharacter() {
        assertThrows<HowlingWolfBusinessException> { assertCapacity(village(isAlreadyParticipateCharacter = true)) }
    }
}
