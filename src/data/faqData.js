export const faqData = [
    {
        category: "Getting Started",
        questions: [
            {
                question: "What is Drag League?",
                answer: "Drag League is a fantasy league platform for RuPaul's Drag Race fans (and all its franchises). Create leagues, predict elimination orders, and compete with friends while you rack up points throughout the season!"
            },
            {
                question: "How do I create a league?",
                answer: "Sign up for an account, click 'Create League' from your dashboard, and fill in the league details including the number of queens, scoring rules, and bonus categories."
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
                question: "I want to start a league. How do I become the admin?",
                answer: "Just create a new league! Whoever creates it becomes the admin and gets to customize all the settings. You can also promote other players to admin status if you want to share management duties."
            },
            {
                question: "What are bonus categories?",
                answer: "Bonus categories are special prediction challenges you can add to your league. They can be queen-based (like Miss Congeniality), number-based (like counting how many times something happens), or yes/no questions about the season."
            },
            {
                question: "Can I change league settings after creation?",
                answer: "League admins can modify certain settings like deadlines, point values, names, and privacy options. However, core settings might not be editable once the league has started."
            },
            {
                question: "What are the privacy levels?",
                answer: "Leagues have two privacy levels: Public (anyone can discover and request to join) and Private (invite-only, hidden from search). Admins can toggle privacy settings at any time during the season."
            },
            {
                question: "How do I invite players to my league?",
                answer: "As the league admin, go to your league page and use the 'Invite Player' button. Enter their name and email address, and they'll receive an invitation to join. Make sure you do it before the league starts!"
            },
            {
                question: "What happens when the ranking deadline passes?",
                answer: "When the ranking deadline passes, the league automatically starts! Players who haven't submitted their rankings won't be able to participate."
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
                answer: "Your points = total number of queens minus the difference between your prediction and the actual placement. Example with 10 queens: Predict 8th, they place 8th = 10 points (perfect!). Predict 8th, they place 10th = 8 points (10 - 2). Predict 8th, they place 3rd = 5 points (10 - 5). The closer you are, the more points you get."
            },
            {
                question: "When do I submit my rankings?",
                answer: "You must submit your initial rankings before the league deadline. You can submit before the season starts or after watching an episode and getting a better impression of the queens. The admin can set this deadline when creating the league."
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
                answer: "The Lip Sync Assassin is an optional prediction where you guess which queen will win the most Lip Sync for Your Life during the season. If enabled by your admin, you pick one queen and earn bonus points if they end up with the most lip sync wins. The system automatically tracks and determines the assassin."
            },
            {
                question: "What are swaps and how do they work?",
                answer: "Swaps allow you to switch two queens in your rankings one time per season. This optional feature (set by the admin) helps if a queen performs differently than expected. When you swap, your points automatically recalculate. Swaps can be enabled after a certain number of episodes or when a certain number of queens remain. Watch out: other players will be able to see who you swapped."
            },
            {
                question: "What is the queen swap deadline?",
                answer: "The queen swap deadline is a special date set by the admin when swaps can't be made anymore. It's typically after a certain number of episodes or when a certain number of queens remain. Once the deadline passes, players cannot use their one-time swap feature to adjust their rankings."
            },
            {
                question: "What happens to my points when I swap?",
                answer: "They adjust automatically for all queens who've already been eliminated, and the queens who haven't will count as their new positions once they're gone."
            },
            {
                question: "Can I swap queens who've already been eliminated?",
                answer: "You can swap any two queens you ranked, even if one or both of them has already been eliminated. The system will automatically adjust your points based on your new rankings."
            },
            {
                question: "What if two queens are eliminated in the same episode (like a double elimination)?",
                answer: "Submit both queens as eliminated in the same week. They will both be considered the same position overall. If 7th and 6th are eliminated together, they will both count as a tie for 6th."
            },
            {
                question: "Can the admin change point values mid-season?",
                answer: "League admins can adjust point values for weekly submissions and bonus categories at any time during the season. However, this counts retroactively so positions might change."
            },
        ]
    },
    {
        category: "Weekly Submissions",
        questions: [
            {
                question: "What are weekly submissions?",
                answer: "Each week, you can predict which queen will win the Maxi Challenge. If your league has this enabled, correct predictions earn you extra points on top of your queen elimination rankings. This keeps everyone engaged every week and gives them a chance if the rankings aren't turning out how they hoped. The admin sets the point value for correct weekly predictions."
            },
            {
                question: "How do weekly deadlines work?",
                answer: "The league admin sets a weekly deadline (typically before each episode airs). This deadline will automatically renew to the following week after you submit the results of the previous episode (who won, who was eliminated, etc.). If you set the first one to be a Friday at 5pm, then that's when the deadline will be until the season ends."
            },
            {
                question: "Do weekly submissions affect my score?",
                answer: "Yes! If weekly submissions are enabled in your league, each correct prediction adds points to your total score. The admin determines how many points each correct prediction is worth."
            },
            {
                question: "How does the final episode work?",
                answer: "During the final episode, the admin enters final placements for the top queens. The system automatically determines the Lip Sync Assassin (queen with most lip sync wins) and the admin enters results for all bonus categories. All remaining points are calculated and the league winner is revealed!"
            },
            {
                question: "What if the weekly deadline passes?",
                answer: "If you miss the weekly deadline, you won't be able to submit predictions for that week and it will count as an incorrect prediction. The admin can still enter the results manually if you missed it, but that's up to the admin and other players."
            },
            {
                question: "Can I change my weekly pick after I submit it?",
                answer: "As many times as you want as long as it's before the deadline and your admin hasn't closed submissions yet by entering the results of the episode."
            }
        ]
    },
    {
        category: "Admin Features",
        questions: [
            {
                question: "What is the Admin Edit Page?",
                answer: "The Admin Edit Page is a special tool for league admins to manually correct league data if needed. You can edit player rankings, queen names, eliminated queens, weekly winners, and bonus results. All admin edits are tagged with '[ADMIN EDIT]' in the league history for full transparency. KEEP IN MIND: This tool is very powerful and can result in some wonky outcomes if not used carefully."
            },
            {
                question: "Why are some history entries orange?",
                answer: "Orange entries in the History tab indicate admin edits. When an admin manually changes league data through the Admin Edit Page, those actions are marked with an orange 'ADMIN EDIT' badge so all players can see when and what was modified (I see you changing rankings, cheater!)."
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
                question: "Who do I contact for support?",
                answer: "If you encounter any issues or have questions, please reach out through the contact form on our website or email us directly."
            },
            {
                question: "Technical issues? League data got screwed up? Feature suggestions?",
                answer: "You can reach us on Discord, Reddit, or via email! I'm a solo developer and will try my best to get to any issues as soon as possible. Feature suggestions are always welcome too!"
            },
        ]
    }
];
