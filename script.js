// script.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const inputSection = document.getElementById('input-section');
    const outputSection = document.getElementById('output-section');
    const nameInput = document.getElementById('name');
    const radioGroups = document.querySelectorAll('.radio-group'); // data-item属性を持つdiv
    const generateButton = document.getElementById('generate-button');
    const backButton = document.getElementById('back-button');
    const figureTitle = document.getElementById('figure-title');
    const threeContainer = document.getElementById('three-container');
    const resultDisplay = document.getElementById('result-values');

    // Three.js シーンの変数
    let scene, camera, renderer, mesh, ambientParticles, controls;
    let animationFrameId; // requestAnimationFrameのIDを保持

    // ラジオボタンの動的生成
    function createRadioButtons() {
        radioGroups.forEach(group => {
            const itemNumber = group.getAttribute('data-item');
            // 既存のラジオボタンがあれば削除（2回目以降の表示で重複しないように）
            while (group.firstChild) {
                group.removeChild(group.firstChild);
            }

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

    // Three.js シーンのセットアップとアニメーションの開始
    function initAndAnimateThreeJS() {
        // 既存のThree.jsリソースをクリーンアップ
        cleanupThreeJS();

        if (!threeContainer) {
            console.error('Three.js container not found.');
            return;
        }

        // 新しいレンダラーを作成
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true, // キャンバスの背景を透明にする
            powerPreference: "high-performance", // 描画パフォーマンスを優先
            failIfMajorPerformanceCaveat: true // パフォーマンスに問題がある場合失敗
        });
        renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
        renderer.setClearColor(0x000000, 0); // レンダラーの背景も透明に (CSSの背景が透けて見えるように)
        threeContainer.appendChild(renderer.domElement);

        // シーン、カメラ、ライトの作成
        scene = new THREE.Scene();
        // scene.background = new THREE.Color(0xffffff); // CSS背景と合わせるため、Three.js背景は透明に

        camera = new THREE.PerspectiveCamera(75, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
        camera.position.z = 7;

        // OrbitControls (手動回転) の設定
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI / 2; // Y軸の回転を制限
        controls.autoRotate = true; // 自動回転を有効に
        controls.autoRotateSpeed = 2.0;

        // ライトを調整
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1.5);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);
        const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
        pointLight2.position.set(-5, -5, -5);
        scene.add(pointLight2);
        
        // WebGL Context Lost/Restored イベントハンドリング
        renderer.domElement.addEventListener('webglcontextlost', (event) => {
            console.log('WebGL context lost. Attempting to restore...');
            event.preventDefault(); // ブラウザによる自動回復を停止し、手動で処理
            // ここでUIにエラーメッセージを表示することも可能
        }, false);
        
        renderer.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored! Re-initializing scene.');
            // コンテキストが復元されたら、シーンを再構築
            // すでに cleanupThreeJS() が呼ばれているため、新しい Three.js 要素を追加
            // ただし、このイベントはブラウザの裁量で発火するため、
            // ページ遷移での再描画はinitAndAnimateThreeJS()で制御する方が確実
            // ここでは念のため、リソースが失われた場合の回復ロジックも残す
            initAndAnimateThreeJS(); 
        }, false);

        // ウィンドウリサイズイベントリスナー
        window.removeEventListener('resize', onWindowResize); // 二重登録を防止
        window.addEventListener('resize', onWindowResize, false);

        // アニメーションループを開始
        animate();
    }

    // ウィンドウリサイズ時の処理
    function onWindowResize() {
        if (!threeContainer || !camera || !renderer) return;
        const width = threeContainer.clientWidth;
        const height = threeContainer.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    // Three.jsアニメーションループ
    function animate() {
        animationFrameId = requestAnimationFrame(animate); // IDを保持

        // コントロールを更新 (自動回転も含む)
        if (controls) {
            controls.update();
        }

        // パーティクルがあれば自動回転させる
        if (ambientParticles) {
            ambientParticles.rotation.y += 0.005;
        }

        // シーンをレンダリング
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    // Three.jsのリソースを解放する関数
    function cleanupThreeJS() {
        // 既存のアニメーションループを停止
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // リサイズイベントリスナーを削除
        window.removeEventListener('resize', onWindowResize);

        // レンダラーを破棄してDOMから削除
        if (renderer) {
            renderer.dispose();
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
            renderer = null;
        }

        // シーン内のオブジェクトをクリーンアップ
        if (scene) {
            scene.traverse((object) => {
                // Geometryを解放
                if (object.geometry) {
                    object.geometry.dispose();
                }
                // Materialを解放
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
                // Textureを解放
                if (object.material && object.material.map) {
                    object.material.map.dispose();
                }
            });
            scene = null;
        }

        // コントロールを破棄
        if (controls) {
            controls.dispose();
            controls = null;
        }

        // 各変数をnullに
        mesh = null;
        ambientParticles = null;
        camera = null;
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

        // 得点化の計算式 (TIPI-Jの逆転項目を含む)
        const extroversionScore = (item1 + (8 - item6)) / 2; // 外向性 (item6は逆転項目)
        const agreeablenessScore = ((8 - item2) + item7) / 2; // 協調性 (item2は逆転項目)
        const conscientiousnessScore = (item3 + (8 - item8)) / 2; // 誠実性 (item8は逆転項目)
        const neuroticismScore = (item4 + (8 - item9)) / 2; // 情動性 (item9は逆転項目)
        const opennessScore = (item5 + (8 - item10)) / 2; // 経験への開放性 (item10は逆転項目)
        
        // 1-7のスコアを0-100%に変換 (TIPI-Jのスコア範囲は1-7なので、最低値1を0%として扱う)
        const scale = 100 / 6; // (7 - 1) = 6 が最大範囲

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
                    <span>冷静(N)</span><span>情動(T)</span>
                </div>
            </div>
            <div class="bar-chart-item">
                <div class="bar-chart-title">創造性 (開放性)</div>
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
    function generateShape(scores) {
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

        const baseSize = 2; // 図形の基本サイズ

        // 1. 協調性 (Agreeableness): ジオメトリの丸さ/チクチク感
        let geometry;
        if (scores.agreeableness < 50) {
            // スコアが低い場合はIcosahedronGeometryでチクチク感を強調
            let detail;
            if (scores.agreeableness < 25) detail = 3; // 25点未満で最もチクチク
            else detail = 2; // 25点以上で少し滑らか
            geometry = new THREE.IcosahedronGeometry(baseSize, detail);
            
            // ランダムな歪みを追加してチクチク感を出す
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

        // 2. 誠実性 (Conscientiousness): 模様の荒さ/細かさ (ワイヤーフレームの有無と太さ)
        let wireframe = scores.conscientiousness < 50; // 誠実性が低いとワイヤーフレーム
        let wireframeLineWidth = 1;
        if (wireframe) {
            wireframeLineWidth = 1 + (50 - scores.conscientiousness) / 50 * 4; // スコアが低いほど太く
        }
        
        // 3. 情動性 (Neuroticism): 色（暖色/寒色）
        // スコアに応じて色相を滑らかに変化
        let hue; // HSLの色相 (0-1)
        if (scores.neuroticism <= 50) {
            // 寒色側: 青(0.67)から中間(0.5)
            hue = 0.67 - (scores.neuroticism / 50) * 0.17;
        } else {
            // 暖色側: 中間(0.5)から赤(0)
            hue = 0.5 - ((scores.neuroticism - 50) / 50) * 0.5;
        }
        const color = new THREE.Color().setHSL(hue, 1, 0.5); // 彩度と明度は固定

        // 4. 創造性 (Openness): 素材の硬さ/柔らかさ (光沢/透明度)
        let shininess; // 光沢度 (高いほど光を反射)
        let opacity; // 透明度
        shininess = 100 * (1 - scores.openness / 100); // 開放性が低いほど光沢がある (硬い印象)
        opacity = 0.5 + (scores.openness / 100) * 0.5; // 開放性が高いほど透明度が高い (柔らかい印象)
        
        // 5. 外向性 (Extroversion): 周囲のパーティクル有無と量
        if (scores.extroversion > 50) {
            const particleCount = Math.floor(scores.extroversion * 100); // スコアが高いほどパーティクルが多い
            const particleGeometry = new THREE.BufferGeometry();
            const positions = [];
            for (let i = 0; i < particleCount; i++) {
                const x = (Math.random() - 0.5) * 12; // -6から6の範囲にランダム配置
                const y = (Math.random() - 0.5) * 12;
                const z = (Math.random() - 0.5) * 12;
                positions.push(x, y, z);
            }
            particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            const particleMaterial = new THREE.PointsMaterial({
                color: 0xF5A623, // アクセントカラーの黄色
                size: 0.1 + (scores.extroversion - 50) / 50 * 0.3, // 外向性が高いほどパーティクルが大きい
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending // パーティクルを重ねる
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
    }

    // イベントリスナー
    generateButton.addEventListener('click', () => {
        const scores = calculatePersonalityScores();
        if (!scores) return; // 全て回答されていなければ処理を中断

        // 画面切り替え
        inputSection.classList.remove('active');
        outputSection.classList.add('active');
        
        // Three.jsの初期化とアニメーション開始
        initAndAnimateThreeJS();
        
        // アンケート結果をUIに表示
        displayResults(scores);
        
        // 性格に基づいた3D図形を生成
        generateShape(scores);

        const name = nameInput.value.trim() || '匿名の';
        figureTitle.textContent = `"${name}さんの図形"`;
    });

    // アンケートに戻るボタンのイベントリスナー
    backButton.addEventListener('click', () => {
        // 画面切り替え
        outputSection.classList.remove('active');
        inputSection.classList.add('active');
        
        // フォームをリセット
        document.getElementById('name').value = 'あなたの名前'; // 名前入力欄もリセット
        radioGroups.forEach(group => {
            group.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
        });
        resultDisplay.innerHTML = ''; // バーグラフをクリア
        figureTitle.textContent = ''; // タイトルをクリア
        
        // Three.jsのリソースを完全にクリーンアップ
        cleanupThreeJS();
    });

    // 初期化処理
    createRadioButtons(); // ページロード時にラジオボタンを生成
});