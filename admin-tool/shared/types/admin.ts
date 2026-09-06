// server / app で共有する API レスポンス型

export interface StatusResponse {
  db: { ok: boolean; message: string; target: string }
  firebase: { configured: boolean; message: string }
}

export interface PlayerSummary {
  playerId: number
  uid: string
  nickname: string
  authorityCode: string
  isRestrictedParticipation: boolean
  twitterUserName: string | null
  villageCount: number
  registerDatetime: string
}

export interface PlayersResponse {
  players: PlayerSummary[]
  total: number
  limit: number
}

export interface FirebaseProvider {
  providerId: string
  uid: string
  displayName: string | null
  email: string | null
}

export type FirebaseUserInfo =
  | { status: 'not_configured' }
  | { status: 'not_found' }
  | { status: 'error'; message: string }
  | {
      status: 'found'
      email: string | null
      displayName: string | null
      disabled: boolean
      creationTime: string | null
      lastSignInTime: string | null
      providers: FirebaseProvider[]
    }

export interface ParticipatedVillage {
  villagePlayerId: number
  villageId: number
  villageDisplayName: string
  villageStatusCode: string
  villageStatusName: string
  charaName: string
  skillCode: string | null
  skillName: string | null
  isDead: boolean
  isSpectator: boolean
  isGone: boolean
  registerDatetime: string
}

export interface PlayerDetailResponse {
  player: PlayerSummary & {
    otherSiteName: string | null
    introduction: string | null
    updateDatetime: string
  }
  firebase: FirebaseUserInfo
  villages: ParticipatedVillage[]
}

export interface VillageSummary {
  villageId: number
  villageDisplayName: string
  villageStatusCode: string
  villageStatusName: string
  createPlayerId: number
  createPlayerNickname: string
  participantCount: number
  registerDatetime: string
}

export interface VillagesResponse {
  villages: VillageSummary[]
  total: number
  limit: number
}

export interface AccessInfo {
  villagePlayerAccessInfoId: number
  ipAddress: string
  clientToken: string | null
  registerDatetime: string
  updateDatetime: string
}

export interface VillageParticipant {
  villagePlayerId: number
  playerId: number
  uid: string
  nickname: string
  twitterUserName: string | null
  charaName: string
  skillCode: string | null
  skillName: string | null
  requestSkillCode: string | null
  isDead: boolean
  isSpectator: boolean
  registerDatetime: string
  accessInfos: AccessInfo[]
  /** 同じ IP アドレスを持つ他参加者の village_player_id */
  sameIpParticipantIds: number[]
  /** 同じクライアントトークンを持つ他参加者の village_player_id */
  sameTokenParticipantIds: number[]
}

export interface VillageDetailResponse {
  village: VillageSummary
  participants: VillageParticipant[]
}

export interface UpdateRestrictedParticipationBody {
  isRestrictedParticipation: boolean
}

export interface UpdateRestrictedParticipationResponse {
  playerId: number
  isRestrictedParticipation: boolean
  updateDatetime: string
}
