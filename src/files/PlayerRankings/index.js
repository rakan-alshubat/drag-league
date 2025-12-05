import React, { useMemo } from "react";
import calculatePoints from "../../helpers/calculatePoints";
import { BarChart } from "@mui/x-charts/BarChart";
import {
    everyoneZeroMessage,
    customLabelRow,
    customLabelItem,
    customLabelText
} from "./PlayerRankings.styles";

export default function PlayerRankings(props) {

    const data = useMemo(() => {
        const players = props.playersData || [];   
        const gameData = props.leagueData || {};

        return players.map((p) => ({
            id: p.id || p.playerId || p.name,
            name: p.plName || "",
            points: calculatePoints(p, gameData) || 0,
        }));
    }, [props.players, props.gameData]);

    const allPointsAreZero = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) return true;
        return data.every(d => Number(d.points || 0) === 0);
    }, [data]);

    const isEveryoneZero = allPointsAreZero;

    const podiumData = useMemo(() => {
        const sorted = [...data].sort((a, b) => b.points - a.points);

        const joinNames = (names = []) => {
            if (!names || names.length === 0) return "";
            if (names.length === 1) return names[0];
            if (names.length === 2) return `${names[0]} & ${names[1]}`;
            return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
        };

        const uniquePoints = Array.from(new Set(sorted.map((p) => p.points)));
        const topPointVals = uniquePoints.slice(0, 3);

        const groups = topPointVals.map((pts) => sorted.filter((p) => p.points === pts));

        while (groups.length < 3) groups.push([]);

        const orderedGroups = [groups[2] || [], groups[0] || [], groups[1] || []];

        return orderedGroups.map((group, idx) => {
            const names = group.map((p) => p.name);
            const ids = group.map((p) => p.id).join("-");
            const points = group.length > 0 ? group[0].points : 0;
            const full = joinNames(names);
            return {
                playerFullName: full || "",
                playerDisplay: full || "",
                totalPoints: points,
                id: ids || `empty-${idx}`,
            };
        });
    }, [data]);

    const bottomPlayers = useMemo(() => {
        const sorted = [...data].sort((a, b) => b.points - a.points);
        const rest = sorted.slice(3);
        return rest.map((p) => ({
            playerName: p.name,          // used by yAxis dataKey in horizontal chart
            playerFullName: p.name,      // full name available for tooltip / title
            totalPoints: p.points,
            id: p.id,
        }));
    }, [data]);

    const bottomPlayersChartHeight = Math.max(160, Math.min(360, bottomPlayers.length * 48));

    return (
        <div>
            {isEveryoneZero && (
                <div style={everyoneZeroMessage}>
                    All players currently have zero points. Rankings will be available once points are earned.
                </div>
            )}
            {!isEveryoneZero && (
                <div>
                    <BarChart
                        dataset={podiumData}
                        xAxis={[
                            {
                                scaleType: "band",
                                dataKey: "playerFullName",
                                tickFontSize: 24,
                                colorMap: {
                                    type: "ordinal",
                                    colors: ["#CD7F32", "#FFD700", "#C0C0C0"],
                                }
                            },
                        ]}
                        yAxis={[{
                            label: 'RuPeter Badges',
                            disableLine: true,
                            disableTicks: true,
                            labelFontSize: 34
                        }]}
                        series={[{ dataKey: "totalPoints" }]}
                        barLabel="value"
                        borderRadius={19}
                        height={500}
                        sx={{
                            "& .MuiChartsAxis-left .MuiChartsAxis-tickLabel": { display: 'none' },
                            "& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel": { display: "none" },
                            "& .MuiCharts-root": { paddingBottom: 6 },
                            "& .MuiChartsBar-barLabel": { fontWeight: 700, fontSize: 13, fill: "#111" },
                            "& .MuiChartsAxis-tickContainer .MuiChartsAxis-tickLabel": {},
                            "& .MuiChartsAxis-bottom .MuiChartsAxis-line": {
                                stroke:"#0000FF",
                                strokeWidth:0.4
                            },
                            "& .MuiChartsAxis-left .MuiChartsAxis-line": {
                                stroke:"#00000FF",
                                strokeWidth:0.4
                            },
                        }}
                    />
                    <div style={customLabelRow}>
                        {podiumData.map((d) => (
                            <div key={d.id} style={customLabelItem} title={d.playerFullName}>
                                <div style={customLabelText}>{d.playerDisplay}</div>
                            </div>
                        ))}
                    </div>
                    <BarChart
                        dataset={bottomPlayers}
                        layout="horizontal"
                        margin={{ left: 150 }}  // Add this line for more space
                        yAxis={[{
                            scaleType: 'band', 
                            dataKey: 'playerName',
                            tickLabelStyle: {
                                angle: 0,  // Change from -50 to 0
                                fontSize: 14,
                                textAnchor: 'end',
                            },
                        }]}
                        series={[{ dataKey: 'totalPoints' }]}
                        barLabel={(v)=> `${v.value}`}
                        height={bottomPlayersChartHeight}
                        sx={{
                            //change left yAxis label styles
                            "& .MuiChartsAxis-left .MuiChartsAxis-tickLabel":{
                                transform: 'translateX(-10px)',  // Add this line
                                whiteSpace: 'normal',  // Add this line
                                wordWrap: 'break-word',  // Add this line
                                maxWidth: '140px',  // Add this line
                            },
                            // ...rest of your sx props
                        }}
                    />
                </div>
            )}
        </div>
    );
}