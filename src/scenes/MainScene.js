console.log("MainScene.js 読み込み開始");

// シーン定義
window.MainScene = class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        console.log("MainScene コンストラクタ");
    }

    preload() {
        console.log("preload() 呼び出し");
        
        // テスト画像を読み込み
        this.load.image('test', 'https://labs.phaser.io/assets/sprites/phaser3-logo.png');
        
        // タイルセット
        this.load.image('tiles', 'assets/tiles/tiles.png');
    }

    create() {
        console.log("create() 呼び出し");
        
        // 背景色を設定（表示確認用）
        this.cameras.main.setBackgroundColor('#2d2d2d');
        
        // テスト表示
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // 1. タイトル
        this.add.text(centerX, 100, '生存サバイバルゲーム', {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 2. テスト画像
        this.add.image(centerX, centerY - 50, 'test').setScale(0.5);
        
        // 3. 状態表示
        this.add.text(centerX, centerY + 50, 'ゲーム起動成功！', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5);
        
        // 4. 操作説明
        this.add.text(centerX, centerY + 100, '移動: WASD  |  採集: E  |  射撃: クリック', {
            fontSize: '16px',
            fill: '#cccccc'
        }).setOrigin(0.5);
        
        // 5. ワールド生成テスト
        this.createTestWorld();
        
        // 6. プレイヤー
        this.createTestPlayer();
        
        console.log("ゲーム起動完了");
    }

    update() {
        // 空のupdateメソッド
    }

    // === テスト用メソッド ===
    createTestWorld() {
        console.log("テストワールド生成");
        
        try {
            // シンプルなマップを作成
            const mapData = [];
            for (let y = 0; y < 10; y++) {
                mapData[y] = [];
                for (let x = 0; x < 16; x++) {
                    // 草地と土のパターン
                    mapData[y][x] = (x + y) % 3 === 0 ? 2 : 1;
                }
            }
            
            const map = this.make.tilemap({
                data: mapData,
                tileWidth: 32,
                tileHeight: 32
            });
            
            const tileset = map.addTilesetImage('tiles');
            const layer = map.createLayer(0, tileset, 0, 200);
            
            console.log("ワールド生成成功");
            
        } catch (error) {
            console.error("ワールド生成エラー:", error);
            this.add.text(400, 400, 'ワールド生成エラー: ' + error.message, {
                fontSize: '16px',
                fill: '#ff0000'
            }).setOrigin(0.5);
        }
    }

    createTestPlayer() {
        console.log("テストプレイヤー生成");
        
        // プレイヤー代わりの円
        this.player = this.add.circle(100, 300, 15, 0x00aaff);
        
        // キーボード入力
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {
            w: this.input.keyboard.addKey('W'),
            a: this.input.keyboard.addKey('A'),
            s: this.input.keyboard.addKey('S'),
            d: this.input.keyboard.addKey('D')
        };
        
        // 簡易移動
        this.input.keyboard.on('keydown-W', () => this.player.y -= 10);
        this.input.keyboard.on('keydown-A', () => this.player.x -= 10);
        this.input.keyboard.on('keydown-S', () => this.player.y += 10);
        this.input.keyboard.on('keydown-D', () => this.player.x += 10);
        
        console.log("プレイヤー生成成功");
    }
};

console.log("MainScene.js 読み込み完了");
