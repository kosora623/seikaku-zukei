// script.js

// Three.jsとOrbitControlsのロードを待機する関数
function waitForThreeJSAndOrbitControls(callback) {
    if (typeof THREE !== 'undefined' && typeof THREE.OrbitControls !== 'undefined') {
        callback(); // 両方存在すればすぐに実行
    } else {
        // 存在しない場合、数ミリ秒待ってから再チェック
        setTimeout(() => {
            waitForThreeJSAndOrbitControls(callback);
        }, 50); // 50ミリ秒ごとに再チェック
    }
}

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
    const resultDisplay = document.getElementById('result-values'); // バーグラフの親要素
    const resultsToggleButton = document.getElementById('results-toggle-button'); // UIトグルボタン
    const resultValuesWrapper = document.getElementById('result-values-wrapper'); // バーグラフのラッパー要素

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
                label.appendChild(document.createTextNode(i)); // テキストノードとして追加
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
        camera.position.z = 6; // カメラのZ位置を少し手前に調整

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
                        mat = object.material;
                        // マップテクスチャがあれば解放
                        if (mat.map) mat.map.dispose();
                        mat.dispose();
                    }
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
    // asyncキーワードを追加してawaitが使えるようにする
    async function generateShape(scores) {
        // 既存のメッシュとパーティクルがあれば削除
        if (mesh) {
            scene.remove(mesh);
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => mat.dispose());
            } else {
                // テクスチャがあれば解放
                if (mesh.material.map) mesh.material.map.dispose();
                mesh.material.dispose();
            }
            mesh = null;
        }
        if (ambientParticles) {
            scene.remove(ambientParticles);
            ambientParticles.geometry.dispose();
            ambientParticles.material.dispose();
            ambientParticles = null;
        }

        const baseSize = 2; // 図形の基本サイズ

        // 1. 創造性 (Openness): 図形のデフォルトが八面体、値が100に近づくにつれて複雑になる
        let geometry;
        const opennessComplexity = scores.openness / 100; // 0.0 から 1.0
        
        if (opennessComplexity < 0.2) { // 低い開放性: シンプルな八面体
            geometry = new THREE.OctahedronGeometry(baseSize, 0); // detail 0で最もシンプル
        } else if (opennessComplexity < 0.5) { // 中程度の開放性: IcosahedronGeometry (正二十面体)
            geometry = new THREE.IcosahedronGeometry(baseSize, 0); // detail 0でシンプル
        } else if (opennessComplexity < 0.8) { // 高い開放性: TorusKnotGeometry (シンプルな結び目)
            const radius = baseSize;
            const tube = 0.4;
            const tubularSegments = 64;
            const radialSegments = 8;
            const p = 2; // ねじれの数
            const q = 3; // ループの数
            geometry = new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q);
        } else { // 非常に高い開放性: より複雑なTorusKnotGeometry (添付画像のような形状)
            const radius = baseSize * 1.2;
            const tube = 0.3;
            const tubularSegments = 128; // より滑らかに
            const radialSegments = 16; // より詳細に
            const p = 3; // さらに複雑なねじれ
            const q = 4; // より多くのループ
            geometry = new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q);
        }

        // 3. 誠実性 (Conscientiousness): ワイヤーフレームの有無 (常にfalse)
        const wireframe = false; // ワイヤーフレームを常にOFF

        // 4. 情動性 (Neuroticism): 色（暖色/寒色）
        // スコアに応じて色相を滑らかに変化
        let hue; // HSLの色相 (0-1)
        if (scores.neuroticism <= 50) {
            // 冷静(N): 青(0.67)に近い色から中間(0.5)
            hue = 0.67 - (scores.neuroticism / 50) * 0.17; // 0.67から0.50へ
        } else {
            // 情動(T): 中間(0.5)から赤(0)に近い色
            hue = 0.5 - ((scores.neuroticism - 50) / 50) * 0.5; // 0.50から0へ
        }
        const color = new THREE.Color().setHSL(hue, 1, 0.5); // 彩度と明度は固定

        // 2. 協調性 (Agreeableness): 水玉模様のテクスチャ
        let map = null;
        if (scores.agreeableness > 0) { // 協調性が0より大きい場合にテクスチャを適用
            const textureLoader = new THREE.TextureLoader();
            try {
                // 'images/polka_dots.png' は水玉模様の画像のパス。
                // 実際のファイルパスに合わせて修正してください。
                // 例: polka_dots.pngがscript.jsと同じディレクトリにある場合、'./polka_dots.png'
                // imagesフォルダにある場合、'./images/polka_dots.png'
                map = await textureLoader.loadAsync('./polka_dots.png'); 

                // テクスチャの繰り返し設定（協調性のスコアに応じて細かさを調整）
                // 協調性が高いほど水玉が細かく、密度が高くなる
                const repeatFactor = 1 + (scores.agreeableness / 100) * 5; // 0%で1倍、100%で6倍
                map.wrapS = THREE.RepeatWrapping;
                map.wrapT = THREE.RepeatWrapping;
                map.repeat.set(repeatFactor, repeatFactor);
            } catch (error) {
                console.error('Failed to load polka dots texture:', error);
                // テクスチャロード失敗時はmapをnullのままにするか、代替処理
                map = null;
            }
        }

        // マテリアルの作成
        const shininess = 30; // 光沢度
        const opacity = 0.9; // 不透明度

        const material = new THREE.MeshPhongMaterial({
            color: color,
            shininess: shininess,
            transparent: true,
            opacity: opacity,
            wireframe: wireframe, // 常にfalse
            map: map // 水玉模様のテクスチャ
        });

        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 0); // 図形の初期位置を中央に設定
        scene.add(mesh);

        // 5. 外向性 (Extroversion): 周囲のパーティクル有無と量、サイズを調整
        if (scores.extroversion > 0) { // 外向性が0でもわずかに表示
            // パーティクル数を減らす、変化を緩やかにする
            // 最小50個、最大500個程度の範囲に調整 (以前の100-1000から減らしました)
            const particleCount = Math.floor(50 + (scores.extroversion / 100) * 450); // 50(0%)から500(100%)
            const particleGeometry = new THREE.BufferGeometry();
            const positions = [];
            for (let i = 0; i < particleCount; i++) {
                const x = (Math.random() - 0.5) * 8; // -4から4の範囲にランダム配置 (図形より少し広めに)
                const y = (Math.random() - 0.5) * 8;
                const z = (Math.random() - 0.5) * 8;
                positions.push(x, y, z);
            }
            particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            // パーティクルを小さくして図形を見やすく
            const particleSize = 0.03 + (scores.extroversion / 100) * 0.07; // 0.03(0%)から0.1(100%) (以前より小さく)
            
            // 協調性のパーティクル形状（テクスチャで表現するアイデア）
            // ここでは簡易的に、協調性スコアに応じてパーティクルサイズに微調整を加えることで「丸み」を表現
            // 協調性が高いほどパーティクルを「丸く」見せる（サイズ変化で擬似的に表現）
            const adjustedParticleSize = particleSize * (1 + (scores.agreeableness / 100) * 0.5); // 0-50%増
            
            const particleMaterial = new THREE.PointsMaterial({
                color: 0xF5A623, // アクセントカラーの黄色
                size: adjustedParticleSize, 
                transparent: true,
                opacity: 0.6 + (scores.extroversion / 100) * 0.3, // 外向性が高いほどやや不透明に
                blending: THREE.AdditiveBlending // パーティクルを重ねる
            });
            ambientParticles = new THREE.Points(particleGeometry, particleMaterial);
            scene.add(ambientParticles);
        }
    }

    // イベントリスナー
    generateButton.addEventListener('click', () => {
        const scores = calculatePersonalityScores();
        if (!scores) return; // 全て回答されていなければ処理を中断

        console.log('Calculated Scores:', scores);

        // 画面切り替え
        inputSection.classList.remove('active');
        outputSection.classList.add('active');
        
        // Three.jsとOrbitControlsがロードされていることを確認してから実行
        waitForThreeJSAndOrbitControls(async () => { // generateShapeがasyncなので、ここもasyncにする
            initAndAnimateThreeJS();
            await generateShape(scores); // awaitを追加
        });

        // アンケート結果をUIに表示
        displayResults(scores);
        
        const name = nameInput.value.trim() || '匿名の';
        figureTitle.textContent = `"${name}さんの図形"`;

        // 図形生成時にバーグラフを閉じた状態にする
        resultValuesWrapper.classList.remove('expanded');
        resultValuesWrapper.classList.add('collapsed');
        resultsToggleButton.classList.remove('expanded'); // アイコンも下向きに
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

        // バーグラフ表示をデフォルト（折りたたみ）に戻す
        resultValuesWrapper.classList.remove('expanded');
        resultValuesWrapper.classList.add('collapsed');
        resultsToggleButton.classList.remove('expanded');
    });

    // UI変更点: 結果表示のバーグラフの表示/非表示を切り替えるイベントリスナー
    resultsToggleButton.addEventListener('click', () => {
        resultValuesWrapper.classList.toggle('collapsed');
        resultValuesWrapper.classList.toggle('expanded');
        resultsToggleButton.classList.toggle('expanded'); // アイコン回転用
    });


    // 初期化処理
    createRadioButtons(); // ページロード時にラジオボタンを生成
    
    // UI変更点: ページロード時に結果表示セクションが非表示の場合でも、
    // バーグラフのラッパー要素の初期状態を collapsed に設定しておく
    // これにより、output-sectionがactiveになった時にデフォルトで閉じている
    resultValuesWrapper.classList.add('collapsed');
    resultsToggleButton.classList.remove('expanded'); // 念のためアイコンも下向きに
});