## 	Ball count detection 모델 구현 

득점 상황 (ball, strike, out) 을 판단할 수 있는 모델을 구현하였습니다.

roboflow에서 레이블링한 이미지들을 resize(640X640), augmentation(blur, noise, saturation)을 적용한 2303 장의 이미지들을 yolov5를 이용하여 학습시켰습니다.

최종 수정 : 2024-7-15 (비디오에 적용했을 때 불안정한 면이 있어 보완 필요)

