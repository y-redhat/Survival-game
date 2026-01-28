window.MainScene = class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        // ローディング進捗表示
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: '読み込み中...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        const percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);
        
        const assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        assetText.setOrigin(0.5, 0.5);
        
        // ローディング進捗の更新
        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });
        
        this.load.on('fileprogress', function (file) {
            assetText.setText('読み込み中: ' + file.key);
        });
        
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });
        
        // アセットの読み込み
        // タイルセット
        this.load.image("tiles", "assets/tiles/tiles.png");
        
        // プレイヤー
        this.load.image("player", "assets/player/player.png");
        
        // オブジェクト
        this.load.image("base", "assets/objects/基地.png");
        this.load.image("ruin1", "assets/objects/廃墟1.png");
        this.load.image("wall", "assets/objects/壁.png");
        
        // アイテム・演出
        this.load.image("bullet", "assets/objects/発射された弾丸.png");
        this.load.image("food", "assets/items/ご飯.png");
        
        // アイテムアイコン
        this.load.image("wood_icon", "assets/tiles/木.png");
        this.load.image("stone_icon", "assets/tiles/石.png");
        this.load.image("dirt_icon", "assets/tiles/土.png");
        this.load.image("brick_icon", "assets/tiles/レンガ.png");
        this.load.image("iron_icon", "assets/tiles/鉄.png");
    }

    create() {
        // ゲーム状態の初期化
        this.gameState = {
            hp: 100,
            maxHp: 100,
            hunger: 80,
            maxHunger: 100,
            inventory: new Array(9).fill(null),
            selectedSlot: 0,
            isDebug: false
        };
        
        // デフォルトアイテム
        this.gameState.inventory[0] = { type: "wood", name: "木材", count: 5, icon: "wood_icon" };
        this.gameState.inventory[1] = { type: "stone", name: "石材", count: 3, icon: "stone_icon" };
        this.gameState.inventory[2] = { type: "food", name: "ご飯", count: 2, icon: "food" };
        this.gameState.inventory[3] = { type: "dirt", name: "土", count: 10, icon: "dirt_icon" };
        
        // 時間管理
        this.lastHungerUpdate = 0;
        this.dayTime = 0;
        this.isDay = true;
        
        // ワールド生成
        this.createWorld();
        
        // プレイヤー
        this.createPlayer();
        
        // カメラ
        this.createCamera();
        
        // オブジェクト
        this.createObjects();
        
        // 入力
        this.createInput();
        
        // UI
        this.createUI();
        
        // デバッグ情報
        this.createDebug();
        
        // 初期HUD更新
        this.updateHUD();
        
        // ゲーム開始メッセージ
        this.showMessage("ゲーム開始！ WASDで移動、Eで採集、クリックで射撃");
    }
    
    showMessage(text) {
        const message = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            text,
            {
                font: "16px monospace",
                fill: "#ffffff",
                backgroundColor: "#000000",
                padding: { x: 10, y: 5 }
            }
        );
        message.setOrigin(0.5, 0.5);
        message.setScrollFactor(0);
        message.setDepth(1000);
        
        // 3秒後に消える
        this.time.delayedCall(3000, () => {
            message.destroy();
        });
    }

    update(time, delta) {
        this.updatePlayer();
        this.updateHunger(time);
        this.updateDayNight(time);
        
        if (this.gameState.isDebug) {
            this.updateDebugInfo();
        }
    }

    // === ワールド生成 ===
    createWorld() {
        this.map = this.make.tilemap({
            data: window.worldData,
            tileWidth: 32,
            tileHeight: 32
        });

        this.tileset = this.map.addTilesetImage("tiles");
        this.layer = this.map.createLayer(0, this.tileset, 0, 0);
        
        // 当たり判定を設定
        const collidableTiles = [
            window.TILE.DIRT,
            window.TILE.STONE,
            window.TILE.BRICK,
            window.TILE.IRON,
            window.TILE.TREE,
            window.TILE.FIRE
        ];
        this.layer.setCollision(collidableTiles);
        
        // ワールドの境界を設定
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }

    // === プレイヤー ===
    createPlayer() {
        this.player = this.physics.add.sprite(100, 100, "player");
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(24, 24);
        this.player.setScale(1);
        
        // プレイヤーとタイルの衝突
        this.physics.add.collider(this.player, this.layer);
        
        // 炎タイルでダメージを受ける
        this.physics.add.overlap(this.player, this.layer, (player, tile) => {
            if (tile.index === window.TILE.FIRE) {
                this.takeDamage(1);
            }
        }, null, this);
    }

    updatePlayer() {
        const speed = 150;
        this.player.setVelocity(0);

        if (this.keys.left.isDown) this.player.setVelocityX(-speed);
        if (this.keys.right.isDown) this.player.setVelocityX(speed);
        if (this.keys.up.isDown) this.player.setVelocityY(-speed);
        if (this.keys.down.isDown) this.player.setVelocityY(speed);
    }

    // === カメラ ===
    createCamera() {
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(
            0,
            0,
            this.map.widthInPixels,
            this.map.heightInPixels
        );
        this.cameras.main.setZoom(2);
        
        // 昼と夜のカラーフィルター
        this.dayFilter = new Phaser.Display.Color(255, 255, 255);
        this.nightFilter = new Phaser.Display.Color(100, 100, 200);
    }

    // === オブジェクト ===
    createObjects() {
        // 基地
        this.base = this.physics.add.staticSprite(300, 200, "base");
        this.physics.add.collider(this.player, this.base);
        
        // 廃墟
        this.ruin = this.physics.add.staticSprite(400, 200, "ruin1");
        this.physics.add.collider(this.player, this.ruin);
        
        // 壁のグループ
        this.walls = this.physics.add.group();
        
        // 弾丸のグループ
        this.bullets = this.physics.add.group();
    }

    // === 入力 ===
    createInput() {
        this.keys = this.input.keyboard.addKeys({
            up: "W",
            down: "S",
            left: "A",
            right: "D",
            action: "E",
            debug: "F3"
        });
        
        // マウスクリックで射撃
        this.input.on("pointerdown", (pointer) => {
            this.shootBullet(pointer);
        });
        
        // Eキーで採集/設置
        this.input.keyboard.on("keydown-E", () => {
            this.harvestOrPlace();
        });
        
        // インベントリスロット選択 (1-9)
        for (let i = 1; i <= 9; i++) {
            this.input.keyboard.on(`keydown-${i}`, () => {
                this.selectInventorySlot(i - 1);
            });
        }
        
        // F3でデバッグ表示切り替え
        this.input.keyboard.on("keydown-F3", () => {
            this.gameState.isDebug = !this.gameState.isDebug;
            document.getElementById("debug-info").style.display = 
                this.gameState.isDebug ? "block" : "none";
        });
    }
    
    // === 弾丸発射 ===
    shootBullet(pointer) {
        const bullet = this.physics.add.sprite(
            this.player.x,
            this.player.y,
            "bullet"
        );
        
        // マウス方向に発射
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            pointer.worldX, pointer.worldY
        );
        
        const speed = 500;
        bullet.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        bullet.setRotation(angle);
        
        // 画面外に出たら削除
        bullet.setCollideWorldBounds(true);
        bullet.body.onWorldBounds = true;
        bullet.body.world.on('worldbounds', (body) => {
            if (body.gameObject === bullet) {
                bullet.destroy();
            }
        });
        
        // 10秒後に消滅
        this.time.delayedCall(10000, () => {
            if (bullet.active) bullet.destroy();
        });
        
        this.bullets.add(bullet);
    }
    
    // === 採集・設置 ===
    harvestOrPlace() {
        const playerTileX = this.map.worldToTileX(this.player.x);
        const playerTileY = this.map.worldToTileY(this.player.y);
        
        // プレイヤーの周囲1タイルをチェック
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const checkX = playerTileX + dx;
                const checkY = playerTileY + dy;
                
                if (this.isValidTile(checkX, checkY)) {
                    const tile = this.layer.getTileAt(checkX, checkY);
                    
                    if (tile && tile.index !== window.TILE.AIR) {
                        // 採集（タイルを破壊）
                        this.harvestTile(tile, checkX, checkY);
                        return;
                    } else if (!tile || tile.index === window.TILE.AIR) {
                        // 設置（選択したアイテムを設置）
                        this.placeTile(checkX, checkY);
                        return;
                    }
                }
            }
        }
    }
    
    isValidTile(x, y) {
        return x >= 0 && x < this.map.width && y >= 0 && y < this.map.height;
    }
    
    harvestTile(tile, x, y) {
        const tileId = tile.index;
        const properties = window.TILE_PROPERTIES[tileId];
        
        if (properties && properties.harvestable && properties.drops) {
            // アイテムをインベントリに追加
            const drop = properties.drops;
            this.addToInventory(drop.type, properties.name, drop.icon, drop.count || 1);
            
            // タイルを空気に変更（破壊）
            this.layer.putTileAt(window.TILE.AIR, x, y);
            
            // 当たり判定を更新
            this.layer.setCollision(window.TILE.AIR, false, true, x, y);
            
            // 効果音（将来的に）
            this.showMessage(properties.name + "を採集しました");
        } else {
            this.showMessage("これは採集できません");
        }
    }
    
    placeTile(x, y) {
        const selectedSlot = this.gameState.selectedSlot;
        const item = this.gameState.inventory[selectedSlot];
        
        if (!item) {
            this.showMessage("設置するアイテムが選択されていません");
            return;
        }
        
        // アイテムタイプからタイルIDを決定
        let tileId = null;
        switch(item.type) {
            case "dirt": tileId = window.TILE.DIRT; break;
            case "wood": tileId = window.TILE.TREE; break;
            case "stone": tileId = window.TILE.STONE; break;
            case "brick": tileId = window.TILE.BRICK; break;
            case "iron": tileId = window.TILE.IRON; break;
            default:
                this.showMessage("これは設置できません: " + item.name);
                return;
        }
        
        // アイテムを消費してタイルを設置
        item.count--;
        if (item.count <= 0) {
            this.gameState.inventory[selectedSlot] = null;
        }
        
        // タイルを設置
        this.layer.putTileAt(tileId, x, y);
        
        // 当たり判定を設定
        this.layer.setCollision(tileId, true, true, x, y);
        
        this.updateHUD();
        this.showMessage(item.name + "を設置しました");
    }
    
    // === インベントリ管理 ===
    addToInventory(itemType, itemName, iconKey, count = 1) {
        // 既に同じアイテムがあるスロットを探す
        for (let i = 0; i < this.gameState.inventory.length; i++) {
            const slot = this.gameState.inventory[i];
            if (slot && slot.type === itemType) {
                slot.count += count;
                this.updateHUD();
                return;
            }
        }
        
        // 空きスロットを探す
        for (let i = 0; i < this.gameState.inventory.length; i++) {
            if (this.gameState.inventory[i] === null) {
                this.gameState.inventory[i] = {
                    type: itemType,
                    name: itemName,
                    count: count,
                    icon: iconKey
                };
                this.updateHUD();
                return;
            }
        }
        
        this.showMessage("インベントリがいっぱいです");
    }
    
    selectInventorySlot(index) {
        if (index >= 0 && index < 9) {
            this.gameState.selectedSlot = index;
            this.updateHUD();
        }
    }
    
    // === 飢餓システム ===
    updateHunger(time) {
        // 10秒ごとに飢餓度が1減少
        if (time - this.lastHungerUpdate > 10000) {
            this.gameState.hunger = Math.max(0, this.gameState.hunger - 1);
            this.lastHungerUpdate = time;
            this.updateHUD();
            
            // 飢餓度が低いとダメージ
            if (this.gameState.hunger <= 20) {
                this.takeDamage(2);
                this.showMessage("空腹です！ 何か食べ物を探しましょう");
            } else if (this.gameState.hunger === 0) {
                this.takeDamage(5);
            }
        }
    }
    
    takeDamage(amount) {
        this.gameState.hp = Math.max(0, this.gameState.hp - amount);
        this.updateHUD();
        
        if (this.gameState.hp <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.showMessage("ゲームオーバー！ リロードして再開してください");
        this.physics.pause();
        this.player.setTint(0xff0000);
        
        // 操作を無効化
        this.input.keyboard.enabled = false;
        this.input.mouse.enabled = false;
    }
    
    // === 昼夜システム ===
    updateDayNight(time) {
        // ゲーム内時間を進める（1分 = 1秒）
        this.dayTime += 0.001;
        if (this.dayTime >= 1) this.dayTime = 0;
        
        // 昼夜の切り替え
        const wasDay = this.isDay;
        this.isDay = this.dayTime < 0.5;
        
        if (wasDay !== this.isDay) {
            this.showMessage(this.isDay ? "夜が明けました" : "日が暮れました");
        }
        
        // カラーフィルターを適用
        if (this.isDay) {
            this.cameras.main.setBackgroundColor('#87CEEB');
        } else {
            this.cameras.main.setBackgroundColor('#191970');
        }
    }
    
    // === UI ===
    createUI() {
        // インベントリスロットを生成
        this.createInventorySlots();
    }
    
    createInventorySlots() {
        const container = document.getElementById("inventory-slots");
        container.innerHTML = "";
        
        for (let i = 0; i < 9; i++) {
            const slotDiv = document.createElement("div");
            slotDiv.className = "inv-slot";
            slotDiv.dataset.slot = i;
            slotDiv.onclick = () => this.selectInventorySlot(i);
            
            const indexSpan = document.createElement("span");
            indexSpan.className = "slot-index";
            indexSpan.textContent = i + 1;
            indexSpan.style.fontSize = "8px";
            indexSpan.style.position = "absolute";
            indexSpan.style.top = "1px";
            indexSpan.style.left = "1px";
            indexSpan.style.color = "#888";
            
            const countSpan = document.createElement("span");
            countSpan.className = "slot-count";
            
            slotDiv.appendChild(indexSpan);
            slotDiv.appendChild(countSpan);
            container.appendChild(slotDiv);
        }
    }
    
    updateHUD() {
        // HP
        document.getElementById("hp-value").textContent = this.gameState.hp;
        document.getElementById("hp-bar").style.width = 
            (this.gameState.hp / this.gameState.maxHp * 100) + "%";
        
        // 飢餓度
        document.getElementById("hunger-value").textContent = this.gameState.hunger;
        document.getElementById("hunger-bar").style.width = 
            (this.gameState.hunger / this.gameState.maxHunger * 100) + "%";
        
        // 選択スロット
        document.getElementById("selected-slot").textContent = this.gameState.selectedSlot + 1;
        
        // インベントリスロット
        const slotElements = document.querySelectorAll(".inv-slot");
        slotElements.forEach((slotDiv, index) => {
            const item = this.gameState.inventory[index];
            const countSpan = slotDiv.querySelector(".slot-count");
            
            if (index === this.gameState.selectedSlot) {
                slotDiv.classList.add("selected");
            } else {
                slotDiv.classList.remove("selected");
            }
            
            if (item) {
                slotDiv.classList.remove("empty");
                slotDiv.title = `${item.name} (${item.count})`;
                countSpan.textContent = item.count;
                slotDiv.style.backgroundImage = `url('assets/tiles/${item.icon.includes('_icon') ? item.icon : 'tiles'}.png')`;
                slotDiv.style.backgroundSize = "cover";
            } else {
                slotDiv.classList.add("empty");
                slotDiv.title = "空きスロット";
                countSpan.textContent = "";
                slotDiv.style.backgroundImage = "";
                slotDiv.style.backgroundColor = "rgba(40, 40, 40, 0.9)";
            }
        });
    }
    
    // === デバッグ ===
    createDebug() {
        // デバッグ情報表示用のdivはHTML側ですでに存在
    }
    
    updateDebugInfo() {
        const playerTileX = this.map.worldToTileX(this.player.x);
        const playerTileY = this.map.worldToTileY(this.player.y);
        const mouseWorldX = this.input.activePointer.worldX;
        const mouseWorldY = this.input.activePointer.worldY;
        const mouseTileX = this.map.worldToTileX(mouseWorldX);
        const mouseTileY = this.map.worldToTileY(mouseWorldY);
        
        const debugInfo = `
            プレイヤー座標: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})<br>
            プレイヤータイル: (${playerTileX}, ${playerTileY})<br>
            マウス座標: (${Math.round(mouseWorldX)}, ${Math.round(mouseWorldY)})<br>
            マウスタイル: (${mouseTileX}, ${mouseTileY})<br>
            ゲーム内時間: ${(this.dayTime * 24).toFixed(2)}時<br>
            昼夜: ${this.isDay ? "昼" : "夜"}<br>
            FPS: ${Math.round(this.game.loop.actualFps)}
        `;
        
        document.getElementById("debug-info").innerHTML = debugInfo;
    }
};
