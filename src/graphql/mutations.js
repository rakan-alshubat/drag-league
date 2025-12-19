/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createUsers = /* GraphQL */ `
  mutation CreateUsers(
    $input: CreateUsersInput!
    $condition: ModelUsersConditionInput
  ) {
    createUsers(input: $input, condition: $condition) {
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
export const updateUsers = /* GraphQL */ `
  mutation UpdateUsers(
    $input: UpdateUsersInput!
    $condition: ModelUsersConditionInput
  ) {
    updateUsers(input: $input, condition: $condition) {
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
export const deleteUsers = /* GraphQL */ `
  mutation DeleteUsers(
    $input: DeleteUsersInput!
    $condition: ModelUsersConditionInput
  ) {
    deleteUsers(input: $input, condition: $condition) {
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
export const createLeague = /* GraphQL */ `
  mutation CreateLeague(
    $input: CreateLeagueInput!
    $condition: ModelLeagueConditionInput
  ) {
    createLeague(input: $input, condition: $condition) {
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
export const updateLeague = /* GraphQL */ `
  mutation UpdateLeague(
    $input: UpdateLeagueInput!
    $condition: ModelLeagueConditionInput
  ) {
    updateLeague(input: $input, condition: $condition) {
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
export const deleteLeague = /* GraphQL */ `
  mutation DeleteLeague(
    $input: DeleteLeagueInput!
    $condition: ModelLeagueConditionInput
  ) {
    deleteLeague(input: $input, condition: $condition) {
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
export const createPlayer = /* GraphQL */ `
  mutation CreatePlayer(
    $input: CreatePlayerInput!
    $condition: ModelPlayerConditionInput
  ) {
    createPlayer(input: $input, condition: $condition) {
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
export const updatePlayer = /* GraphQL */ `
  mutation UpdatePlayer(
    $input: UpdatePlayerInput!
    $condition: ModelPlayerConditionInput
  ) {
    updatePlayer(input: $input, condition: $condition) {
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
export const deletePlayer = /* GraphQL */ `
  mutation DeletePlayer(
    $input: DeletePlayerInput!
    $condition: ModelPlayerConditionInput
  ) {
    deletePlayer(input: $input, condition: $condition) {
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
