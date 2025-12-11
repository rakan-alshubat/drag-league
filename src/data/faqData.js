export const faqData = [
    {
        category: "Getting Started",
        questions: [
            {
                question: "What is Drag League?",
                answer: "Drag League is a fantasy league platform for RuPaul's Drag Race fans. Create custom leagues, predict elimination orders, and compete with friends throughout the season!"
            },
            {
                question: "How do I create a league?",
                answer: "Sign up for an account, click 'Create League' from your dashboard, and fill in the league details including the number of queens, scoring rules, and bonus categories. You can then invite friends via email."
            },
            {
                question: "Can I join multiple leagues?",
                answer: "Yes! You can participate in as many leagues as you want. Each league has its own rankings, submissions, and settings."
            },
            {
                question: "Is it free to use?",
                answer: "Yes, Drag League is completely free to use. Create unlimited leagues and invite as many friends as you like!"
            }
        ]
    },
    {
        category: "League Settings",
        questions: [
            {
                question: "What are bonus categories?",
                answer: "Bonus categories are special prediction challenges you can add to your league. They can be queen-based (like Miss Congeniality), number-based (like counting how many times something happens), or yes/no questions about the season."
            },
            {
                question: "Can I change league settings after creation?",
                answer: "League admins can modify certain settings like deadlines and privacy options. However, core settings like the number of queens and scoring rules are locked once the league starts."
            },
            {
                question: "What are the privacy levels?",
                answer: "Leagues have three privacy levels: Public (anyone can discover and request to join), Private (invite-only, hidden from search), and Fully Private (invite-only with hidden rankings from non-members). Admins can toggle privacy settings at any time during the season."
            },
            {
                question: "How do I invite players to my league?",
                answer: "As the league admin, go to your league page and use the 'Invite Player' button. Enter their name and email address, and they'll receive an invitation to join."
            },
            {
                question: "What happens when the ranking deadline passes?",
                answer: "When the ranking deadline passes, the league automatically starts! Players who haven't submitted their rankings won't be able to participate. The system checks deadlines every 60 seconds and automatically transitions the league to active status."
            },
            {
                question: "Can non-members join public leagues?",
                answer: "Yes! If a league is set to Public and hasn't started yet, anyone can request to join. Admins will see these requests in the league management page and can approve or deny them."
            }
        ]
    },
    {
        category: "Scoring & Rankings",
        questions: [
            {
                question: "How does scoring work?",
                answer: "You earn points based on prediction accuracy. The formula is: Total Queens - |Predicted Position - Actual Position|. So if there are 14 queens and you predict a queen's exact elimination position, you get 14 points. Each position off reduces your score by 1."
            },
            {
                question: "When do I submit my rankings?",
                answer: "You must submit your initial rankings before the league deadline (usually before the season starts). The admin can set this deadline when creating the league."
            },
            {
                question: "Can I change my rankings after submitting?",
                answer: "You can update your rankings before the league deadline passes. Once the deadline hits, rankings are locked and the competition begins!"
            },
            {
                question: "What happens if I don't submit by the deadline?",
                answer: "If you miss the deadline, you won't be able to participate in that season's competition. Make sure to submit your predictions in time!"
            },
            {
                question: "What is the Lip Sync Assassin?",
                answer: "The Lip Sync Assassin is an optional prediction where you guess which queen will win the most Lip Syncs For Your Life during the season. If enabled by your admin, you pick one queen and earn bonus points if they end up with the most lip sync wins. The system automatically tracks and determines the assassin."
            },
            {
                question: "What are swaps and how do they work?",
                answer: "Swaps allow you to switch two queens in your rankings ONE time per season. This optional feature (set by admin) helps if a queen performs differently than expected. When you swap, your points automatically recalculate. Swaps can be enabled after a certain number of episodes or when a certain number of queens remain."
            }
        ]
    },
    {
        category: "Weekly Submissions",
        questions: [
            {
                question: "What are weekly submissions?",
                answer: "Each week, you can predict which queen will win the main challenge. If your league has this enabled, correct predictions earn you extra points on top of your queen elimination rankings. The admin sets the point value for correct weekly predictions."
            },
            {
                question: "How do weekly deadlines work?",
                answer: "The league admin sets a weekly deadline (typically before each episode airs). Submit your prediction before the deadline to earn points. The system automatically processes deadlines and advances to the next week."
            },
            {
                question: "Do weekly submissions affect my score?",
                answer: "Yes! If weekly submissions are enabled in your league, each correct prediction adds points to your total score. The admin determines how many points each correct prediction is worth."
            },
            {
                question: "How does the final episode work?",
                answer: "During the final episode, the admin enters final placements for the top queens. The system automatically determines the Lip Sync Assassin (queen with most lip sync wins) and the admin enters results for all bonus categories. All remaining points are calculated and the league winner is revealed!"
            }
        ]
    },
    {
        category: "Admin Features",
        questions: [
            {
                question: "What is the Admin Edit Page?",
                answer: "The Admin Edit Page is a special tool for league admins to manually correct league data if needed. You can edit player rankings, queen names, eliminated queens, weekly winners, and bonus results. All admin edits are tagged with '[ADMIN EDIT]' in the league history for full transparency."
            },
            {
                question: "Why are some history entries orange?",
                answer: "Orange entries in the History tab indicate admin edits. When an admin manually changes league data through the Admin Edit Page, those actions are marked with an orange 'ADMIN EDIT' badge so all players can see when and what was modified."
            },
            {
                question: "What is the admin edit counter?",
                answer: "The admin edit counter appears as an orange warning banner when there have been admin edits since the last weekly submission. It shows how many manual changes have been made, promoting transparency in league management."
            },
            {
                question: "Can I promote another player to admin?",
                answer: "Yes! League admins can promote other players to admin status. This allows multiple people to manage the league, submit weekly results, and handle administrative tasks. There can be multiple admins in a league."
            },
            {
                question: "How do I submit weekly results as an admin?",
                answer: "After each episode airs, use the Submissions popup to enter results. Add the challenge winner, lip sync winner, and eliminated queen(s). For ties (double wins/eliminations), you can enter multiple queens. Scores update automatically for all players once you submit."
            }
        ]
    },
    {
        category: "Technical & Account",
        questions: [
            {
                question: "I forgot my password. How do I reset it?",
                answer: "On the sign-in page, click the 'Forgot password?' link and follow the instructions to reset your password via email."
            },
            {
                question: "Can I change my display name?",
                answer: "Yes! When you join a league, you can set a custom display name that will be shown to other players in that specific league."
            },
            {
                question: "Why can't I see my league updates in real-time?",
                answer: "The app uses real-time GraphQL subscriptions for instant updates. When admins enter results or players make changes, everyone sees updates immediately. If you're experiencing delays, try refreshing the page or checking your internet connection."
            },
            {
                question: "Who do I contact for support?",
                answer: "If you encounter any issues or have questions, please reach out through the contact form on our website or email us directly."
            }
        ]
    }
];
