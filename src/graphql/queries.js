/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUsers = /* GraphQL */ `
  query GetUsers($id: ID!) {
    getUsers(id: $id) {
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
export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUsersFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        leagues
        followedLeagues
        pendingLeagues
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getLeague = /* GraphQL */ `
  query GetLeague($id: ID!) {
    getLeague(id: $id) {
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
export const listLeagues = /* GraphQL */ `
  query ListLeagues(
    $filter: ModelLeagueFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLeagues(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getPlayer = /* GraphQL */ `
  query GetPlayer($id: ID!) {
    getPlayer(id: $id) {
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
export const listPlayers = /* GraphQL */ `
  query ListPlayers(
    $filter: ModelPlayerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPlayers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        leagueId
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
      nextToken
      __typename
    }
  }
`;
export const playersByLeagueId = /* GraphQL */ `
  query PlayersByLeagueId(
    $leagueId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelPlayerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    playersByLeagueId(
      leagueId: $leagueId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        leagueId
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
      nextToken
      __typename
    }
  }
`;
