# src/backend/scrape_kbo.py
import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify
from flask_cors import CORS
import datetime

app = Flask(__name__)
CORS(app)

@app.route('/api/kbo-rank', methods=['GET'])
def get_kbo_rank():
    url = 'https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx'
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    table = soup.find('table', {'class': 'tData'})
    rows = table.find_all('tr')[1:]

    rank_data = []

    for row in rows:
        columns = row.find_all('td')
        rank = columns[0].text.strip()
        team = columns[1].text.strip()
        games = columns[2].text.strip()
        win = columns[3].text.strip()
        lose = columns[4].text.strip()
        draw = columns[5].text.strip()
        win_rate = columns[6].text.strip()
        game_behind = columns[7].text.strip()
        recent_10 = columns[8].text.strip()
        streak = columns[9].text.strip()
        home = columns[10].text.strip()
        away = columns[11].text.strip()

        rank_data.append({
            'rank': rank,
            'team': team,
            'games': games,
            'win': win,
            'lose': lose,
            'draw': draw,
            'win_rate': win_rate,
            'game_behind': game_behind,
            'recent_10': recent_10,
            'streak': streak,
            'home': home,
            'away': away,
        })

    today = datetime.datetime.now().strftime("%Y-%m-%d")
    return jsonify({'date': today, 'data': rank_data})

if __name__ == '__main__':
    app.run(port=5000)
