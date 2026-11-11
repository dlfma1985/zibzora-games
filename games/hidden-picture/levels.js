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
  }
];
