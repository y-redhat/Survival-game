window.MainScene = class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        console.log("MainScene 初期化");
    }

    preload() {
        console.log("アセット読み込み開始");
        
        // ローディング表示
        this.createLoadingScreen();
        
        // タイルセット (10タイル横並び 32x320)
        this.load.image('tiles', 'assets/tiles/tiles.png');
        
        // プレイヤー
        this.load.image('player', 'assets/player/player.png');
        
        // オブジェクト
        this.load.image('base', 'assets/objects/base.png');
        this.load.image('ruin', 'assets/objects/ruin1.png');
        this.load.image('wall', 'assets/objects/wall.png');
        this.load.image('bullet', 'assets/objects/bullet.png');
        
        // アイテムアイコン
        this.load.image('wood_icon', 'assets/tiles/wood_icon.png');
        this.load.image('stone_icon', 'assets/tiles/stone_icon.png');
        this.load.image('dirt_icon', 'assets/tiles/dirt_icon.png');
        this.load.image('food_icon', 'assets/tiles/food_icon.png');
        this.load.image('food_item', 'assets/items/food.png');
        
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
        
        // ゲーム状態初期化
        this.initGameState();
        
        // ワールド生成
        this.createWorld();
        
        // プレイヤー
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

    initGameState() {
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
            isDay: true,
            
            // リソース
            resources: {
                wood: 5,
                stone: 3,
                dirt: 10,
                food: 2
            }
        };
        
        // 初期アイテム
        this.gameState.inventory[0] = { 
            type: "wood", 
            name: "木材", 
            count: 5, 
            icon: "wood_icon" 
        };
        this.gameState.inventory[1] = { 
            type: "stone", 
            name: "石材", 
            count: 3, 
            icon: "stone_icon" 
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
            icon: "dirt_icon" 
        };
    }

    createWorld() {
        console.log("ワールド生成");
        
        // タイルマップ作成
        this.map = this.make.tilemap({
            data: window.worldData,
            tileWidth: 32,
            tileHeight: 32
        });

        // タイルセット追加
        this.tileset = this.map.addTilesetImage('tiles');
        
        // レイヤー作成
        this.groundLayer = this.map.createLayer(0, this.tileset, 0, 0);
        
        // 衝突判定設定
        this.groundLayer.setCollision(window.COLLIDABLE_TILES);
        
        // ワールド境界設定
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        
        console.log("ワールドサイズ:", this.map.width, "x", this.map.height);
    }

    createPlayer() {
        console.log("プレイヤー作成");
        
        // プレイヤースプライト
        this.player = this.physics.add.sprite(100, 100, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(1);
        
        // 衝突判定
        this.physics.add.collider(this.player, this.groundLayer);
        
        // プレイヤー情報
        this.player.depth = 10;
        this.player.health = 100;
        
        console.log("プレイヤー位置:", this.player.x, this.player.y);
    }

    createCamera() {
        // カメラ追従
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(2);
        this.cameras.main.setBackgroundColor('#87CEEB');
        
        console.log("カメラ設定完了");
    }

    createObjects() {
        console.log("オブジェクト配置");
        
        // 基地
        this.base = this.physics.add.staticSprite(300, 200, 'base');
        this.physics.add.collider(this.player, this.base);
        
        // 廃墟
        this.ruin = this.physics.add.staticSprite(500, 300, 'ruin');
        this.physics.add.collider(this.player, this.ruin);
        
        // 壁グループ
        this.walls = this.physics.add.group();
        
        // 弾丸グループ
        this.bullets = this.physics.add.group({
            maxSize: 20,
            runChildUpdate: true
        });
        
        // アイテムグループ
        this.items = this.physics.add.group();
    }

    createUI() {
        console.log("UI作成");
        
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
    }

    createInventoryDisplay() {
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
        console.log("入力設定");
        
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
    }

    startGameLoop() {
        // 時間計測用
        this.lastUpdate = this.time.now;
        this.lastHungerUpdate = this.time.now;
        
        // ゲームループ開始
        console.log("ゲームループ開始");
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
        
        if (this.keys.left.isDown) velocityX = -speed;
        if (this.keys.right.isDown) velocityX = speed;
        if (this.keys.up.isDown) velocityY = -speed;
        if (this.keys.down.isDown) velocityY = speed;
        
        this.player.setVelocity(velocityX, velocityY);
        
        // アニメーション（将来的に）
        if (velocityX !== 0 || velocityY !== 0) {
            this.player.anims.play('walk', true);
        } else {
            this.player.anims.play('idle', true);
        }
    }

    harvest() {
        if (this.gameState.isPaused) return;
        
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
        const drop = window.TILE_DROPS[tileIndex];
        
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
        if (this.gameState.isPaused) return;
        
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
        
        const bullet = this.bullets.get(this.player.x, this.player.y, 'bullet');
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
        bullet.setRotation(angle);
        
        // 自動削除
        this.time.delayedCall(2000, () => {
            if (bullet.active) {
                bullet.setActive(false);
                bullet.setVisible(false);
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
        // スロット表示更新
        for (let i = 0; i < 9; i++) {
            const slot = this.gameState.inventory[i];
            const slotUI = this.inventorySlots[i];
            
            // 選択状態
            if (i === this.gameState.selectedSlot) {
                slotUI.bg.setStrokeStyle(2, 0xffff00);
            } else {
                slotUI.bg.setStrokeStyle(2, 0x666666);
            }
            
            // アイテム表示
            if (slot && slot.icon) {
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
                slotUI.count.setText(slot.count > 1 ? slot.count.toString() : '');
                slotUI.count.setVisible(true);
            } else {
                // 空きスロット
                if (slotUI.icon) {
                    slotUI.icon.setVisible(false);
                }
                slotUI.count.setVisible(false);
            }
        }
    }

    updateUI() {
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
        const playerTileX = Math.floor(this.player.x / 32);
        const playerTileY = Math.floor(this.player.y / 32);
        
        this.debugText.setText([
            `位置: ${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}`,
            `タイル: ${playerTileX}, ${playerTileY}`,
            `ゲーム時間: ${Math.floor(this.gameState.gameTime)}秒`,
            `FPS: ${Math.floor(this.game.loop.actualFps)}`
        ]);
    }

    // === ユーティリティ関数 ===
    isValidTilePosition(x, y) {
        return x >= 0 && x < this.map.width && y >= 0 && y < this.map.height;
    }

    showMessage(text, duration = 2000) {
        if (this.messageText) {
            this.messageText.destroy();
        }
        
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
        const particles = this.add.particles('bullet');
        const emitter = particles.createEmitter({
            x: x,
            y: y,
            speed: { min: -50, max: 50 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            quantity: 5,
            blendMode: 'ADD'
        });
        
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
    }

    createShootEffect() {
        // 発射エフェクト
        const flash = this.add.circle(this.player.x, this.player.y, 10, 0xffff00, 0.8);
        flash.setDepth(9);
        
        this.tweens.add({
            targets: flash,
            scale: 0,
            alpha: 0,
            duration: 100,
            onComplete: () => {
                flash.destroy();
            }
        });
    }
};
