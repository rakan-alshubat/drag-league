import { useRouter } from "next/router";
import {
    PageContainer,
    PageTitle,
    PageSubtitle,
    StepSection,
    StepHeader,
    StepNumber,
    StepTitle,
    StepContent,
    StepDescription,
    StepDescriptionWithMargin,
    CTADescription,
    StepList,
    ExampleBox,
    ExampleTitle,
    ExampleText,
    HighlightBox,
    HighlightText,
    CTASection,
    CTATitle,
    CTAButton,
    SectionDivider,
    AdminBadge,
    FeatureGrid,
    FeatureCard,
    FeatureIcon,
    InfoBanner,
    DemoBox,
    DemoBigBox
} from "./HowToPlayPage.styles";
import Link from "next/link";

export default function HowToPlayPage() {
    const router = useRouter();

    return (
        <PageContainer>
            <PageTitle>How to Play</PageTitle>

            <PageSubtitle>
                Welcome to Drag Race Fantasy League! This is your complete guide to creating a league, managing your predictions, and competing with friends. Whether you&apos;re a league admin or a player, here&apos;s everything you need to know:
            </PageSubtitle>


            <HighlightBox sx={{ mb: 3, mt: -4 }}>
                <HighlightText sx={{ textAlign: 'center' }}>
                🎭 Want to see how it works?<br />
                    Try the <Link href="/Demo" style={{ fontWeight: 700, textDecoration: 'underline' }}>interactive demo league</Link> to explore and see how a season runs - No signup required!
                </HighlightText>
            </HighlightBox>

            <StepSection>
                <StepHeader>
                    <StepNumber>1</StepNumber>
                    <StepTitle>Create or Join a League</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        Start by creating your own league or accepting an invitation to join an existing one.<br/> 
                        As a league creator, you&apos;ll set up all the rules and settings, and fill in the details for whichever Drag Race franchise you&apos;re watching.<br/>
                        As a league player, lookout for an invitation from the admin to join their league.
                    </StepDescription>
                    <HighlightBox>
                        <HighlightText>
                            💡 Tip: Explore the settings with your friends and choose which optional rules sound fun.
                        </HighlightText>
                    </HighlightBox>
                </StepContent>
            </StepSection>

            <StepSection>
                <StepHeader>
                    <StepNumber>2</StepNumber>
                    <StepTitle>Submit Your Rankings</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        This is where strategy comes in! Predict the elimination order of all the queens, from first eliminated to winner. The closer your guess, the more points you rack up. Get it exactly right and you earn maximum points<br/><br/>
                        <strong>The formula is simple:</strong> Total number of queens minus the difference between your guess and where they actually placed. Here&apos;s how the scoring works:<br />
                    </StepDescription>

                    <StepList>
                        <li><strong>Exact Match:</strong> Full points! If there are 14 queens and you predict a queen&apos;s exact position, you earn 14 points.</li>
                        <li><strong>Close Match:</strong> Each position off you lose a point. Predict 5th but they place 7th? That&apos;s 2 positions off, so 14 - 2 = 12 points.</li>
                        <li><strong>Ties:</strong> When multiple queens are eliminated together, they all get the same ranking.</li>
                    </StepList>

                    <StepDescription>
                        The admin will have a deadline for when rankings must be submitted. You can update your rankings as many times as you want before the deadline, so feel free to adjust your strategy as you see fit!
                    </StepDescription>
                    
                    <HighlightBox>
                        <HighlightText>
                            💡 Tip: Start the league and set the ranking deadline after the first episode to get a better impression of all the Queens.
                        </HighlightText>
                    </HighlightBox>
                </StepContent>
            </StepSection>

            <StepSection>
                <StepHeader>
                    <StepNumber>3</StepNumber>
                    <StepTitle>Make Weekly Predictions (Optional)</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        If your league has weekly submission enabled, you can make predictions for each episode&apos;s Maxi challenge winner. These are extra points to your initial rankings!
                    </StepDescription>
                    <StepList>
                        <li>A weekly deadline is set to take submissions for each episode. An hour before it airs? two days earlier before the promo comes out? It&apos;s up to you!</li>
                        <li>While creating the league, you can decide how many points each correct weekly prediction is worth.</li>
                        <li>The recommendation is half the number of Queens in the season, rounded down.</li>
                        <li>This will keep players engaged every week throughout the competition, and can make it more competitive!</li>
                    </StepList>
                </StepContent>
            </StepSection>

            <StepSection>
                <StepHeader>
                    <StepNumber>4</StepNumber>
                    <StepTitle>Using Your Swap (Optional)</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        If your league has swaps enabled, you get ONE chance per season to swap two queens in your rankings. Maybe you underestimated someone or your favorite Queen is flopping. Whatever the reason, you can make one adjustment per season. Use it wisely!
                    </StepDescription>
                    <StepList>
                        <li><strong>When Can I Swap?</strong> Based on league rules: after a certain number of episodes OR when a certain number of queens remain</li>
                        <li><strong>How to Swap?</strong> When making a weekly submission, you&apos;ll see the swap option.</li>
                        <li><strong>What Happens When I Swap?</strong> Your points will automatically adjust based on the new rankings.</li>
                    </StepList>

                    <HighlightBox>
                        <HighlightText>
                            💡 Tip: Wait until the swap deadline nears (we&apos;ll warn you) to choose the Queens. You never know who might surprise you!
                        </HighlightText>
                    </HighlightBox>
                </StepContent>
            </StepSection>

            <StepSection>
                <StepHeader>
                    <StepNumber>5</StepNumber>
                    <StepTitle>Lip Sync Assassin (Optional)</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        If your league has this option enabled, you can predict which queen will be the Lip Sync Assassin of the season. Think you can predict who&apos;s the stunt Queen? Choose how many points a correct predicition is worth.
                    </StepDescription>
                    <StepList>
                        <li>The Lip Sync Assassin is the queen who wins the most Lip Syncs For Your Life (or for the win).</li>
                        <li>Shantay, you both stay? You can have multiple winners per episode.</li>
                        <li>The recommendation is to select the same amount of points as the Maxi Challenge wins.</li>
                    </StepList>

                    <HighlightBox>
                        <HighlightText>
                            💡 Tip: You can also count the LaLaPaRuZa lip syncs in the total number of lip sync wins. (e.g. if a queen wins 3 regular lip syncs and 2 during the LaLaPaRuZa, they have a total of 5 lip sync wins).
                        </HighlightText>
                    </HighlightBox>
                </StepContent>
            </StepSection>

            <StepSection>
                <StepHeader>
                    <StepNumber>6</StepNumber>
                    <StepTitle>Bonus Categories (Advanced)</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        League creators can add optional special bonus categories to score additional points. These are predictions about specific season outcomes and each category can be worth different points.
                    </StepDescription>
                    <StepList>
                        <li><strong>Queen-Based:</strong> Predict Miss Congeniality, Golden Boot, etc.</li>
                        <li><strong>Number-Based:</strong> The Badonkadonk Tank lever number, how many times will Ru cry, etc.</li>
                        <li><strong>Yes/No Questions:</strong> Will there be a double Sashay, double Shantay, etc.</li>
                    </StepList>
                </StepContent>
            </StepSection>

            <SectionDivider />

            <StepSection>
                <StepHeader>
                    <StepNumber>7</StepNumber>
                    <StepTitle>Track Scores &amp; Compete</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        As the season progresses and episodes air, watch your score grow as your predictions come true! The league page has multiple tabs to track everything.
                    </StepDescription>
                    <StepList>
                        <li><strong>Player Rankings Tab:</strong> See the leaderboard with everyone&apos;s current total scores</li>
                        <li><strong>Player Submissions Tab:</strong> View everyone&apos;s queen rankings, weekly picks, and compare strategies</li>
                        <li><strong>Season Info Tab:</strong> Track which queens have been eliminated, challenge winners, lip sync winners, and the current Lip Sync Assassin</li>
                    </StepList>
                    
                    <HighlightBox>
                        <HighlightText>
                            🏆 The player with the most points at the end of the season wins the league!
                        </HighlightText>
                    </HighlightBox>

                    <StepDescriptionWithMargin>
                        <strong>Understanding Your Score Breakdown:</strong>
                    </StepDescriptionWithMargin>
                    <StepList>
                        <li>Points from queen rankings (earned as queens are eliminated)</li>
                        <li>Weekly challenge winner predictions</li>
                        <li>Predicting the Lip Sync Assassin(s)</li>
                        <li>Bonus category points (if enabled, awarded at seasons end)</li>
                    </StepList>
                </StepContent>
            </StepSection>

            <StepSection>
                <StepHeader>
                    <StepNumber>8</StepNumber>
                    <StepTitle>Final Episode &amp; Season Wrap-Up</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        The final episode is here and its time to crown a winner, baby! Admins have extra responsibilities, and players get to see all their scores finalized.
                    </StepDescription>
                    
                    <StepList>
                        <li><strong>Final Rankings:</strong> Admin enters the placements for the top Queens.</li>
                        <li><strong>Lip Sync Assassin:</strong> The queen with the most lip sync wins will automatically be determined.</li>
                        <li><strong>Bonus Category Results:</strong> Admin enters the answers to all bonus categories.</li>
                        <li><strong>Final Scores:</strong> All remaining points are calculated and the winner is revealed!</li>
                    </StepList>

                    <HighlightBox>
                        <HighlightText>
                            👑 Congratulations to the winner! Time to start planning your next league for the upcoming season!
                        </HighlightText>
                    </HighlightBox>
                </StepContent>
            </StepSection>

            <SectionDivider />

            <StepSection>
                <StepHeader>
                    <StepNumber>9</StepNumber>
                    <StepTitle>
                        For Admins: Managing Your League <AdminBadge>ADMIN</AdminBadge>
                    </StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        As a league admin, you have special responsibilities to keep the league running smoothly throughout the season.
                    </StepDescription>
                    
                    <StepList>
                        <li><strong>Manage Players:</strong> Invite new players, accept join requests (public leagues), promote others to admin, or remove players</li>
                        <li><strong>Submit Weekly Results:</strong> After each episode, enter the challenge winner, lip sync winner, and eliminated queen(s)</li>
                        <li><strong>Handle Ties:</strong> If multiple queens are eliminated in one episode (double elimination), enter both names.</li>
                        <li><strong>Edit League Settings:</strong> Toggle privacy settings (public/private) at any time</li>
                        <li><strong>View Pending Submissions:</strong> See who hasn&apos;t submitted their weekly predictions before the deadline</li>
                        <li><strong>Admin Edit Page:</strong> Access advanced editing tools if you need to manually correct data</li>
                    </StepList>

                </StepContent>
            </StepSection>

            <StepSection>
                <StepHeader>
                    <StepNumber>10</StepNumber>
                    <StepTitle>Privacy &amp; League Settings</StepTitle> <AdminBadge>ADMIN</AdminBadge>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        Leagues can be configured with different privacy levels to control who can view and join.
                    </StepDescription>
                    
                    <StepList>
                        <li><strong>Public League:</strong> Anyone can discover your league, view the leaderboard, and request to join. Great for growing your community!</li>
                        <li><strong>Private League (Invite-Only):</strong> Only invited players can join. The league is hidden from public search.</li>
                        <li><strong>Toggle Anytime:</strong> Admins can change privacy settings at any point during the season</li>
                    </StepList>

                </StepContent>
            </StepSection>

            <SectionDivider />

            <StepSection>
                <StepHeader>
                    <StepNumber>11</StepNumber>
                    <StepTitle>Pro Tips &amp; Strategy</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        Want to dominate your league? Here are some advanced strategies:
                    </StepDescription>
                    
                    <StepList>
                        <li><strong>Do Your Research:</strong> Watch MTQ (Meet the Queens) videos, check social media followings, and look at queens&apos; prior work</li>
                        <li><strong>Consider the Format:</strong> All Stars? Regular season? International? Different formats favor different types of queens</li>
                        <li><strong>Save Your Swap:</strong> Wait until the deadline before using your swap. More info = better decisions</li>
                        <li><strong>Weekly Picks:</strong> Acting challenge? The Roast? Choose the Queen that fits the challenge best.</li>
                    </StepList>
                </StepContent>
            </StepSection>

            <CTASection>
                <CTATitle>Ready to Start?</CTATitle>
                <CTADescription>
                    Create your first league and start competing with friends today! May the best drag queen win! 🏆✨
                </CTADescription>
                <CTAButton 
                    variant="contained"
                    size="large"
                    href="/CreateLeague"
                    onClick={() => router.push('/CreateLeague')}
                >
                    Create a League
                </CTAButton>
            </CTASection>
        </PageContainer>
    );
}
