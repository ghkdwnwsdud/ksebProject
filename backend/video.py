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

pathlib.PosixPath = pathlib.WindowsPath

# yolov5 디렉토리를 sys.path에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), 'yolov5'))

from models.common import DetectMultiBackend
from utils.general import non_max_suppression, scale_boxes

# YOLOv5 모델 로드
weights_path = Path(r'D:\project_kseb\backend\best_detecting_ball.pt')
device = torch.device('cpu')  # GPU를 사용하려면 'cuda'로 변경

model = DetectMultiBackend(str(weights_path), device=device)

# 이미지 전처리 함수
def preprocess_image(image, size=512):
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((size, size)),
        transforms.ToTensor()
    ])
    return transform(image).unsqueeze(0)

youtube_url = None

app = Flask(__name__)
CORS(app)  # 모든 도메인에서의 요청을 허용하도록 설정

@app.route('/set_url', methods=['POST'])
def set_url():
    global youtube_url
    data = request.json
    youtube_url = data['url']
    return jsonify({'status': 'URL set'})

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
    frame_counter = 0  # 프레임 카운터 초기화
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

        frame_counter += 1  # 프레임 카운터 증가

        # 프레임을 JPEG 형식으로 인코딩
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        # WebSocket으로 프레임 송출
        await websocket.send(frame_bytes)

        # 10프레임에 한 번씩 예측 수행
        if frame_counter % 10 == 0:
            # 이미지를 YOLOv5 모델에 전달하기 전에 전처리
            img = preprocess_image(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).to(device)

            # YOLOv5 모델을 사용하여 예측
            results = model(img, augment=False, visualize=False)
            results = non_max_suppression(results, conf_thres=0.25, iou_thres=0.45)

            # 결과를 원본 이미지 크기에 맞게 스케일 조정
            classes = []
            for det in results:
                if len(det):
                    det[:, :4] = scale_boxes(img.shape[2:], det[:, :4], frame.shape).round()
                    for *xyxy, conf, cls in det:
                        label = f'{model.names[int(cls)]} {conf:.2f}'
                        classes.append(label)

            # 예측 결과 로그를 WebSocket으로 송출
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
