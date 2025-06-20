// script.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const nameInput = document.getElementById('name');
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    const generateButton = document.getElementById('generate-button');
    const figureTitle = document.getElementById('figure-title');
    const threeContainer = document.getElementById('three-container');

    // スライダーの値が変更されたときに表示を更新する汎用関数
    rangeInputs.forEach(input => {
        const valueSpan = document.getElementById(`${input.id}-value`);
        input.addEventListener('input', () => {
            valueSpan.textContent = `${input.value}%`;
        });
    });

    // Three.js シーンのセットアップ
    let scene, camera, renderer, mesh, ambientParticles, currentRotationSpeed = 0.01;
    let originalScale = new THREE.Vector3(1, 1, 1); // 形状揺らぎ用
    let pulseAmplitude = 0; // 感情起伏による脈動の振幅

    function initThreeJS() {
        // シーンの作成
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111); // 背景色を黒に

        // カメラの作成
        camera = new THREE.PerspectiveCamera(75, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
        camera.position.z = 7; // カメラを少し引く

        // レンダラーの作成
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
        threeContainer.innerHTML = ''; // 既存のキャンバスをクリア
        threeContainer.appendChild(renderer.domElement);

        // ライトの追加 (より劇的に)
        const ambientLight = new THREE.AmbientLight(0x222222, 0.5); // 全体的な光を弱める
        scene.add(ambientLight);
        const directionalLight1 = new THREE.DirectionalLight(0xff8800, 1); // オレンジ色の強い光
        directionalLight1.position.set(1, 1, 1).normalize();
        scene.add(directionalLight1);
        const directionalLight2 = new THREE.DirectionalLight(0x0088ff, 1); // 青色の強い光
        directionalLight2.position.set(-1, -1, 1).normalize();
        scene.add(directionalLight2);

        // ウィンドウのリサイズに対応
        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {
        // コンテナのサイズを取得し直す
        const width = threeContainer.clientWidth;
        const height = threeContainer.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    // 性格に基づいた3D図形を生成・更新する関数
    function generateShape() {
        // 既存のメッシュとパーティクルがあれば削除
        if (mesh) {
            scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
        if (ambientParticles) {
            scene.remove(ambientParticles);
            ambientParticles.geometry.dispose();
            ambientParticles.material.dispose();
        }

        const name = nameInput.value.trim() || '匿名の'; // 名前の入力がない場合は「匿名の」
        const extroversion = parseInt(document.getElementById('extroversion').value);
        const agreeableness = parseInt(document.getElementById('agreeableness').value);
        const conscientiousness = parseInt(document.getElementById('conscientiousness').value);
        const neuroticism = parseInt(document.getElementById('neuroticism').value);
        const openness = parseInt(document.getElementById('openness').value);

        figureTitle.textContent = `"${name}さんの図形"`; // ダブルクォーテーションで囲む

        // --- 性格特性を3D図形にマッピングする新しいロジック (より劇的に) ---

        // 1. 外向性 (Extroversion): 図形の周囲の光/影パーティクルに影響 (さらに派手に)
        // 理想値からの乖離が大きいほど、特殊なパーティクル（光または影）が発生
        const idealExtroversion = 50; // 理想的な外向性
        const extroversionDeviation = Math.abs(extroversion - idealExtroversion);
        const particleCount = Math.floor(extroversionDeviation * 20); // 乖離が大きいほどパーティクルが多い (さらに多く)

        if (particleCount > 0) {
            const particleGeometry = new THREE.BufferGeometry();
            const positions = [];
            const colors = [];
            const particleColor = new THREE.Color();

            let baseColor = 0xffffff; // デフォルトは光る白
            if (extroversion < idealExtroversion) {
                // 外向性が低い場合は影（暗い、赤みがかった色）
                baseColor = 0x330000;
            }

            for (let i = 0; i < particleCount; i++) {
                // 図形の周囲にランダムに配置 (より遠くまで広がる)
                const x = (Math.random() - 0.5) * 10;
                const y = (Math.random() - 0.5) * 10;
                const z = (Math.random() - 0.5) * 10;
                positions.push(x, y, z);

                // 外向性に応じて色を調整 (より鮮やかに)
                particleColor.setHex(baseColor);
                particleColor.multiplyScalar(Math.random() * 0.8 + 0.2); // より鮮やかな色
                colors.push(particleColor.r, particleColor.g, particleColor.b);
            }

            particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const particleMaterial = new THREE.PointsMaterial({
                size: 0.2 + (extroversionDeviation / 100) * 0.4, // 乖離が大きいほど大きいパーティクル (さらに大きく)
                vertexColors: true, // 頂点カラーを使用
                transparent: true,
                opacity: 0.9, // より不透明に
                blending: THREE.AdditiveBlending // 光るパーティクル用
            });
            ambientParticles = new THREE.Points(particleGeometry, particleMaterial);
            scene.add(ambientParticles);
        }


        // 2. 協調性 (Agreeableness): 図形の丸さ/角ばりに影響 (ジオメトリのセグメント数、より極端に)
        // 低いほど角ばり、高いほど滑らか
        const segments = Math.max(3, Math.floor(agreeableness / 100 * 40) + 3); // 3から43の範囲 (より極端な変化)

        // 3. 誠実性 (Conscientiousness): 図形のマテリアル（硬さ/柔らかさ、光沢、色）に影響 (より劇的に)
        // 高いほど硬く金属的 (shininess大、鮮やかな色)、低いほど柔らかくマット (shininess小、くすんだ色)
        const shininess = (conscientiousness / 100) * 150; // 0から150の範囲 (より広い範囲)
        const specularColor = new THREE.Color().setHSL(0, 0, (conscientiousness / 100) * 0.9 + 0.1); // 誠実性でスペキュラーの明るさ調整
        const mainColor = new THREE.Color().setHSL((1 - (conscientiousness / 100)) * 0.6 , 0.8, 0.5); // 誠実性で色相を変化

        // 4. 感情起伏 (Neuroticism): 図形の回転の滑らかさ、形状の脈動、変形に影響 (より激しく)
        currentRotationSpeed = 0.2 + (neuroticism / 100) * 2; // 0.2から2.2倍速 (より速い回転)
        pulseAmplitude = (neuroticism / 100) * 0.4; // 脈動の振幅 (0から0.4、より激しく)

        // 5. 知的好奇心 (Openness): 図形の複雑さや特殊な表現に影響 (より極端に、ワイヤーフレームも追加)
        // 高いほど複雑なジオメトリやユニークなマテリアル、ワイヤーフレーム
        const baseSize = 1.2; // 全体的なベースサイズを大きく

        let geometry;
        let material;

        if (openness > 80) {
            // 知的好奇心が非常に高い場合：複雑なトーラス結び目 (より複雑に)
            geometry = new THREE.TorusKnotGeometry(baseSize * 0.6, baseSize * 0.2, segments * 3, segments / 3, 5, 10);
            material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.9, 0.7), // ランダムで鮮やかな色
                shininess: shininess,
                specular: specularColor,
                wireframe: true // ワイヤーフレーム表示
            });
        } else if (openness > 50) {
            // 知的好奇心が中程度：多面体 (より複雑な形状)
            geometry = new THREE.DodecahedronGeometry(baseSize * 0.8);
            material = new THREE.MeshPhongMaterial({
                 color: new THREE.Color().setHSL(0.6 - (agreeableness / 100) * 0.3, 0.7, 0.6), // 協調性に応じて青〜緑系
                shininess: shininess,
                specular: specularColor
            });
        } else {
            // 知的好奇心が低い：基本的な形状（球体または立方体、より大きく変形）
            if (extroversion > 60) {
                // 外向性が高ければ球体
                geometry = new THREE.SphereGeometry(baseSize, segments, segments);
            } else {
                // 外向性が低ければ立方体
                geometry = new THREE.BoxGeometry(baseSize * 1.5, baseSize * 1.5, baseSize * 1.5); // より大きく
            }
             material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(0.1 + (agreeableness / 100) * 0.4, 0.7, 0.6), // 協調性に応じて赤〜黄系
                shininess: shininess,
                specular: specularColor
            });
        }

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        originalScale.copy(mesh.scale); // 初期スケールを保存

        // アニメーションループを開始/更新
        if (!renderer.domElement.requestAnimationFrameId) {
            animate();
        }
    }

    // アニメーションループ
    function animate() {
        renderer.domElement.requestAnimationFrameId = requestAnimationFrame(animate);

        if (mesh) {
            // 回転 (より速く)
            mesh.rotation.x += 0.01 * currentRotationSpeed;
            mesh.rotation.y += 0.01 * currentRotationSpeed;

            // 感情起伏による形状の脈動 (より激しく)
            if (pulseAmplitude > 0) {
                const scaleFactor = 1 + Math.sin(Date.now() * 0.005) * pulseAmplitude;
                mesh.scale.x = originalScale.x * scaleFactor;
                mesh.scale.y = originalScale.y * scaleFactor;
                mesh.scale.z = originalScale.z * scaleFactor;
            } else {
                mesh.scale.copy(originalScale); // 脈動がない場合は元のスケールに戻す
            }
        }
        
        // 周囲のパーティクルも動かす (あれば)
        if (ambientParticles) {
            ambientParticles.rotation.y += 0.005; // より速く回転
            ambientParticles.rotation.x += 0.002;
        }

        renderer.render(scene, camera);
    }

    // イベントリスナー
    generateButton.addEventListener('click', () => {
        if (!scene) { // 初めての生成時のみThree.jsを初期化
            initThreeJS();
        }
        generateShape();
    });

    // 初期表示としてデフォルト値で図形を生成
    initThreeJS();
    generateShape();
});