// src/components/KboRank.js
import React, { useState, useEffect } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const KboRank = () => {
    const [rankData, setRankData] = useState([]);
    const [date, setDate] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/api/kbo-rank')
            .then(response => response.json())
            .then(data => {
                setRankData(data.data);
                setDate(data.date);
            })
            .catch(error => console.error('Error fetching KBO rank data:', error));
    }, []);

    return (
        <Paper>
            <Typography variant="h6" style={{ padding: 20 }}>KBO 팀 순위표 ({date})</Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>순위</TableCell>
                        <TableCell>팀명</TableCell>
                        <TableCell>경기</TableCell>
                        <TableCell>승</TableCell>
                        <TableCell>패</TableCell>
                        <TableCell>무</TableCell>
                        <TableCell>승률</TableCell>
                        <TableCell>게임차</TableCell>
                        <TableCell>최근 10경기</TableCell>
                        <TableCell>연속</TableCell>
                        <TableCell>홈</TableCell>
                        <TableCell>방문</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rankData.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell>{row.rank}</TableCell>
                            <TableCell>{row.team}</TableCell>
                            <TableCell>{row.games}</TableCell>
                            <TableCell>{row.win}</TableCell>
                            <TableCell>{row.lose}</TableCell>
                            <TableCell>{row.draw}</TableCell>
                            <TableCell>{row.win_rate}</TableCell>
                            <TableCell>{row.game_behind}</TableCell>
                            <TableCell>{row.recent_10}</TableCell>
                            <TableCell>{row.streak}</TableCell>
                            <TableCell>{row.home}</TableCell>
                            <TableCell>{row.away}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
};

export default KboRank;
