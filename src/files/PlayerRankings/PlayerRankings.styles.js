import { Accordion, Grid, Typography} from "@mui/material";
import { styled } from "@mui/material/styles";

export const BarChartMainGrid = styled(Grid)(({ theme }) => ({
    marginLeft: '5%',
    width: '90%',
}));
export const BarChartTop3Grid = styled(Grid)(({ theme }) => ({
    marginLeft: '5%',
    width: '90%',
    direction: 'column',
    alignItems:'center',
    justifyContent:'center',
}));
export const Top3Text = styled(Typography)(({ theme }) => ({
    display: 'flex',
    alignItems:'center',
    justifyContent:'center',
    fontSize: theme.spacing(5)
}));
export const WinnerText = styled(Typography)(({ theme }) => ({
    display: 'flex',
    alignItems:'center',
    justifyContent:'center',
    fontSize: theme.spacing(45),
    [theme.breakpoints.down('sm')]: {
        fontSize: theme.spacing(16),
    },
}));
export const BarChartBottomPlayersGrid = styled(Grid)(({ theme }) => ({
    direction: 'column',
    alignItems:'center',
    justifyContent:'center',
    paddingLeft: theme.spacing(3)
}));
export const PlayersAccordionWrapper = styled(Grid)(({ theme }) => ({
    width: '90%',
    padding: theme.spacing(5),
    paddingTop: theme.spacing(2),
    backgroundColor: 'lightgray'
}));
export const InfoAccordionWrapper = styled(Grid)(({ theme }) => ({
    width: '90%',
    marginTop: theme.spacing(20),
    backgroundColor: 'lightgray'
}));
export const PlayersHeader = styled(Typography)(({ theme }) => ({
    fontSize: theme.spacing(6),
    display: 'flex',
    alignItems:'center',
    justifyContent:'center',
    width: '90%',
    [theme.breakpoints.down('sm')]: {
        fontSize: theme.spacing(4),
    },
}));
export const PlayerAccordionMainTitle = styled(Typography)(({ theme }) => ({
    width: '33%',
    fontSize: theme.spacing(3),
}));

export const PlayerAccordionSecondaryTitle = styled(Typography)(({ theme }) => ({
    color: 'GrayText',
    textAlign: 'center',
}));
export const PlayersListMainGrid = styled(Grid)(({ theme }) => ({

}));
export const PlayersRankedQueens = styled(Grid)(({ theme }) => ({
    fontSize: theme.spacing(2.3),
    [theme.breakpoints.down('sm')]: {
        fontSize: theme.spacing(1.7),
    },
}));
export const Playersadditional = styled(Grid)(({ theme }) => ({
    paddingTop: theme.spacing(3)
}));
export const TitleGrid = styled(Grid)(({ theme }) => ({
    width: '50%',
    display: 'flex',
    alignItems:'center',
    justifyContent:'center',
    [theme.breakpoints.down('sm')]: {
        transform: 'rotate(15deg)',
    },
}));
export const NamesTop3Grid = styled(Grid)(({ theme }) => ({
    marginLeft: '5%',
    width: '68%',
    direction: 'column',
    alignItems:'center',
    justifyContent:'center',
    textAlign: 'center',
    fontSize: theme.spacing(5),
    marginBottom: theme.spacing(10),
    [theme.breakpoints.down('sm')]: {
        fontSize: theme.spacing(2),
        width: '90%',
        marginTop: theme.spacing(-5),
    },
}));
export const GameInfoGrid = styled(Grid)(({ theme }) => ({
    width: '90%',
}));
export const GameInfoItems = styled(Grid)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    fontSize: theme.spacing(3.5),
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
        fontSize: theme.spacing(2),
    },
}));
export const PlayerWinnersAccordion = styled(Accordion)(({ theme }) => ({
    marginTop: '10px',
    backgroundColor: '#b8fdfc',
    width: '60%',
    [theme.breakpoints.down('sm')]: {
        width: '100%',
    },
}));
export const PlayerInfoGrid = styled(Grid)(({ theme }) => ({
    width: '90%',
}));
export const PlayerInfoItems = styled(Grid)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    fontSize: theme.spacing(3.5),
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
        fontSize: theme.spacing(1.1),
    },
}));

export const container = {
    padding: 20,
    maxWidth: 960,
    margin: "0 auto",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#222",
    boxSizing: "border-box",
};

export const header = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 };
export const title = { margin: 0, fontSize: 22, fontWeight: 700 };
export const subtitle = { margin: 0, fontSize: 13, color: "#666" };

export const podiumSection = { marginBottom: 18 };
export const podiumInner = { position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-end" };
export const podiumBase = {
    position: "absolute",
    left: "8%",
    right: "8%",
    bottom: 8,
    height: 36,
    borderRadius: 8,
    background: "linear-gradient(180deg,#eceff1,#cfd8dc)",
    boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
    zIndex: 1,
};
export const podiumChartWrap = { width: "100%", minWidth: 320, maxWidth: 720 };

export const customLabelRow = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)", // three podium bars
    gap: 8,
    marginTop: 8,
    padding: "0 6%",
    alignItems: "start", // allow items to grow downward
};

export const customLabelItem = {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start", // top-align so text expands downward
    minHeight: 36,
    padding: "4px 6px",
    boxSizing: "border-box",
};

export const customLabelText = {
    textAlign: "center",
    fontSize: 26,
    lineHeight: "1.2",
    whiteSpace: "normal",       // allow wrapping
    overflowWrap: "anywhere",   // break long words if needed
    wordBreak: "break-word",    // defensive fallback
    width: "100%",
};

export const leaderboardSection = { marginTop: 6 };
export const leaderboardTitle = { fontSize: 16, margin: "6px 0 10px 0" };
export const bottomChartWrap = { height: 220 };

// bottom labels grid - columns based on number of rest items (will auto layout)
export const customLabelRowBottom = (/* dynamic styling not supported here; use defaults */) => ({
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: "1fr",
    gap: 8,
    marginTop: 8,
    padding: "0 6%",
});
export const customLabelItemBottom = {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    minHeight: 36,
};
export const customLabelTextBottom = {
    textAlign: "center",
    fontSize: 12,
    lineHeight: "1.1",
    whiteSpace: "normal",
    wordBreak: "break-word",
};

export const everyoneZeroMessage = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    padding: 16,
    textAlign: 'center'
};