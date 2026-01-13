/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateUsers = /* GraphQL */ `
  subscription OnCreateUsers($filter: ModelSubscriptionUsersFilterInput) {
    onCreateUsers(filter: $filter) {
      id
      name
      leagues
      followedLeagues
      pendingLeagues
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateUsers = /* GraphQL */ `
  subscription OnUpdateUsers($filter: ModelSubscriptionUsersFilterInput) {
    onUpdateUsers(filter: $filter) {
      id
      name
      leagues
      followedLeagues
      pendingLeagues
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteUsers = /* GraphQL */ `
  subscription OnDeleteUsers($filter: ModelSubscriptionUsersFilterInput) {
    onDeleteUsers(filter: $filter) {
      id
      name
      leagues
      followedLeagues
      pendingLeagues
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateLeague = /* GraphQL */ `
  subscription OnCreateLeague($filter: ModelSubscriptionLeagueFilterInput) {
    onCreateLeague(filter: $filter) {
      id
      lgName
      lgDescription
      lgAdmin
      lgPendingPlayers
      lgFollowers
      lgHistory
      lgQueenNames
      lgPublic
      lgFullyPrivate
      lgChallengePoints
      lgLipSyncPoints
      lgBonusPoints
      lgChallengeWinners
      lgLipSyncWinners
      lgEliminatedPlayers
      lgSwap
      lgSubmissions
      lgDeadline
      lgRankingDeadline
      lgFinished
      lgComments
      lgPlayers {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateLeague = /* GraphQL */ `
  subscription OnUpdateLeague($filter: ModelSubscriptionLeagueFilterInput) {
    onUpdateLeague(filter: $filter) {
      id
      lgName
      lgDescription
      lgAdmin
      lgPendingPlayers
      lgFollowers
      lgHistory
      lgQueenNames
      lgPublic
      lgFullyPrivate
      lgChallengePoints
      lgLipSyncPoints
      lgBonusPoints
      lgChallengeWinners
      lgLipSyncWinners
      lgEliminatedPlayers
      lgSwap
      lgSubmissions
      lgDeadline
      lgRankingDeadline
      lgFinished
      lgComments
      lgPlayers {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteLeague = /* GraphQL */ `
  subscription OnDeleteLeague($filter: ModelSubscriptionLeagueFilterInput) {
    onDeleteLeague(filter: $filter) {
      id
      lgName
      lgDescription
      lgAdmin
      lgPendingPlayers
      lgFollowers
      lgHistory
      lgQueenNames
      lgPublic
      lgFullyPrivate
      lgChallengePoints
      lgLipSyncPoints
      lgBonusPoints
      lgChallengeWinners
      lgLipSyncWinners
      lgEliminatedPlayers
      lgSwap
      lgSubmissions
      lgDeadline
      lgRankingDeadline
      lgFinished
      lgComments
      lgPlayers {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreatePlayer = /* GraphQL */ `
  subscription OnCreatePlayer($filter: ModelSubscriptionPlayerFilterInput) {
    onCreatePlayer(filter: $filter) {
      leagueId
      league {
        id
        lgName
        lgDescription
        lgAdmin
        lgPendingPlayers
        lgFollowers
        lgHistory
        lgQueenNames
        lgPublic
        lgFullyPrivate
        lgChallengePoints
        lgLipSyncPoints
        lgBonusPoints
        lgChallengeWinners
        lgLipSyncWinners
        lgEliminatedPlayers
        lgSwap
        lgSubmissions
        lgDeadline
        lgRankingDeadline
        lgFinished
        lgComments
        createdAt
        updatedAt
        __typename
      }
      plEmail
      plName
      plStatus
      plLipSyncAssassin
      plSwap
      plRankings
      plWinners
      plBonuses
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdatePlayer = /* GraphQL */ `
  subscription OnUpdatePlayer($filter: ModelSubscriptionPlayerFilterInput) {
    onUpdatePlayer(filter: $filter) {
      leagueId
      league {
        id
        lgName
        lgDescription
        lgAdmin
        lgPendingPlayers
        lgFollowers
        lgHistory
        lgQueenNames
        lgPublic
        lgFullyPrivate
        lgChallengePoints
        lgLipSyncPoints
        lgBonusPoints
        lgChallengeWinners
        lgLipSyncWinners
        lgEliminatedPlayers
        lgSwap
        lgSubmissions
        lgDeadline
        lgRankingDeadline
        lgFinished
        lgComments
        createdAt
        updatedAt
        __typename
      }
      plEmail
      plName
      plStatus
      plLipSyncAssassin
      plSwap
      plRankings
      plWinners
      plBonuses
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeletePlayer = /* GraphQL */ `
  subscription OnDeletePlayer($filter: ModelSubscriptionPlayerFilterInput) {
    onDeletePlayer(filter: $filter) {
      leagueId
      league {
        id
        lgName
        lgDescription
        lgAdmin
        lgPendingPlayers
        lgFollowers
        lgHistory
        lgQueenNames
        lgPublic
        lgFullyPrivate
        lgChallengePoints
        lgLipSyncPoints
        lgBonusPoints
        lgChallengeWinners
        lgLipSyncWinners
        lgEliminatedPlayers
        lgSwap
        lgSubmissions
        lgDeadline
        lgRankingDeadline
        lgFinished
        lgComments
        createdAt
        updatedAt
        __typename
      }
      plEmail
      plName
      plStatus
      plLipSyncAssassin
      plSwap
      plRankings
      plWinners
      plBonuses
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
