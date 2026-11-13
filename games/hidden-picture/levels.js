/* 숨은그림찾기 — scene list.

   Scene image is exactly 1600×900 px.
   Each item: { "name": "숟가락", "x": 0.42, "y": 0.61, "w": 0.06, "h": 0.04 }
   x, y is the top-left of the hit box. w, h are width and height.
   All four are fractions of the image (0 to 1). Origin is the top-left.
   A click counts as found when it lands inside that box.

   A level is { id, title, image, items }.
   image is a path relative to index.html, or "" for the drawn practice scene.
   id is the local best-time key. Keep it unique.
   Measure on the 1600×900 image:
     x = left / 1600, y = top / 900, w = width / 1600, h = height / 900.
   Swapping this practice scene for a real picture is only `image` plus `items`.
   Append another object to add a scene. Same shape, no other code changes.
*/
window.HIDDEN_PICTURE_LEVELS = [
  {
    "id": "01",
    "title": "연습 방",
    "image": "",
    "items": [
      { "name": "모자", "x": 0.06, "y": 0.07, "w": 0.13, "h": 0.11 },
      { "name": "시계", "x": 0.72, "y": 0.08, "w": 0.11, "h": 0.16 },
      { "name": "컵", "x": 0.20, "y": 0.23, "w": 0.09, "h": 0.13 },
      { "name": "책", "x": 0.50, "y": 0.34, "w": 0.14, "h": 0.08 },
      { "name": "열쇠", "x": 0.78, "y": 0.50, "w": 0.12, "h": 0.07 },
      { "name": "우산", "x": 0.03, "y": 0.44, "w": 0.15, "h": 0.24 },
      { "name": "숟가락", "x": 0.42, "y": 0.61, "w": 0.06, "h": 0.04 },
      { "name": "공", "x": 0.62, "y": 0.73, "w": 0.11, "h": 0.16 }
    ]
  },
  {
    "id": "kitchen",
    "title": "부엌",
    "image": "scenes/kitchen.png",
    "items": [
      { "name": "숟가락", "x": 0.286, "y": 0.807, "w": 0.179, "h": 0.076 },
      { "name": "컵", "x": 0.178, "y": 0.578, "w": 0.108, "h": 0.17 },
      { "name": "열쇠", "x": 0.632, "y": 0.77, "w": 0.072, "h": 0.072 },
      { "name": "고양이", "x": 0.308, "y": 0.302, "w": 0.182, "h": 0.154 },
      { "name": "시계", "x": 0.327, "y": 0.016, "w": 0.132, "h": 0.231 },
      { "name": "책", "x": 0.43, "y": 0.648, "w": 0.198, "h": 0.152 },
      { "name": "우산", "x": 0.854, "y": 0.329, "w": 0.092, "h": 0.425 },
      { "name": "공", "x": 0.075, "y": 0.707, "w": 0.098, "h": 0.165 }
    ]
  },
  {
    "id": "bedroom_hard",
    "title": "어질러진 방",
    "image": "scenes/bedroom.png",
    "items": [
      { "name": "시계", "x": 0.267, "y": 0.0, "w": 0.105, "h": 0.211 },
      { "name": "카메라", "x": 0.415, "y": 0.04, "w": 0.08, "h": 0.08 },
      { "name": "공", "x": 0.143, "y": 0.58, "w": 0.069, "h": 0.104 },
      { "name": "우산", "x": 0.673, "y": 0.486, "w": 0.047, "h": 0.205 },
      { "name": "고양이", "x": 0.765, "y": 0.573, "w": 0.145, "h": 0.1 },
      { "name": "책", "x": 0.374, "y": 0.788, "w": 0.194, "h": 0.119 },
      { "name": "컵", "x": 0.628, "y": 0.731, "w": 0.074, "h": 0.12 },
      { "name": "공룡", "x": 0.054, "y": 0.515, "w": 0.09, "h": 0.105 }
    ]
  },
  {
    "id": "antique_shop_expert",
    "title": "골동품 가게",
    "image": "scenes/antique-shop.png",
    "items": [
      { "name": "지구본", "x": 0.095, "y": 0.238, "w": 0.102, "h": 0.207 },
      { "name": "새장", "x": 0.215, "y": 0.094, "w": 0.081, "h": 0.19 },
      { "name": "카메라", "x": 0.393, "y": 0.232, "w": 0.043, "h": 0.057 },
      { "name": "공룡 화석", "x": 0.493, "y": 0.145, "w": 0.112, "h": 0.151 },
      { "name": "축음기", "x": 0.417, "y": 0.318, "w": 0.153, "h": 0.267 },
      { "name": "고양이", "x": 0.091, "y": 0.681, "w": 0.145, "h": 0.127 },
      { "name": "체스 세트", "x": 0.355, "y": 0.766, "w": 0.158, "h": 0.111 },
      { "name": "찻주전자", "x": 0.552, "y": 0.6, "w": 0.072, "h": 0.117 },
      { "name": "회중시계", "x": 0.665, "y": 0.547, "w": 0.061, "h": 0.151 },
      { "name": "우산", "x": 0.881, "y": 0.195, "w": 0.072, "h": 0.485 }
    ]
  },
  {
    "id": "antique_study_expert_02",
    "title": "오래된 골동품 서재",
    "image": "scenes/antique-study.png",
    "items": [
      { "name": "모래시계", "x": 0.187, "y": 0.615, "w": 0.041, "h": 0.14 },
      { "name": "모형 범선", "x": 0.251, "y": 0.39, "w": 0.12, "h": 0.095 },
      { "name": "카메라", "x": 0.527, "y": 0.101, "w": 0.033, "h": 0.05 },
      { "name": "검은 모자", "x": 0.402, "y": 0.257, "w": 0.061, "h": 0.105 },
      { "name": "목마 장식", "x": 0.679, "y": 0.382, "w": 0.044, "h": 0.07 },
      { "name": "고양이", "x": 0.239, "y": 0.681, "w": 0.125, "h": 0.112 },
      { "name": "찻잔", "x": 0.236, "y": 0.814, "w": 0.084, "h": 0.1 },
      { "name": "체스 세트", "x": 0.343, "y": 0.766, "w": 0.212, "h": 0.13 },
      { "name": "축음기", "x": 0.835, "y": 0.4, "w": 0.151, "h": 0.235 },
      { "name": "회중시계", "x": 0.585, "y": 0.911, "w": 0.064, "h": 0.06 }
    ]
  }
];
