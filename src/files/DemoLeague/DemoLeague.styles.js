import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
// Reuse the main Leagues styles to keep Demo visually identical
import {
    Container as LeagueContainer,
    Header as LeagueHeader,
    HeaderTitle as LeagueHeaderTitle,
    HeaderSubtitle as LeagueHeaderSubtitle,
    TabsContainer as LeagueTabsContainer,
    StyledTab as LeagueStyledTab,
    MainContent as LeagueMainContent,
    Panel as LeaguePanel,
    EmptyState as LeagueEmptyState,
} from "../Leagues/Leagues.styles";

export const Container = LeagueContainer;
export const Header = LeagueHeader;
export const HeaderTitle = LeagueHeaderTitle;
export const HeaderSubtitle = LeagueHeaderSubtitle;
export const TabsContainer = LeagueTabsContainer;
export const StyledTab = LeagueStyledTab;
export const MainContent = LeagueMainContent;
export const Panel = LeaguePanel;
export const EmptyState = LeagueEmptyState;

export const DemoBanner = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    borderRadius: 12,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
    border: '2px solid #FFD700',
}));

export const DemoText = styled(Typography)(({ theme }) => ({
    color: '#1a1a1a',
    fontWeight: 700,
    fontSize: '1.1rem',
    textAlign: 'center',
    margin: 0,
}));
