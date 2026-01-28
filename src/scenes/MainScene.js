window.MainScene = class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        console.log("MainScene 初期化");
    }

    preload() {
        console.log("アセット読み込み開始");
        
        // ローディング表示
        this.createLoadingScreen();
        
        // === 画像ファイルの読み込み ===
        // タイルセット (10タイル横並び 32x320)
        this.load.image('tiles', 'assets/tiles/tiles.png');
        
        // プレイヤー
        this.load.image('player', 'assets/player/player.png');
        
        // オブジェクト
        this.load.image('base', 'assets/objects/基地.png');
        this.load.image('ruin', 'assets/objects/廃墟1.png');
        this.load.image('wall', 'assets/objects/wall.png');
        this.load.image('bullet', 'assets/objects/発射された弾丸.png');
        
        // アイテムアイコン - 未実装のものは同じ画像を使う
        this.load.image('wood_icon', 'assets/items/ご飯.png'); // 仮: ご飯画像を使う
        this.load.image('stone_icon', 'assets/items/ご飯.png'); // 仮: ご飯画像を使う
        this.load.image('dirt_icon', 'assets/items/ご飯.png'); // 仮: ご飯画像を使う
        this.load.image('food_icon', 'assets/items/ご飯.png');
        this.load.image('food_item', 'assets/items/ご飯.png');
        
        // ローディング進捗
        this.load.on('progress', (value) => {
            if (this.progressBar) {
                this.progressBar.clear();
                this.progressBar.fillStyle(0xffffff, 1);
                this.progressBar.fillRect(250, 280, 300 * value, 30);
            }
            if (this.percentText) {
                this.percentText.setText(Math.floor(value * 100) + '%');
            }
        });
        
        this.load.on('complete', () => {
            console.log("アセット読み込み完了");
            if (this.loadingText) this.loadingText.destroy();
            if (this.progressBar) this.progressBar.destroy();
            if (this.percentText) this.percentText.destroy();
        });
    }

    createLoadingScreen() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // ローディングテキスト
        this.loadingText = this.add.text(width / 2, height / 2 - 50, '読み込み中...', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // プログレスバー背景
        const bg = this.add.graphics();
        bg.fillStyle(0x333333, 1);
        bg.fillRect(width / 2 - 150, height / 2, 300, 30);
        
        // プログレスバー
        this.progressBar = this.add.graphics();
        
        // パーセント表示
        this.percentText = this.add.text(width / 2, height / 2 + 15, '0%', {
            font: '18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }

    create() {
        console.log("ゲーム作成開始");

        // テクスチャ存在確認
        const missingTextures = [];
        const expectedTextures = [
            'tiles', 'player', 'base', 'ruin', 'bullet',
            'food_icon'
        ];

        expectedTextures.forEach(textureKey => {
            if (!this.textures.exists(textureKey)) {
                missingTextures.push(textureKey);
                console.error(`テクスチャが見つかりません: ${textureKey}`);
            }
        });

        if (missingTextures.length > 0) {
            console.log(`画像読み込みエラー: ${missingTextures.join(', ')}`);
            this.showMessage(`画像読み込みエラー`, 3000);
            this.createFallbackGraphics();
        }

        // プレイヤーアニメーション設定
        this.createPlayerAnimations();

        // ゲーム状態初期化
        this.initGameState();
        
        // ワールド生成
        this.createWorld();
        
        // プレイヤー作成
        this.createPlayer();
        
        // カメラ設定
        this.createCamera();
        
        // オブジェクト配置
        this.createObjects();
        
        // UI作成
        this.createUI();
        
        // 入力設定
        this.createInput();
        
        // ゲームループ開始
        this.startGameLoop();
        
        console.log("ゲーム作成完了");
        this.showMessage("生存サバイバルゲーム開始！", 3000);
    }

    createFallbackGraphics() {
        console.log("代替グラフィックを作成");
        
        // タイルセットがなければ色付きタイルを作成
        if (!this.textures.exists('tiles')) {
            console.log("タイルセットを作成します");
            
            // カラータイルを定義
            const tileColors = {
                0: 0x000000, // 空気: 黒
                1: 0x8B4513, // 土: 茶色
                2: 0x90EE90, // 草: 薄緑
                3: 0x228B22, // 木: 緑
                4: 0x808080, // 石: 灰色
                5: 0xB22222, // レンガ: 赤
                6: 0xC0C0C0, // 鉄: 銀
                7: 0x696969, // 道: 暗灰
                8: 0xDEB887, // 畑: 薄茶
                9: 0xFF4500  // 炎: オレンジ
            };
            
            // カンバスにタイルを描画
            const tileCanvas = this.textures.createCanvas('tiles_fallback', 320, 32);
            const ctx = tileCanvas.getContext('2d');
            
            for (let i = 0; i < 10; i++) {
                // 背景色
                const colorHex = tileColors[i].toString(16).padStart(6, '0');
                ctx.fillStyle = `#${colorHex}`;
                ctx.fillRect(i * 32, 0, 32, 32);
                
                // 枠線
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(i * 32, 0, 32, 32);
                
                // タイルの模様
                if (i === 3) { // 木
                    ctx.fillStyle = '#006400';
                    for (let y = 4; y < 28; y += 8) {
                        ctx.fillRect(i * 32 + 12, y, 8, 4);
                    }
                } else if (i === 4) { // 石
                    ctx.fillStyle = '#A9A9A9';
                    ctx.beginPath();
                    ctx.arc(i * 32 + 16, 16, 8, 0, Math.PI * 2);
                    ctx.fill();
                } else if (i === 9) { // 炎
                    ctx.fillStyle = '#FF8C00';
                    ctx.beginPath();
                    ctx.moveTo(i * 32 + 16, 8);
                    ctx.lineTo(i * 32 + 24, 24);
                    ctx.lineTo(i * 32 + 8, 24);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            
            tileCanvas.refresh();
            console.log("代替タイルセット作成完了");
        }
        
        // プレイヤー画像がなければ青い四角を作成
        if (!this.textures.exists('player')) {
            const playerCanvas = this.textures.createCanvas('player_fallback', 32, 32);
            const ctx = playerCanvas.getContext('2d');
            
            ctx.fillStyle = '#0000FF'; // 青
            ctx.fillRect(0, 0, 32, 32);
            
            // 顔
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(10, 8, 4, 4); // 左目
            ctx.fillRect(18, 8, 4, 4); // 右目
            ctx.fillRect(12, 18, 8, 2); // 口
            
            playerCanvas.refresh();
        }
    }

    createPlayerAnimations() {
        // プレイヤー画像があればアニメーションを作成
        if (this.textures.exists('player')) {
            try {
                this.anims.create({
                    key: 'idle',
                    frames: [{ key: 'player', frame: 0 }],
                    frameRate: 1,
                    repeat: -1
                });
                
                this.anims.create({
                    key: 'walk',
                    frames: [{ key: 'player', frame: 0 }],
                    frameRate: 5,
                    repeat: -1
                });
            } catch (error) {
                console.log("アニメーション作成エラー:", error);
            }
        }
    }

    initGameState() {
        console.log("ゲーム状態初期化");
        
        this.gameState = {
            // プレイヤーステータス
            hp: 100,
            maxHp: 100,
            hunger: 80,
            maxHunger: 100,
            
            // インベントリ
            inventory: new Array(9).fill(null),
            selectedSlot: 0,
            
            // ゲーム状態
            isPaused: false,
            gameTime: 0,
            isDay: true
        };
        
        // 初期アイテム（既存画像を使用）
        this.gameState.inventory[0] = { 
            type: "wood", 
            name: "木材", 
            count: 5, 
            icon: "food_icon"  // 仮にご飯アイコンを使用
        };
        this.gameState.inventory[1] = { 
            type: "stone", 
            name: "石材", 
            count: 3, 
            icon: "food_icon"  // 仮にご飯アイコンを使用
        };
        this.gameState.inventory[2] = { 
            type: "food", 
            name: "食料", 
            count: 2, 
            icon: "food_icon" 
        };
        this.gameState.inventory[3] = { 
            type: "dirt", 
            name: "土", 
            count: 10, 
            icon: "food_icon"  // 仮にご飯アイコンを使用
        };
        
        console.log("ゲーム状態初期化完了");
    }

    createWorld() {
        console.log("ワールド生成開始");
        
        try {
            // 使用するタイルセット名を決定（フォールバックか通常か）
            const tileSetName = this.textures.exists('tiles') ? 'tiles' : 'tiles_fallback';
            
            // タイルマップ作成
            this.map = this.make.tilemap({
                data: window.worldData,
                tileWidth: 32,
                tileHeight: 32
            });

            // タイルセット追加
            this.tileset = this.map.addTilesetImage(tileSetName);
            
            if (!this.tileset) {
                throw new Error("タイルセットの追加に失敗しました");
            }
            
            // レイヤー作成
            this.groundLayer = this.map.createLayer(0, this.tileset, 0, 0);
            
            if (!this.groundLayer) {
                throw new Error("レイヤーの作成に失敗しました");
            }
            
            // 衝突判定設定
            if (window.COLLIDABLE_TILES) {
                this.groundLayer.setCollision(window.COLLIDABLE_TILES);
            } else {
                // デフォルトの衝突タイル
                this.groundLayer.setCollision([1, 3, 4, 5, 6, 9]);
            }
            
            // ワールド境界設定
            this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
            
            console.log(`ワールドサイズ: ${this.map.width}x${this.map.height}`);
            console.log("ワールド生成完了");
            
        } catch (error) {
            console.error("ワールド生成エラー:", error);
            this.showMessage("ワールド生成エラー", 3000);
            
            // エラー時に最小限の地面を作成
            this.createBasicWorld();
        }
    }

    createBasicWorld() {
        console.log("基本ワールドを作成");
        
        // シンプルな地面を作成
        const graphics = this.add.graphics();
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(0, 400, 800, 200);
        
        // 物理エンジン用の静的地面
        this.ground = this.physics.add.staticGroup();
        this.ground.create(400, 500, null).setScale(800, 100).refreshBody();
        
        this.physics.add.collider(this.player, this.ground);
    }

    createPlayer() {
    console.log("プレイヤー作成開始");
    
    try {
        // 使用するプレイヤー画像名を決定
        const playerTexture = this.textures.exists('player') ? 'player' : 'player_fallback';
        
        // プレイヤースプライト
        this.player = this.physics.add.sprite(100, 100, playerTexture);
        
        if (!this.player) {
            throw new Error("プレイヤーの作成に失敗しました");
        }
        
        this.player.setCollideWorldBounds(true);
        
        // ★ サイズ調整（重要！）
        // プレイヤーを小さく調整（画像サイズに関わらず）
        const targetDisplaySize = 24; // 表示したいサイズ（ピクセル）
        
        // 現在の画像サイズを取得
        const imageWidth = this.player.width;
        const imageHeight = this.player.height;
        console.log(`プレイヤー画像元サイズ: ${imageWidth}x${imageHeight}px`);
        
        // スケール計算（表示サイズに合わせる）
        const scaleX = targetDisplaySize / imageWidth;
        const scaleY = targetDisplaySize / imageHeight;
        
        // スケール適用（アスペクト比を維持）
        const uniformScale = Math.min(scaleX, scaleY);
        this.player.setScale(uniformScale);
        
        // 実際の表示サイズを計算
        const displayWidth = Math.round(imageWidth * uniformScale);
        const displayHeight = Math.round(imageHeight * uniformScale);
        
        // ★ 衝突ボックスを適切なサイズに設定
        // 表示サイズより少し小さく（80%）して、画像の余白を考慮
        const collisionWidth = displayWidth * 0.8;
        const collisionHeight = displayHeight * 0.8;
        const offsetX = (displayWidth - collisionWidth) / 2;
        const offsetY = (displayHeight - collisionHeight) / 2;
        
        this.player.body.setSize(collisionWidth, collisionHeight);
        this.player.body.setOffset(offsetX, offsetY);
        
        // ★ 物理パラメータ調整（ブルブル防止）
        this.player.body.setBounce(0);          // 反発を無効化
        this.player.body.setDrag(800);          // 滑りを減らす
        this.player.body.setFriction(1);        // 摩擦を最大に
        this.player.body.setMaxVelocity(200);   // 最高速度制限
        
        // 衝突判定
        if (this.groundLayer) {
            this.physics.add.collider(this.player, this.groundLayer);
        }
        
        // プレイヤー情報
        this.player.depth = 10;
        this.player.health = 100;
        
        console.log(`プレイヤー表示サイズ: ${displayWidth}x${displayHeight}px`);
        console.log(`プレイヤースケール: ${uniformScale.toFixed(2)}倍`);
        console.log(`衝突ボックス: ${collisionWidth.toFixed(0)}x${collisionHeight.toFixed(0)}px`);
        console.log(`プレイヤー位置: (${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)})`);
        console.log("プレイヤー作成完了");
        
    } catch (error) {
        console.error("プレイヤー作成エラー:", error);
        this.showMessage("プレイヤー作成エラー", 3000);
        
        // エラー時に代替プレイヤーを作成（青い円、小さく）
        this.player = this.add.circle(100, 100, 12, 0x0000FF); // 半径12pxに変更
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setBounce(0);
        this.player.body.setCircle(12); // 円形の衝突ボックス
        console.log("代替プレイヤー（円）を作成: 半径12px");
    }
}
    createCamera() {
        console.log("カメラ設定開始");
        
        try {
            // カメラ追従
            this.cameras.main.startFollow(this.player);
            
            // カメラ境界設定
            if (this.map && this.map.widthInPixels) {
                this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
            } else {
                this.cameras.main.setBounds(0, 0, 800, 600);
            }
            
            this.cameras.main.setZoom(2);
            this.cameras.main.setBackgroundColor('#87CEEB');
            
            console.log("カメラ設定完了");
            
        } catch (error) {
            console.error("カメラ設定エラー:", error);
        }
    }

    createObjects() {
        console.log("オブジェクト配置開始");
        
        try {
            // 基地（あれば）
            if (this.textures.exists('base')) {
                this.base = this.physics.add.staticSprite(300, 200, 'base');
                this.physics.add.collider(this.player, this.base);
            } else {
                // 代替基地
                this.base = this.add.rectangle(300, 200, 64, 64, 0x8B4513);
                this.physics.add.existing(this.base, true);
                this.physics.add.collider(this.player, this.base);
            }
            
            // 廃墟（あれば）
            if (this.textures.exists('ruin')) {
                this.ruin = this.physics.add.staticSprite(500, 300, 'ruin');
                this.physics.add.collider(this.player, this.ruin);
            } else {
                // 代替廃墟
                this.ruin = this.add.rectangle(500, 300, 96, 64, 0x696969);
                this.physics.add.existing(this.ruin, true);
                this.physics.add.collider(this.player, this.ruin);
            }
            
            // 壁グループ
            this.walls = this.physics.add.group();
            
            // 弾丸グループ
            this.bullets = this.physics.add.group({
                maxSize: 20,
                runChildUpdate: true
            });
            
            // アイテムグループ
            this.items = this.physics.add.group();
            
            console.log("オブジェクト配置完了");
            
        } catch (error) {
            console.error("オブジェクト配置エラー:", error);
        }
    }

    createUI() {
        console.log("UI作成開始");
        
        try {
            // HUD背景
            this.hudBg = this.add.rectangle(10, 10, 250, 180, 0x000000, 0.7)
                .setOrigin(0, 0)
                .setScrollFactor(0)
                .setDepth(100);
            
            // HP表示
            this.hpText = this.add.text(20, 20, 'HP: 100/100', {
                font: '16px Arial',
                fill: '#ff5555'
            }).setScrollFactor(0).setDepth(101);
            
            // 飢餓度表示
            this.hungerText = this.add.text(20, 50, '飢餓度: 80%', {
                font: '16px Arial',
                fill: '#ffaa00'
            }).setScrollFactor(0).setDepth(101);
            
            // 選択スロット表示
            this.slotText = this.add.text(20, 80, '選択スロット: 1', {
                font: '16px Arial',
                fill: '#55ff55'
            }).setScrollFactor(0).setDepth(101);
            
            // インベントリ表示
            this.createInventoryDisplay();
            
            // 操作説明
            this.controlsText = this.add.text(20, 160, '移動: WASD | 採集: E | 設置: R | 射撃: クリック', {
                font: '12px Arial',
                fill: '#cccccc'
            }).setScrollFactor(0).setDepth(101);
            
            // デバッグ情報
            this.debugText = this.add.text(10, this.cameras.main.height - 30, '', {
                font: '12px Arial',
                fill: '#00ff00',
                backgroundColor: '#000000'
            }).setScrollFactor(0).setDepth(101);
            
            console.log("UI作成完了");
            
        } catch (error) {
            console.error("UI作成エラー:", error);
        }
    }

    createInventoryDisplay() {
        console.log("インベントリ表示作成");
        
        this.inventorySlots = [];
        const startX = 20;
        const startY = 100;
        const slotSize = 32;
        const gap = 5;
        
        for (let i = 0; i < 9; i++) {
            const x = startX + (i * (slotSize + gap));
            
            // スロット背景
            const slotBg = this.add.rectangle(x, startY, slotSize, slotSize, 0x333333, 0.8)
                .setStrokeStyle(2, 0x666666)
                .setOrigin(0, 0)
                .setScrollFactor(0)
                .setDepth(101);
            
            // スロット番号
            const slotNum = this.add.text(x + 3, startY + 3, (i + 1).toString(), {
                font: '10px Arial',
                fill: '#888888'
            }).setScrollFactor(0).setDepth(102);
            
            // アイテムカウント
            const countText = this.add.text(x + slotSize - 5, startY + slotSize - 12, '', {
                font: '12px Arial',
                fill: '#ffffff'
            }).setScrollFactor(0).setDepth(102).setOrigin(1, 0);
            
            this.inventorySlots.push({
                bg: slotBg,
                num: slotNum,
                count: countText,
                icon: null
            });
        }
        
        this.updateInventoryDisplay();
    }

    createInput() {
        console.log("入力設定開始");
        
        try {
            // キーボード入力
            this.keys = this.input.keyboard.addKeys({
                up: 'W',
                down: 'S',
                left: 'A',
                right: 'D',
                action: 'E',
                place: 'R',
                pickup: 'F'
            });
            
            // 数字キーでスロット選択
            for (let i = 0; i < 9; i++) {
                this.input.keyboard.on(`keydown-${i + 1}`, () => {
                    this.selectInventorySlot(i);
                });
            }
            
            // マウスクリックで射撃
            this.input.on('pointerdown', (pointer) => {
                if (pointer.leftButtonDown()) {
                    this.shootBullet(pointer);
                }
            });
            
            // Eキーで採集
            this.input.keyboard.on('keydown-E', () => {
                this.harvest();
            });
            
            // Rキーで設置
            this.input.keyboard.on('keydown-R', () => {
                this.place();
            });
            
            console.log("入力設定完了");
            
        } catch (error) {
            console.error("入力設定エラー:", error);
        }
    }

    startGameLoop() {
        console.log("ゲームループ開始");
        
        // 時間計測用
        this.lastUpdate = this.time.now;
        this.lastHungerUpdate = this.time.now;
    }

    update(time, delta) {
        // ゲーム時間更新
        this.gameState.gameTime += delta / 1000;
        
        // プレイヤー移動
        this.updatePlayerMovement();
        
        // 飢餓度更新
        this.updateHunger(time);
        
        // UI更新
        this.updateUI();
        
        // デバッグ情報更新
        this.updateDebugInfo();
    }

    updatePlayerMovement() {
        if (this.gameState.isPaused) return;
        
        const speed = 150;
        let velocityX = 0;
        let velocityY = 0;
        
        if (this.keys && this.keys.left.isDown) velocityX = -speed;
        if (this.keys && this.keys.right.isDown) velocityX = speed;
        if (this.keys && this.keys.up.isDown) velocityY = -speed;
        if (this.keys && this.keys.down.isDown) velocityY = speed;
        
        if (this.player && this.player.body) {
            this.player.setVelocity(velocityX, velocityY);
        }
        
        // アニメーション
        if (this.player && this.player.anims) {
            if (velocityX !== 0 || velocityY !== 0) {
                this.player.anims.play('walk', true);
            } else {
                this.player.anims.play('idle', true);
            }
        }
    }

    harvest() {
        if (this.gameState.isPaused || !this.groundLayer) return;
        
        const playerTileX = Math.floor(this.player.x / 32);
        const playerTileY = Math.floor(this.player.y / 32);
        
        // 周囲のタイルをチェック
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const tileX = playerTileX + dx;
                const tileY = playerTileY + dy;
                
                if (this.isValidTilePosition(tileX, tileY)) {
                    const tile = this.groundLayer.getTileAt(tileX, tileY);
                    
                    if (tile && tile.index !== window.TILE.AIR) {
                        this.harvestTile(tile, tileX, tileY);
                        return;
                    }
                }
            }
        }
        
        this.showMessage("採集できるものがありません", 1000);
    }

    harvestTile(tile, x, y) {
        const tileIndex = tile.index;
        let drop = null;
        
        // TILE_DROPS が定義されていれば使用
        if (window.TILE_DROPS && window.TILE_DROPS[tileIndex]) {
            drop = window.TILE_DROPS[tileIndex];
        } else {
            // デフォルトのドロップ
            const defaultDrops = {
                1: { type: "dirt", name: "土", icon: "food_icon" },
                2: { type: "grass", name: "草", icon: "food_icon" },
                3: { type: "wood", name: "木材", icon: "food_icon", count: 2 },
                4: { type: "stone", name: "石材", icon: "food_icon" }
            };
            drop = defaultDrops[tileIndex];
        }
        
        if (drop) {
            // アイテム追加
            this.addItemToInventory(drop.type, drop.name, drop.icon, drop.count || 1);
            
            // タイル破壊
            this.groundLayer.putTileAt(window.TILE.AIR, x, y);
            this.groundLayer.setCollision(window.TILE.AIR, false, true, x, y);
            
            // エフェクト
            this.createHarvestEffect(x * 32 + 16, y * 32 + 16);
            
            this.showMessage(`${drop.name}を採集しました`, 1000);
        } else {
            this.showMessage("これは採集できません", 1000);
        }
    }

    place() {
        if (this.gameState.isPaused || !this.groundLayer) return;
        
        const selectedItem = this.gameState.inventory[this.gameState.selectedSlot];
        if (!selectedItem) {
            this.showMessage("設置するアイテムがありません", 1000);
            return;
        }
        
        const playerTileX = Math.floor(this.player.x / 32);
        const playerTileY = Math.floor(this.player.y / 32);
        
        // 設置可能な位置を探す
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const tileX = playerTileX + dx;
                const tileY = playerTileY + dy;
                
                if (this.isValidTilePosition(tileX, tileY)) {
                    const tile = this.groundLayer.getTileAt(tileX, tileY);
                    
                    if (!tile || tile.index === window.TILE.AIR) {
                        // アイテムをタイルに変換
                        const tileId = this.getItemTileId(selectedItem.type);
                        if (tileId !== null) {
                            // アイテム消費
                            selectedItem.count--;
                            if (selectedItem.count <= 0) {
                                this.gameState.inventory[this.gameState.selectedSlot] = null;
                            }
                            
                            // タイル設置
                            this.groundLayer.putTileAt(tileId, tileX, tileY);
                            this.groundLayer.setCollision(tileId, true, true, tileX, tileY);
                            
                            this.updateInventoryDisplay();
                            this.showMessage(`${selectedItem.name}を設置しました`, 1000);
                            return;
                        }
                    }
                }
            }
        }
        
        this.showMessage("設置できる場所がありません", 1000);
    }

    getItemTileId(itemType) {
        if (!window.TILE) {
            // デフォルトのTILE定義
            window.TILE = {
                AIR: 0, DIRT: 1, GRASS: 2, TREE: 3, STONE: 4,
                BRICK: 5, IRON: 6, ROAD: 7, FARM: 8, FIRE: 9
            };
        }
        
        switch(itemType) {
            case 'dirt': return window.TILE.DIRT;
            case 'wood': return window.TILE.TREE;
            case 'stone': return window.TILE.STONE;
            case 'brick': return window.TILE.BRICK;
            default: return null;
        }
    }

    shootBullet(pointer) {
        if (this.gameState.isPaused) return;
        
        let bullet;
        
        // 弾丸画像があれば使用
        if (this.textures.exists('bullet')) {
            bullet = this.bullets.get(this.player.x, this.player.y, 'bullet');
        } else {
            // 代替弾丸（黄色い円）
            bullet = this.add.circle(this.player.x, this.player.y, 4, 0xFFFF00);
            this.physics.add.existing(bullet);
            this.bullets.add(bullet);
        }
        
        if (!bullet) return;
        
        bullet.setActive(true);
        bullet.setVisible(true);
        
        // 発射角度計算
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            pointer.worldX, pointer.worldY
        );
        
        // 速度設定
        const speed = 500;
        bullet.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        if (bullet.setRotation) {
            bullet.setRotation(angle);
        }
        
        // 自動削除
        this.time.delayedCall(2000, () => {
            if (bullet && bullet.active) {
                bullet.setActive(false);
                bullet.setVisible(false);
                if (bullet.destroy) bullet.destroy();
            }
        });
        
        // エフェクト
        this.createShootEffect();
    }

    updateHunger(time) {
        // 10秒ごとに飢餓度減少
        if (time - this.lastHungerUpdate > 10000) {
            this.gameState.hunger = Math.max(0, this.gameState.hunger - 1);
            this.lastHungerUpdate = time;
            
            // 飢餓ダメージ
            if (this.gameState.hunger <= 20) {
                this.takeDamage(1);
            }
        }
    }

    takeDamage(amount) {
        this.gameState.hp = Math.max(0, this.gameState.hp - amount);
        
        if (this.gameState.hp <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.gameState.isPaused = true;
        this.showMessage("ゲームオーバー！ スペースキーで再開", 0);
        
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }

    addItemToInventory(type, name, icon, count = 1) {
        // 既存のスロットを探す
        for (let i = 0; i < this.gameState.inventory.length; i++) {
            const slot = this.gameState.inventory[i];
            if (slot && slot.type === type) {
                slot.count += count;
                this.updateInventoryDisplay();
                return;
            }
        }
        
        // 空きスロットを探す
        for (let i = 0; i < this.gameState.inventory.length; i++) {
            if (!this.gameState.inventory[i]) {
                this.gameState.inventory[i] = {
                    type: type,
                    name: name,
                    count: count,
                    icon: icon
                };
                this.updateInventoryDisplay();
                return;
            }
        }
        
        this.showMessage("インベントリがいっぱいです", 1000);
    }

    selectInventorySlot(slotIndex) {
        if (slotIndex >= 0 && slotIndex < 9) {
            this.gameState.selectedSlot = slotIndex;
            this.updateInventoryDisplay();
            this.showMessage(`スロット ${slotIndex + 1} を選択`, 500);
        }
    }

    updateInventoryDisplay() {
        if (!this.inventorySlots) return;
        
        // スロット表示更新
        for (let i = 0; i < 9; i++) {
            const slotUI = this.inventorySlots[i];
            if (!slotUI) continue;
            
            // 選択状態
            if (i === this.gameState.selectedSlot) {
                slotUI.bg.setStrokeStyle(2, 0xffff00);
            } else {
                slotUI.bg.setStrokeStyle(2, 0x666666);
            }
            
            const slot = this.gameState.inventory[i];
            
            // アイテム表示
            if (slot && slot.icon && this.textures.exists(slot.icon)) {
                // アイコン画像
                if (!slotUI.icon) {
                    slotUI.icon = this.add.image(
                        slotUI.bg.x + 16,
                        slotUI.bg.y + 16,
                        slot.icon
                    ).setScrollFactor(0).setDepth(102).setScale(0.8);
                } else {
                    slotUI.icon.setTexture(slot.icon);
                    slotUI.icon.setVisible(true);
                }
                
                // カウント表示
                if (slotUI.count) {
                    slotUI.count.setText(slot.count > 1 ? slot.count.toString() : '');
                    slotUI.count.setVisible(true);
                }
            } else {
                // 空きスロット
                if (slotUI.icon) {
                    slotUI.icon.setVisible(false);
                }
                if (slotUI.count) {
                    slotUI.count.setVisible(false);
                }
            }
        }
    }

    updateUI() {
        if (!this.hpText || !this.hungerText || !this.slotText) return;
        
        // HP表示
        this.hpText.setText(`HP: ${this.gameState.hp}/${this.gameState.maxHp}`);
        
        // 飢餓度表示
        this.hungerText.setText(`飢餓度: ${this.gameState.hunger}%`);
        
        // 選択スロット
        this.slotText.setText(`選択スロット: ${this.gameState.selectedSlot + 1}`);
        
        // HPバーの色
        if (this.gameState.hp < 30) {
            this.hpText.setColor('#ff0000');
        } else if (this.gameState.hp < 60) {
            this.hpText.setColor('#ffaa00');
        } else {
            this.hpText.setColor('#55ff55');
        }
    }

    updateDebugInfo() {
        if (!this.debugText || !this.player) return;
        
        const playerTileX = this.groundLayer ? Math.floor(this.player.x / 32) : 0;
        const playerTileY = this.groundLayer ? Math.floor(this.player.y / 32) : 0;
        
        this.debugText.setText([
            `位置: ${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}`,
            `タイル: ${playerTileX}, ${playerTileY}`,
            `ゲーム時間: ${Math.floor(this.gameState.gameTime)}秒`,
            `FPS: ${this.game.loop ? Math.floor(this.game.loop.actualFps) : 0}`
        ]);
    }

    // === ユーティリティ関数 ===
    isValidTilePosition(x, y) {
        return this.map && x >= 0 && x < this.map.width && y >= 0 && y < this.map.height;
    }

    showMessage(text, duration = 2000) {
        // 既存のメッセージを削除
        if (this.messageText) {
            this.messageText.destroy();
        }
        
        // 新しいメッセージを作成
        this.messageText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            text,
            {
                font: '18px Arial',
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(103);
        
        if (duration > 0) {
            this.time.delayedCall(duration, () => {
                if (this.messageText) {
                    this.messageText.destroy();
                    this.messageText = null;
                }
            });
        }
    }

    createHarvestEffect(x, y) {
        try {
            let particles;
            
            if (this.textures.exists('bullet')) {
                particles = this.add.particles('bullet');
            } else {
                // 代替パーティクル（黄色い円）
                particles = this.add.particles(x, y, 'bullet', {
                    frame: 0,
                    quantity: 5,
                    lifespan: 500,
                    speed: { min: 50, max: 150 },
                    scale: { start: 0.5, end: 0 },
                    alpha: { start: 1, end: 0 }
                });
            }
            
            this.time.delayedCall(500, () => {
                if (particles) particles.destroy();
            });
        } catch (error) {
            console.log("エフェクト作成エラー:", error);
        }
    }

    createShootEffect() {
        try {
            // 発射エフェクト
            const flash = this.add.circle(this.player.x, this.player.y, 10, 0xffff00, 0.8);
            flash.setDepth(9);
            
            this.tweens.add({
                targets: flash,
                scale: 0,
                alpha: 0,
                duration: 100,
                onComplete: () => {
                    if (flash) flash.destroy();
                }
            });
        } catch (error) {
            console.log("発射エフェクトエラー:", error);
        }
    }
};


                                          //オブジェクトはまだでかい　プレイやー修正1/28
