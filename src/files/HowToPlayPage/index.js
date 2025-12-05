import { useRouter } from 'next/router';
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
    StepList,
    HighlightBox,
    HighlightText,
    ExampleBox,
    ExampleTitle,
    ExampleText,
    CTASection,
    CTATitle,
    CTAButton
} from './HowToPlayPage.styles';

export default function HowToPlayPage() {
    const router = useRouter();

    return (
        <PageContainer>
            <PageTitle>How to Play</PageTitle>
            <PageSubtitle>
                Your complete guide to creating and competing in Drag League fantasy competitions
            </PageSubtitle>

            <StepSection>
                <StepHeader>
                    <StepNumber>1</StepNumber>
                    <StepTitle>Create or Join a League</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        Start by creating your own league or accepting an invitation to join an existing one. 
                        As a league creator, you&apos;ll set up all the rules and settings.
                    </StepDescription>
                    <StepList>
                        <li><strong>Create a League:</strong> Click &ldquo;Create League&rdquo; and fill in the details</li>
                        <li><strong>Set the Number of Queens:</strong> Choose how many contestants are competing</li>
                        <li><strong>Configure Scoring:</strong> Assign point values for each elimination placement</li>
                        <li><strong>Add Bonus Categories:</strong> Optional special predictions for extra points</li>
                        <li><strong>Set Deadlines:</strong> When players must submit their initial rankings and weekly picks</li>
                    </StepList>
                    <HighlightBox>
                        <HighlightText>
                            💡 Tip: Make sure to set your league deadline before the season starts so everyone has time to submit their predictions!
                        </HighlightText>
                    </HighlightBox>
                </StepContent>
            </StepSection>

            <StepSection>
                <StepHeader>
                    <StepNumber>2</StepNumber>
                    <StepTitle>Invite Your Friends</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        Once your league is created, invite friends to compete against you. They&apos;ll receive an email invitation with instructions to join.
                    </StepDescription>
                    <StepList>
                        <li>Go to your league page and click &ldquo;Invite Player&rdquo;</li>
                        <li>Enter their name and email address</li>
                        <li>They&apos;ll receive an invitation email with a link to join</li>
                        <li>New players will need to create an account before joining</li>
                    </StepList>
                </StepContent>
            </StepSection>

            <StepSection>
                <StepHeader>
                    <StepNumber>3</StepNumber>
                    <StepTitle>Submit Your Rankings</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        This is where the strategy comes in! Predict the elimination order of all the queens, from first eliminated to winner.
                    </StepDescription>
                    <StepList>
                        <li><strong>Drag and Drop:</strong> Arrange queens in the order you think they&apos;ll be eliminated</li>
                        <li><strong>First Position = First Out:</strong> The queen at the top will be eliminated first</li>
                        <li><strong>Last Position = Winner:</strong> The queen at the bottom wins the season</li>
                        <li><strong>Set Your Display Name:</strong> Choose how you appear in the league</li>
                        <li><strong>Submit Before Deadline:</strong> Rankings lock when the deadline passes</li>
                    </StepList>
                    <ExampleBox>
                        <ExampleTitle>Scoring Example:</ExampleTitle>
                        <ExampleText>
                            If you predict a queen will be eliminated 5th and they actually place 5th, you earn the points assigned to the 5th position (e.g., 5 points). The more accurate your predictions, the higher your score!
                        </ExampleText>
                    </ExampleBox>
                    <HighlightBox>
                        <HighlightText>
                            🎯 Strategy: Consider each queen&apos;s strengths, track record, and edit style when making your predictions!
                        </HighlightText>
                    </HighlightBox>
                </StepContent>
            </StepSection>

            <StepSection>
                <StepHeader>
                    <StepNumber>4</StepNumber>
                    <StepTitle>Make Weekly Predictions (Optional)</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        Throughout the season, predict which queen will win each week&apos;s main challenge. This doesn&apos;t affect your main score but adds extra competition!
                    </StepDescription>
                    <StepList>
                        <li>Submit your weekly winner prediction before each episode</li>
                        <li>The deadline automatically resets each week</li>
                        <li>Track your prediction accuracy throughout the season</li>
                        <li>See who has the best weekly prediction record</li>
                    </StepList>
                </StepContent>
            </StepSection>

            <StepSection>
                <StepHeader>
                    <StepNumber>5</StepNumber>
                    <StepTitle>Track Scores & Compete</StepTitle>
                </StepHeader>
                <StepContent>
                    <StepDescription>
                        As the season progresses and episodes air, the league admin updates the results. Watch your score grow as your predictions come true!
                    </StepDescription>
                    <StepList>
                        <li><strong>Player Rankings Tab:</strong> See the leaderboard and everyone&apos;s current scores</li>
                        <li><strong>Player Submissions Tab:</strong> View everyone&apos;s predictions and weekly picks</li>
                        <li><strong>Season Info Tab:</strong> Track which queens have been eliminated and who won challenges</li>
                        <li><strong>Real-time Updates:</strong> Scores update automatically as results are entered</li>
                    </StepList>
                    <HighlightBox>
                        <HighlightText>
                            🏆 The player with the most points at the end of the season wins the league!
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
                        League creators can add special bonus categories for additional points. These are predictions about specific season outcomes.
                    </StepDescription>
                    <StepList>
                        <li><strong>Queen-Based:</strong> Predict Miss Congeniality, who lip syncs the most, etc.</li>
                        <li><strong>Number-Based:</strong> How many queens will compete, challenge count, etc.</li>
                        <li><strong>Yes/No Questions:</strong> Will there be a double elimination? Returning queen?</li>
                    </StepList>
                    <ExampleBox>
                        <ExampleTitle>Bonus Category Examples:</ExampleTitle>
                        <ExampleText>
                            &ldquo;Who will win Miss Congeniality?&rdquo; (3 points) • &ldquo;How many queens will lip sync more than once?&rdquo; (5 points) • &ldquo;Will there be a double shantay?&rdquo; (2 points)
                        </ExampleText>
                    </ExampleBox>
                </StepContent>
            </StepSection>

            <CTASection>
                <CTATitle>Ready to Start?</CTATitle>
                <StepDescription style={{ color: 'white', marginBottom: '20px' }}>
                    Create your first league and start competing with friends today!
                </StepDescription>
                <CTAButton 
                    variant="contained"
                    size="large"
                    onClick={() => router.push('/CreateLeague')}
                >
                    Create a League
                </CTAButton>
            </CTASection>
        </PageContainer>
    );
}
