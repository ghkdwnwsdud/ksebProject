import torch
import cv2
import numpy as np
import asyncio
import websockets
import yt_dlp as youtube_dl
import sys
import os
import pathlib
from pathlib import Path
from torchvision import transforms
from threading import Thread
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import datetime
import re
import pandas as pd

pathlib.PosixPath = pathlib.WindowsPath

sys.path.append(os.path.join(os.path.dirname(__file__), 'yolov5'))

from models.common import DetectMultiBackend
from utils.general import non_max_suppression, scale_boxes

weights_path = Path(r'D:\project_kseb\backend\best_detecting_ball.pt')
device = torch.device('cpu')

model = DetectMultiBackend(str(weights_path), device=device)

def preprocess_image(image, size=512):
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((size, size)),
        transforms.ToTensor()
    ])
    return transform(image).unsqueeze(0)

youtube_url = None
player_info_cache = {}

app = Flask(__name__)
CORS(app)

teams = ["KIA", "LG", "삼성", "두산", "SSG", "NC", "KT", "롯데", "한화", "키움"]

@app.route('/set_url', methods=['POST'])
def set_url():
    global youtube_url
    data = request.json
    youtube_url = data['url']
    print(f"Received URL: {youtube_url}")

    ydl_opts = {
        'quiet': True,
        'force_generic_extractor': True,
    }
    
    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        try:
            info_dict = ydl.extract_info(youtube_url, download=False)
            title = info_dict.get('title', None)
            print(f"Video title: {title}")
        except Exception as e:
            print(f"Failed to extract video info: {e}")
            return jsonify({'status': 'Invalid URL', 'error': 'Failed to extract video info'})

    # 영상 제목에서 팀 정보 추출
    match = re.search(r'(KIA|LG|삼성|두산|SSG|NC|KT|롯데|한화|키움).*(KIA|LG|삼성|두산|SSG|NC|KT|롯데|한화|키움)', title, re.IGNORECASE)
    if match:
        team1 = match.group(1).upper()
        team2 = match.group(2).upper()
        print(f"Extracted teams: {team1} vs {team2}")
        return jsonify({'status': 'URL set', 'team1': team1, 'team2': team2})
    else:
        print("Invalid URL format")
        return jsonify({'status': 'Invalid URL', 'error': 'Teams not found in video title'})

@app.route('/api/player-stats', methods=['GET'])
def get_team_players():
    team1 = request.args.get('team1')
    team2 = request.args.get('team2')
    print(f"Fetching player stats for teams: {team1}, {team2}")

    # 선수 정보 CSV 파일 읽기
    try:
        df = pd.read_csv('team_player_stats.csv', encoding='utf-8-sig')
    except FileNotFoundError:
        print("CSV file not found")
        return jsonify({'status': 'error', 'message': 'CSV file not found'}), 500
    
    # 두 팀에 대한 선수 정보 필터링
    team1_data = df[df['팀명'] == team1].to_dict(orient='records')
    team2_data = df[df['팀명'] == team2].to_dict(orient='records')

    return jsonify({team1: team1_data, team2: team2_data})

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

def get_youtube_stream_url(youtube_url):
    ydl_opts = {'format': 'best'}
    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(youtube_url, download=False)
        formats = info_dict.get('formats', [info_dict])
        for f in formats:
            if f.get('vcodec') != 'none' and f.get('acodec') != 'none':
                return f['url']
    return None

async def video_stream(websocket, path):
    global youtube_url
    frame_counter = 0
    while youtube_url is None:
        await asyncio.sleep(1)

    stream_url = get_youtube_stream_url(youtube_url)
    if not stream_url:
        print("Failed to get stream URL")
        return

    cap = cv2.VideoCapture(stream_url)
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_counter += 1
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        await websocket.send(frame_bytes)

        if frame_counter % 10 == 0:
            img = preprocess_image(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).to(device)
            results = model(img, augment=False, visualize=False)
            results = non_max_suppression(results, conf_thres=0.25, iou_thres=0.45)
            classes = []
            for det in results:
                if len(det):
                    det[:, :4] = scale_boxes(img.shape[2:], det[:, :4], frame.shape).round()
                    for *xyxy, conf, cls in det:
                        label = f'{model.names[int(cls)]} {conf:.2f}'
                        classes.append(label)
            await websocket.send(f'LOG: {str(classes)}')

    cap.release()

if __name__ == '__main__':
    def run_flask():
        app.run(host='0.0.0.0', port=5000)

    flask_thread = Thread(target=run_flask)
    flask_thread.start()

    start_server = websockets.serve(video_stream, 'localhost', 8765)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
