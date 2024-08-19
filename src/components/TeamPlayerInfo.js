import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import "../styles.css"; // CSS 파일을 import
const TeamPlayerInfo = ({ teamName }) => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const response = await fetch(process.env.PUBLIC_URL + '/team_player_stats.csv');

                const text = await response.text();  // response.body 대신 text() 사용

                Papa.parse(text, {
                    header: true,
                    complete: (results) => {
                        const teamPlayers = results.data.filter(player => player.팀명.toUpperCase() === teamName.toUpperCase());
                        setPlayers(teamPlayers);
                        setLoading(false);
                    }
                });
            } catch (error) {
                console.error("Failed to fetch players:", error);
                setLoading(false);
            }
        };

        if (teamName) {  // 팀 이름이 유효할 때만 fetch 실행
            fetchPlayers();
        }else {
            setLoading(false); // 팀 이름이 없을 때 로딩 상태 해제
        }
    }, [teamName]);  // teamName이 변경될 때마다 실행

    if (loading) {
        return <div>선수 정보 로딩중...</div>;
    }
    if (players.length === 0) {
        return <div>해당 팀의 선수 정보가 없습니다.</div>;
    }
    return (
        <div class="scroll" style={{ flex: 1, overflowX: 'hidden', maxHeight: '300px' }}>
            <h3 class="white-text centered-title">{teamName} 선수 정보</h3>
            <div className="team-info-container">
                <table className="team-info-table">
                    <thead>
                        <tr>
                            <th>선수명</th>
                            <th>AVG</th>
                            <th>Games</th>
                            <th>PA</th>
                            <th>AB</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player, index) => (
                            <tr key={index}>
                                <td>{player.선수명}</td>
                                <td>{player.AVG}</td>
                                <td>{player.G}</td>
                                <td>{player.PA}</td>
                                <td>{player.AB}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamPlayerInfo;