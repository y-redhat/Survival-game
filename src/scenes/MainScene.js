import { TILE } from "../data/tiles.js";
import { worldData } from "../data/world.js";

export default class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        // タイルセット - 画像を1枚にまとめるか個別に
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
        
        // アイテムアイコン用（簡易的にオブジェクト画像を流用）
        this.load.image("wood_icon", "assets/tiles/木.png");
        this.load.image("stone_icon", "assets/tiles/石.png");
    }

    create() {
        // ゲーム状態の初期化
        this.gameState = {
            hp: 100,
            hunger: 80,
            inventory: new Array(9).fill(null),
            selectedSlot: 0
        };
        
        // デフォルトで最初のスロットに木材と石材を追加（テスト用）
        this.gameState.inventory[0] = { type: "wood", count: 3, icon: "wood_icon" };
        this.gameState.inventory[1] = { type: "stone", count: 2, icon: "stone_icon" };
        this.gameState.inventory[2] = { type: "food", count: 1, icon: "food" };
        
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
        
        // HUD更新
        this.updateHUD();
        
        // デバッグ用にマウス位置表示
        this.createDebug();
    }

    update() {
        this.updatePlayer();
        this.updateHunger();
    }

    // === ワールド生成 ===
    createWorld() {
        this.map = this.make.tilemap({
            data: worldData,
            tileWidth: 32,
            tileHeight: 32
        });

        this.tileset = this.map.addTilesetImage("tiles");
        this.layer = this.map.createLayer(0, this.tileset, 0, 0);
        
        // タイルのプロパティを設定（採集できるかどうか）
        this.layer.setTileIndexCallback(TILE.TREE, () => {}, this);
        
        // 当たり判定
        this.layer.setCollision([
            TILE.DIRT,
            TILE.STONE,
            TILE.BRICK,
            TILE.IRON,
            TILE.TREE
        ]);
    }

    // === プレイヤー ===
    createPlayer() {
        this.player = this.physics.add.sprite(100, 100, "player");
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(24, 24);
        this.player.setScale(1);
        
        this.physics.add.collider(this.player, this.layer);
        
        // 採集範囲表示用（デバッグ）
        this.harvestZone = this.add.graphics();
    }

    updatePlayer() {
        const speed = 150;
        this.player.setVelocity(0);

        if (this.keys.left.isDown)  this.player.setVelocityX(-speed);
        if (this.keys.right.isDown) this.player.setVelocityX(speed);
        if (this.keys.up.isDown)    this.player.setVelocityY(-speed);
        if (this.keys.down.isDown)  this.player.setVelocityY(speed);
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
    }

    // === オブジェクト ===
    createObjects() {
        // 基地（衝突あり）
        this.base = this.physics.add.staticSprite(300, 200, "base");
        this.physics.add.collider(this.player, this.base);
        
        // 廃墟（衝突あり）
        this.ruin = this.physics.add.staticSprite(400, 200, "ruin1");
        this.physics.add.collider(this.player, this.ruin);
        
        // 壁（プレイヤーが設置できる例）
        this.walls = this.physics.add.group();
    }

    // === 入力 ===
    createInput() {
        this.keys = this.input.keyboard.addKeys({
            up: "W",
            down: "S",
            left: "A",
            right: "D",
            action: "E",
            slot1: "ONE",
            slot2: "TWO",
            slot3: "THREE",
            slot4: "FOUR",
            slot5: "FIVE",
            slot6: "SIX",
            slot7: "SEVEN",
            slot8: "EIGHT",
            slot9: "NINE"
        });
        
        // マウスクリックで射撃
        this.input.on("pointerdown", (pointer) => {
            this.shootBullet(pointer);
        });
        
        // Eキーで採集/設置
        this.input.keyboard.on("keydown-E", () => {
            this.harvestOrPlace();
        });
        
        // インベントリスロット選択
        for (let i = 1; i <= 9; i++) {
            this.input.keyboard.on(`keydown-${i}`, () => {
                this.selectInventorySlot(i - 1);
            });
        }
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
        
        const speed = 400;
        bullet.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        // 3秒後に消滅
        this.time.delayedCall(3000, () => {
            bullet.destroy();
        });
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
                
                if (checkX >= 0 && checkX < this.map.width && 
                    checkY >= 0 && checkY < this.map.height) {
                    
                    const tile = this.layer.getTileAt(checkX, checkY);
                    
                    if (tile && tile.index !== TILE.AIR) {
                        // 採集（タイルを破壊）
                        this.harvestTile(tile, checkX, checkY);
                        return;
                    }
                }
            }
        }
    }
    
    harvestTile(tile, x, y) {
        // タイルの種類に応じたアイテムを追加
        let itemType = null;
        let iconKey = null;
        
        switch(tile.index) {
            case TILE.TREE:
                itemType = "wood";
                iconKey = "wood_icon";
                break;
            case TILE.STONE:
                itemType = "stone";
                iconKey = "stone_icon";
                break;
            case TILE.GRASS:
            case TILE.DIRT:
                itemType = "dirt";
                iconKey = "tiles"; // 簡易的に
                break;
        }
        
        if (itemType) {
            // アイテムをインベントリに追加
            this.addToInventory(itemType, iconKey);
            
            // タイルを空気に変更（破壊）
            this.layer.putTileAt(TILE.AIR, x, y);
            
            // 当たり判定を更新
            this.layer.setCollision(TILE.AIR, false, true, x, y);
        }
    }
    
    // === インベントリ管理 ===
    addToInventory(itemType, iconKey) {
        // 既に同じアイテムがあるスロットを探す
        for (let i = 0; i < this.gameState.inventory.length; i++) {
            const slot = this.gameState.inventory[i];
            if (slot && slot.type === itemType) {
                slot.count++;
                this.updateHUD();
                return;
            }
        }
        
        // 空きスロットを探す
        for (let i = 0; i < this.gameState.inventory.length; i++) {
            if (this.gameState.inventory[i] === null) {
                this.gameState.inventory[i] = {
                    type: itemType,
                    count: 1,
                    icon: iconKey
                };
                this.updateHUD();
                return;
            }
        }
        
        console.log("インベントリがいっぱいです");
    }
    
    selectInventorySlot(index) {
        if (index >= 0 && index < 9) {
            this.gameState.selectedSlot = index;
            this.updateHUD();
        }
    }
    
    // === 飢餓システム ===
    updateHunger() {
        // 5秒ごとに飢餓度が1減少
        if (!this.lastHungerUpdate) {
            this.lastHungerUpdate = this.time.now;
        }
        
        if (this.time.now - this.lastHungerUpdate > 5000) {
            this.gameState.hunger = Math.max(0, this.gameState.hunger - 1);
            this.lastHungerUpdate = this.time.now;
            this.updateHUD();
            
            // 飢餓度が低いとダメージ
            if (this.gameState.hunger <= 20) {
                this.gameState.hp = Math.max(0, this.gameState.hp - 5);
                this.updateHUD();
                
                if (this.gameState.hp <= 0) {
                    console.log("ゲームオーバー");
                }
            }
        }
    }
    
    // === HUD更新 ===
    updateHUD() {
        // HPと飢餓度
        document.getElementById("hp").textContent = this.gameState.hp;
        document.getElementById("hunger").textContent = this.gameState.hunger;
        document.getElementById("selected-slot").textContent = this.gameState.selectedSlot + 1;
        
        // インベントリスロット表示
        const container = document.getElementById("inventory-slots");
        container.innerHTML = "";
        
        for (let i = 0; i < this.gameState.inventory.length; i++) {
            const slotDiv = document.createElement("div");
            slotDiv.className = "inv-slot";
            
            if (i === this.gameState.selectedSlot) {
                slotDiv.classList.add("selected");
            }
            
            const slot = this.gameState.inventory[i];
            if (slot) {
                slotDiv.textContent = slot.count;
                slotDiv.title = `${slot.type} (${slot.count})`;
            } else {
                slotDiv.textContent = "空";
            }
            
            container.appendChild(slotDiv);
        }
    }
    
    // === デバッグ用 ===
    createDebug() {
        this.debugText = this.add.text(10, 10, "", {
            fontSize: "12px",
            fill: "#fff",
            backgroundColor: "#000"
        }).setScrollFactor(0).setDepth(100);
        
        // マウス位置表示
        this.input.on("pointermove", (pointer) => {
            const tileX = this.map.worldToTileX(pointer.worldX);
            const tileY = this.map.worldToTileY(pointer.worldY);
            this.debugText.setText([
                `マウス: ${pointer.worldX.toFixed(0)}, ${pointer.worldY.toFixed(0)}`,
                `タイル: ${tileX}, ${tileY}`,
                `プレイヤー: ${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)}`
            ]);
        });
    }
}
