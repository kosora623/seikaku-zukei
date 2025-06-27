// 質問リスト
const questions = [
  "1. 活発で、外向的だと思う",
  "2. 他人に不満をもち、もめごとを起こしやすいと思う",
  "3. しっかりしていて、自分に厳しいと思う",
  "4. 心配性で、うろたえやすいと思う",
  "5. 新しいことが好きで、変わった考えをもつと思う",
  "6. ひかえめで、おとなしいと思う",
  "7. 人に気をつかう、やさしい人間だと思う",
  "8. だらしなく、うっかりしていると思う",
  "9. 冷静で、気分が安定していると思う",
  "10. 発想力に欠けた、平凡な人間だと思う"
];

const table = document.getElementById("questionTable");
questions.forEach((q, i) => {
  const row = document.createElement("tr");
  const td = document.createElement("td");
  td.textContent = q;
  row.appendChild(td);
  for (let j = 1; j <= 7; j++) {
    const tdRadio = document.createElement("td");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `q${i + 1}`;
    input.value = j;
    if (j === 1) input.required = true;
    tdRadio.appendChild(input);
    row.appendChild(tdRadio);
  }
  table.appendChild(row);
});

document.getElementById("tipiForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // 回答の取得とスコア化
  const a = {};
  for (let i = 1; i <= 10; i++) {
    a[`q${i}`] = parseInt(document.querySelector(`input[name="q${i}"]:checked`).value);
  }

  const traits = {
    外向性: (a.q1 + (8 - a.q6)) / 2,
    協調性: ((8 - a.q2) + a.q7) / 2,
    誠実性: (a.q3 + (8 - a.q8)) / 2,
    情緒安定性: ((8 - a.q4) + a.q9) / 2,
    開放性: (a.q5 + (8 - a.q10)) / 2
  };

  drawRadar3D(Object.values(traits), Object.keys(traits));
});

// Three.js描画
let scene, camera, renderer, mesh;

function drawRadar3D(data, labels) {
  const container = document.getElementById("three-container");
  container.innerHTML = "";

  const w = container.clientWidth;
  const h = container.clientHeight;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
  camera.position.set(0, 0, 2);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  container.appendChild(renderer.domElement);

  const group = new THREE.Group();

  // 軸とスコア点の生成
  const radius = 0.7;
  const segments = data.length;
  const angleStep = (2 * Math.PI) / segments;
  const points = [];

  for (let i = 0; i < segments; i++) {
    const angle = i * angleStep;
    const length = (data[i] / 7) * radius;
    const x = Math.cos(angle) * length;
    const y = Math.sin(angle) * length;
    points.push(new THREE.Vector3(x, y, 0));
  }

  // 面（Mesh）
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].y);
  }
  shape.lineTo(points[0].x, points[0].y);

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: 0x3399ff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  const radarMesh = new THREE.Mesh(geometry, material);
  group.add(radarMesh);

  // 外枠（線）
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([...points, points[0]]);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x3366cc, linewidth: 2 });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  group.add(line);

  // 軸の表示
  for (let i = 0; i < segments; i++) {
    const angle = i * angleStep;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, 0)
    ]);
    const axis = new THREE.Line(axisGeo, new THREE.LineDashedMaterial({ color: 0x999999 }));
    group.add(axis);
  }

  scene.add(group);

  // ライト（見やすくする）
  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);

  // 回転アニメーション
  function animate() {
    requestAnimationFrame(animate);
    group.rotation.z += 0.01;
    renderer.render(scene, camera);
  }

  animate();
}
