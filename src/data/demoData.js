// Mock data for demo league showcase

export const demoLeagueData = {
    id: "demo-league-001",
    lgName: "RuPaul's Drag Race Season 16 Fantasy League",
    lgDescription: "Join us for an exciting fantasy league where we predict winners, eliminations, and more!",
    lgAdmin: ["admin@demo.com"],
    lgPendingPlayers: [],
    lgFollowers: [],
    lgHistory: [
        "2024-01-01T12:00:00.000Z. League created by Demo Admin",
        "2024-01-05T14:30:00.000Z. Alice Johnson joined the league",
        "2024-01-05T15:00:00.000Z. Bob Smith joined the league",
        "2024-01-06T10:00:00.000Z. Carol Williams joined the league",
        "2024-01-07T09:00:00.000Z. Weekly results: Challenge Winner: Sapphira Cristál, Lip Sync Winner: Dawn, Eliminated: Xunami Muse",
        "2024-01-14T09:00:00.000Z. Weekly results: Challenge Winner: Plane Jane, Lip Sync Winner: Plane Jane, Eliminated: Q",
        "2024-01-21T09:00:00.000Z. Weekly results: Challenge Winner: Nymphia Wind, Lip Sync Winner: Plasma, Eliminated: Dawn",
    ],
    lgQueenNames: [
        "Nymphia Wind",
        "Sapphira Cristál",
        "Plane Jane",
        "Morphine Love Dion",
        "Dawn",
        "Mhi'ya Iman Le'Paige",
        "Plasma",
        "Q",
        "Xunami Muse",
        "Megami",
        "Amanda Tori Meating",
        "Hershii LiqCour-Jeté",
        "Geneva Karr",
        "Mirage",
    ],
    lgPublic: true,
    lgFullyPrivate: false,
    lgChallengePoints: 10,
    lgLipSyncPoints: 2,
    lgBonusPoints: [
        "Miss Congeniality|5|Queens",
        "Total Episodes|3|Number",
        "Snatch Game Winner|4|Queens",
    ],
    lgChallengeWinners: [
        "Sapphira Cristál",
        "Plane Jane",
        "Nymphia Wind",
        "Morphine Love Dion",
        "Sapphira Cristál",
        "Nymphia Wind|Sapphira Cristál",
        "Plane Jane",
    ],
    lgLipSyncWinners: [
        "Dawn",
        "Plane Jane",
        "Plasma",
        "Morphine Love Dion",
        "Nymphia Wind",
        "Sapphira Cristál",
        "Plane Jane",
    ],
    lgEliminatedPlayers: [
        "Xunami Muse",
        "Q",
        "Dawn",
        "Megami",
        "Amanda Tori Meating",
        "Hershii LiqCour-Jeté",
        "Geneva Karr",
    ],
    lgSwap: "1",
    lgSubmissions: [],
    lgDeadline: null, // No active deadline for demo
    lgRankingDeadline: null,
    lgFinished: "active",
    createdAt: "2024-01-01T12:00:00.000Z",
    updatedAt: "2024-01-21T09:00:00.000Z",
    players: [], // Will be populated with demoPlayersData
};

export const demoPlayersData = [
    {
        id: "alice@demo.com",
        leagueId: "demo-league-001",
        plEmail: "alice@demo.com",
        plName: "Alice Johnson",
        plStatus: "Admin",
        plLipSyncAssassin: "Nymphia Wind",
        plRankings: [
            "Nymphia Wind",
            "Sapphira Cristál",
            "Plane Jane",
            "Morphine Love Dion",
            "Mhi'ya Iman Le'Paige",
            "Plasma",
            "Dawn",
            "Q",
            "Xunami Muse",
            "Megami",
            "Amanda Tori Meating",
            "Hershii LiqCour-Jeté",
            "Geneva Karr",
            "Mirage",
        ],
        plWinners: [
            "Sapphira Cristál", // Week 1 - Correct!
            "Plane Jane",       // Week 2 - Correct!
            "Nymphia Wind",     // Week 3 - Correct!
            "Morphine Love Dion", // Week 4 - Correct!
            "Sapphira Cristál", // Week 5 - Correct!
            "Nymphia Wind",     // Week 6 - Correct! (tie)
            "Plane Jane",       // Week 7 - Correct!
        ],
        plSwap: "",
        plBonusPoints: [],
        createdAt: "2024-01-05T14:30:00.000Z",
        updatedAt: "2024-01-21T09:00:00.000Z",
    },
    {
        id: "bob@demo.com",
        leagueId: "demo-league-001",
        plEmail: "bob@demo.com",
        plName: "Bob Smith",
        plStatus: "Player",
        plLipSyncAssassin: "Plane Jane",
        plRankings: [
            "Sapphira Cristál",
            "Nymphia Wind",
            "Plane Jane",
            "Plasma",
            "Morphine Love Dion",
            "Dawn",
            "Mhi'ya Iman Le'Paige",
            "Q",
            "Amanda Tori Meating",
            "Xunami Muse",
            "Megami",
            "Hershii LiqCour-Jeté",
            "Geneva Karr",
            "Mirage",
        ],
        plWinners: [
            "Sapphira Cristál", // Week 1 - Correct!
            "Nymphia Wind",     // Week 2 - Wrong
            "Plasma",           // Week 3 - Wrong
            "Morphine Love Dion", // Week 4 - Correct!
            "Sapphira Cristál", // Week 5 - Correct!
            "Sapphira Cristál", // Week 6 - Correct! (tie)
            "Nymphia Wind",     // Week 7 - Wrong
        ],
        plSwap: "Plasma|Dawn",
        plBonusPoints: [],
        createdAt: "2024-01-05T15:00:00.000Z",
        updatedAt: "2024-01-21T09:00:00.000Z",
    },
    {
        id: "carol@demo.com",
        leagueId: "demo-league-001",
        plEmail: "carol@demo.com",
        plName: "Carol Williams",
        plStatus: "Player",
        plLipSyncAssassin: "Morphine Love Dion",
        plRankings: [
            "Plane Jane",
            "Morphine Love Dion",
            "Nymphia Wind",
            "Sapphira Cristál",
            "Plasma",
            "Mhi'ya Iman Le'Paige",
            "Dawn",
            "Xunami Muse",
            "Q",
            "Megami",
            "Amanda Tori Meating",
            "Geneva Karr",
            "Hershii LiqCour-Jeté",
            "Mirage",
        ],
        plWinners: [
            "Plane Jane",       // Week 1 - Wrong
            "Plane Jane",       // Week 2 - Correct!
            "Nymphia Wind",     // Week 3 - Correct!
            "Plane Jane",       // Week 4 - Wrong
            "Nymphia Wind",     // Week 5 - Wrong
            "Plane Jane",       // Week 6 - Wrong
            "Plane Jane",       // Week 7 - Correct!
        ],
        plSwap: "",
        plBonusPoints: [],
        createdAt: "2024-01-06T10:00:00.000Z",
        updatedAt: "2024-01-21T09:00:00.000Z",
    },
    {
        id: "david@demo.com",
        leagueId: "demo-league-001",
        plEmail: "david@demo.com",
        plName: "David Chen",
        plStatus: "Player",
        plLipSyncAssassin: "Sapphira Cristál",
        plRankings: [
            "Morphine Love Dion",
            "Nymphia Wind",
            "Sapphira Cristál",
            "Plasma",
            "Plane Jane",
            "Mhi'ya Iman Le'Paige",
            "Dawn",
            "Q",
            "Xunami Muse",
            "Amanda Tori Meating",
            "Megami",
            "Hershii LiqCour-Jeté",
            "Geneva Karr",
            "Mirage",
        ],
        plWinners: [
            "Morphine Love Dion", // Week 1 - Wrong
            "Nymphia Wind",       // Week 2 - Wrong
            "Nymphia Wind",       // Week 3 - Correct!
            "Morphine Love Dion", // Week 4 - Correct!
            "Sapphira Cristál",   // Week 5 - Correct!
            "Nymphia Wind",       // Week 6 - Correct! (tie)
            "Morphine Love Dion", // Week 7 - Wrong
        ],
        plSwap: "",
        plBonusPoints: [],
        createdAt: "2024-01-06T11:00:00.000Z",
        updatedAt: "2024-01-21T09:00:00.000Z",
    },
];

// Add players reference to league data
demoLeagueData.players = demoPlayersData;

export const demoUserData = {
    id: "viewer@demo.com",
    name: "Demo Viewer",
    email: "viewer@demo.com",
    leagues: [],
    followedLeagues: [],
    pendingLeagues: [],
};
