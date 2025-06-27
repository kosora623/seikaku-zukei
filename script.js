// script.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const inputSection = document.getElementById('input-section');
    const outputSection = document.getElementById('output-section');
    const nameInput = document.getElementById('name');
    const radioGroups = document.querySelectorAll('.radio-group');
    const generateButton = document.getElementById('generate-button');
    const backButton = document.getElementById('back-button');
    const figureTitle = document.getElementById('figure-title');
    const threeContainer = document.getElementById('three-container');
    const resultDisplay = document.getElementById('result-values');

    // ラジオボタンの動的生成
    function createRadioButtons() {
        radioGroups.forEach(group => {
            const itemNumber = group.getAttribute('data-item');
            for (let i = 1; i <= 7; i++) {
                const label = document.createElement('label');
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = `item-${itemNumber}`;
                input.value = i;
                input.required = true;
                label.appendChild(input);
                label.appendChild(document.createTextNode(i));
                group.appendChild(label);
            }
        });
    }

    // Three.js シーンの変数
    let scene, camera, renderer, mesh, ambientParticles, controls;

    // Three.js シーンのセットアップ
    function initThreeJS() {
        // threeContainerがまだ存在しない場合は初期化しない
        if (!threeContainer) return;

        // 既存のレンダラーがあれば破棄
        if (renderer) {
            renderer.dispose();
            if (renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
        }
        
        // 新しいレンダラーを作成
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
        threeContainer.appendChild(renderer.domElement);

        // シーン、カメラ、ライトの作成
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff); // 背景色を白に
        camera = new THREE.PerspectiveCamera(75, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
        camera.position.z = 7;

        // OrbitControls (手動回転) の設定
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI / 2;

        // ライトを調整
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1.5);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);
        const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
        pointLight2.position.set(-5, -5, -5);
        scene.add(pointLight2);
        
        // ウィンドウリサイズイベントリスナー
        window.removeEventListener('resize', onWindowResize); // 二重登録を防止
        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {
        if (!threeContainer || !camera || !renderer) return;
        const width = threeContainer.clientWidth;
        const height = threeContainer.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    // TIPI-Jの得点化ロジック
    function calculatePersonalityScores() {
        const scores = {};
        const getScore = (itemNumber) => {
            const input = document.querySelector(`input[name="item-${itemNumber}"]:checked`);
            return input ? parseInt(input.value) : null;
        };

        // 全項目が回答されているかチェック
        for (let i = 1; i <= 10; i++) {
            if (getScore(i) === null) {
                alert('全ての項目に回答してください。');
                return null;
            }
        }

        const item1 = getScore(1); const item2 = getScore(2);
        const item3 = getScore(3); const item4 = getScore(4);
        const item5 = getScore(5); const item6 = getScore(6);
        const item7 = getScore(7); const item8 = getScore(8);
        const item9 = getScore(9); const item10 = getScore(10);

        // 得点化の計算式
        const extroversionScore = (item1 + (8 - item6)) / 2;
        const agreeablenessScore = ((8 - item2) + item7) / 2;
        const conscientiousnessScore = (item3 + (8 - item8)) / 2;
        const neuroticismScore = (item4 + (8 - item9)) / 2;
        const opennessScore = (item5 + (8 - item10)) / 2;
        
        // 0-7のスコアを0-100%に変換
        const scale = 100 / 6;

        scores.extroversion = Math.round((extroversionScore - 1) * scale);
        scores.agreeableness = Math.round((agreeablenessScore - 1) * scale);
        scores.conscientiousness = Math.round((conscientiousnessScore - 1) * scale);
        scores.neuroticism = Math.round((neuroticismScore - 1) * scale);
        scores.openness = Math.round((opennessScore - 1) * scale);
        
        return scores;
    }
    
    // アンケート結果をバーグラフで表示する関数
    function displayResults(scores) {
        resultDisplay.innerHTML = `
            <div class="bar-chart-item">
                <div class="bar-chart-title">外向性</div>
                <div class="bar-container">
                    <span class="percentage-label">${scores.extroversion}%</span>
                    <div class="bar-track"><div class="bar-fill" style="width: ${scores.extroversion}%"></div></div>
                </div>
                <div class="bar-labels">
                    <span>内向(I)</span><span>外向(E)</span>
                </div>
            </div>
            <div class="bar-chart-item">
                <div class="bar-chart-title">協調性</div>
                <div class="bar-container">
                    <span class="percentage-label">${scores.agreeableness}%</span>
                    <div class="bar-track"><div class="bar-fill" style="width: ${scores.agreeableness}%"></div></div>
                </div>
                <div class="bar-labels">
                    <span>排他(H)</span><span>協調(A)</span>
                </div>
            </div>
            <div class="bar-chart-item">
                <div class="bar-chart-title">誠実性 (勤勉性)</div>
                <div class="bar-container">
                    <span class="percentage-label">${scores.conscientiousness}%</span>
                    <div class="bar-track"><div class="bar-fill" style="width: ${scores.conscientiousness}%"></div></div>
                </div>
                <div class="bar-labels">
                    <span>怠惰(R)</span><span>勤勉(C)</span>
                </div>
            </div>
            <div class="bar-chart-item">
                <div class="bar-chart-title">情動性 (感情起伏)</div>
                <div class="bar-container">
                    <span class="percentage-label">${scores.neuroticism}%</span>
                    <div class="bar-track"><div class="bar-fill" style="width: ${scores.neuroticism}%"></div></div>
                </div>
                <div class="bar-labels">
                    <span>論理(N)</span><span>情動(T)</span>
                </div>
            </div>
            <div class="bar-chart-item">
                <div class="bar-chart-title">創造性</div>
                <div class="bar-container">
                    <span class="percentage-label">${scores.openness}%</span>
                    <div class="bar-track"><div class="bar-fill" style="width: ${scores.openness}%"></div></div>
                </div>
                <div class="bar-labels">
                    <span>保守(S)</span><span>創造(O)</span>
                </div>
            </div>
        `;
    }

    // 性格に基づいた3D図形を生成・更新する関数
    function generateShape() {
        const scores = calculatePersonalityScores();
        if (!scores) return;

        // 画面切り替え
        inputSection.classList.remove('active');
        outputSection.classList.add('active');
        
        // Three.jsの初期化（output-sectionが表示されてから）
        initThreeJS();
        
        // 結果をUIに表示
        displayResults(scores);
        
        // 既存のメッシュとパーティクルがあれば削除
        if (mesh) {
            scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            mesh = null;
        }
        if (ambientParticles) {
            scene.remove(ambientParticles);
            ambientParticles.geometry.dispose();
            ambientParticles.material.dispose();
            ambientParticles = null;
        }

        const name = nameInput.value.trim() || '匿名の';
        figureTitle.textContent = `"${name}さんの図形"`;

        // --- 3D図形生成ロジック ---
        
        const baseSize = 2;

        // 1. 協調性 (Agreeableness): ジオメトリの丸さ/チクチク感
        let geometry;
        if (scores.agreeableness < 50) {
            // スコアが低い場合はIcosahedronGeometryでチクチク感を強調
            let detail;
            if (scores.agreeableness < 25) detail = 3; // 25点未満で最もチクチク
            else detail = 2; // 25点以上で少し滑らか
            geometry = new THREE.IcosahedronGeometry(baseSize, detail);
            
            const positionAttribute = geometry.getAttribute('position');
            const distortionFactor = (50 - scores.agreeableness) / 50 * 0.4; // 0.0-0.4に変化
            for (let i = 0; i < positionAttribute.count; i++) {
                const vector = new THREE.Vector3().fromBufferAttribute(positionAttribute, i);
                vector.multiplyScalar(1 + Math.random() * distortionFactor);
                positionAttribute.setXYZ(i, vector.x, vector.y, vector.z);
            }
            geometry.attributes.position.needsUpdate = true;
        } else {
            // スコアが高い場合はSphereGeometryで滑らかに
            geometry = new THREE.SphereGeometry(baseSize, 64, 64);
        }

        // 2. 誠実性 (Conscientiousness): 模様の荒さ/細かさ (ワイヤーフレームの太さ)
        let wireframe = scores.conscientiousness < 50;
        let wireframeLineWidth = 1;
        if (wireframe) {
            wireframeLineWidth = 1 + (50 - scores.conscientiousness) / 50 * 4;
        }
        
        // 3. 情動性 (Neuroticism): 色（暖色/寒色）
        // スコアに応じて色相を滑らかに変化
        let hue;
        if (scores.neuroticism <= 50) {
            // 寒色側: 青(0.67)から中間(0.5)
            hue = 0.67 - (scores.neuroticism / 50) * 0.17;
        } else {
            // 暖色側: 中間(0.5)から赤(0)
            hue = 0.5 - ((scores.neuroticism - 50) / 50) * 0.5;
        }
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        
        // 4. 創造性 (Openness): 素材の硬さ/柔らかさ (光沢/透明度)
        let shininess;
        let opacity;
        shininess = 100 * (1 - scores.openness / 100);
        opacity = 0.5 + (scores.openness / 100) * 0.5;
        
        // 5. 外向性 (Extroversion): パーティクルの有無
        if (scores.extroversion > 50) {
            const particleCount = scores.extroversion * 100;
            const particleGeometry = new THREE.BufferGeometry();
            const positions = [];
            for (let i = 0; i < particleCount; i++) {
                const x = (Math.random() - 0.5) * 12;
                const y = (Math.random() - 0.5) * 12;
                const z = (Math.random() - 0.5) * 12;
                positions.push(x, y, z);
            }
            particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            const particleMaterial = new THREE.PointsMaterial({
                color: 0xF5A623,
                size: 0.1 + (scores.extroversion - 50) / 50 * 0.3,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            ambientParticles = new THREE.Points(particleGeometry, particleMaterial);
            scene.add(ambientParticles);
        }

        // マテリアルの作成
        const material = new THREE.MeshPhongMaterial({
            color: color,
            shininess: shininess,
            transparent: true,
            opacity: opacity,
            wireframe: wireframe,
            wireframeLinewidth: wireframeLineWidth
        });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        // アニメーションループを開始/更新
        if (!renderer.domElement.requestAnimationFrameId) {
            animate();
        }
    }

    // アニメーションループ (手動操作に切り替え)
    function animate() {
        renderer.domElement.requestAnimationFrameId = requestAnimationFrame(animate);
        
        // コントロールを更新
        if (controls) {
            controls.update();
        }

        // パーティクルは自動回転させる
        if (ambientParticles) {
            ambientParticles.rotation.y += 0.005;
        }

        renderer.render(scene, camera);
    }

    // イベントリスナー
    generateButton.addEventListener('click', () => {
        generateShape();
    });

    // アンケートに戻るボタンのイベントリスナー
    backButton.addEventListener('click', () => {
        outputSection.classList.remove('active');
        inputSection.classList.add('active');
        if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); mesh = null; }
        if (ambientParticles) { scene.remove(ambientParticles); ambientParticles.geometry.dispose(); ambientParticles.material.dispose(); ambientParticles = null; }
        if (renderer) {
            renderer.dispose();
            renderer.domElement.parentNode.removeChild(renderer.domElement);
            renderer = null;
        }
    });

    // 初期化
    createRadioButtons();
});