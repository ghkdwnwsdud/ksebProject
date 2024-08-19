import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import "../styles.css"; // CSS 파일을 import

const KboRankings = () => {
    const [rankings, setRankings] = useState([]);
    const [filteredRankings, setFilteredRankings] = useState([]);
    const [currentDate, setCurrentDate] = useState('2024-08-17');
    const [selectedTeam, setSelectedTeam] = useState(null); // 선택된 팀 상태

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/kbo_rankings_2024.csv');
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            const result = await reader.read();
            const csvData = decoder.decode(result.value);

            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    setRankings(results.data);
                },
            });
        };

        fetchData();
    }, []);

    const formatDateToMatchCSV = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    };

    useEffect(() => {
        const formattedDate = formatDateToMatchCSV(currentDate);
        const filtered = rankings.filter(
            (ranking) => ranking.date === formattedDate
        );
        setFilteredRankings(filtered);
    }, [rankings, currentDate]);

    const handlePrevDay = () => {
        const prevDay = new Date(currentDate);
        prevDay.setDate(prevDay.getDate() - 1);
        setCurrentDate(prevDay.toISOString().split('T')[0]);
    };

    const handleNextDay = () => {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setCurrentDate(nextDay.toISOString().split('T')[0]);
    };

    const handleTeamClick = (team) => {
        setSelectedTeam(team);
    };

    return (
        <div>
            <h3 style={{ textAlign: 'center', color: '#FFFFFF' }}>KBO Rankings 2024</h3>
            <div class="centered-title">
                <button onClick={handlePrevDay}>{'<'}</button>
                <span class="white-text">{currentDate}</span>
                <button onClick={handleNextDay}>{'>'}</button>
            </div>
            <table className="kbo-ranking-container">
                <thead>
                    <tr>
                        <th>순위</th>
                        <th>팀명</th>
                        <th>경기</th>
                        <th>승</th>
                        <th>패</th>
                        <th>무</th>
                        <th>승률</th>
                        <th>게임차</th>
                        <th>최근10경기</th>
                        <th>연속</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRankings.length > 0 ? (
                        filteredRankings.map((ranking, index) => (
                            <tr key={index} onClick={() => handleTeamClick(ranking.team)}>
                                <td>{ranking.rank}</td>
                                <td style={{ cursor: 'pointer' }}>{ranking.team}</td>
                                <td>{ranking.games}</td>
                                <td>{ranking.win}</td>
                                <td>{ranking.lose}</td>
                                <td>{ranking.draw}</td>
                                <td>{ranking.win_rate}</td>
                                <td>{ranking.game_behind}</td>
                                <td>{ranking.recent_10}</td>
                                <td>{ranking.streak}</td>

                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td class="white-text" colSpan="12">데이터가 없습니다.</td>
                        </tr>
                    )}
                </tbody>

            </table>


        </div>
    );
};

export default KboRankings;
