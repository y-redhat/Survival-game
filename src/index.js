// 起動ログ
console.log("=== ゲーム起動開始 ===");
console.log("Phaser バージョン:", Phaser.VERSION);

// 変数チェック
console.log("TILE:", window.TILE);
console.log("worldData:", window.worldData);
console.log("MainScene:", window.MainScene);

// ゲーム設定
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true  // デバッグ表示をONにする
        }
    },
    backgroundColor: '#000000',
    scene: null, // 後で設定
    callbacks: {
        postBoot: function(game) {
            console.log("Phaser 起動完了");
        }
    }
};

// ゲームインスタンス作成
try {
    window.game = new Phaser.Game(config);
    console.log("ゲームインスタンス作成成功");
    
    // MainSceneが利用可能か確認
    if (window.MainScene && typeof window.MainScene === 'function') {
        console.log("MainSceneを追加します");
        
        // シーンを追加
        window.game.scene.add('MainScene', window.MainScene);
        
        // シーンを開始
        window.game.scene.start('MainScene');
        console.log("MainSceneを開始しました");
        
        // デバッグ表示
        document.getElementById('status').textContent = 'ゲーム実行中';
        document.getElementById('status').style.color = 'lime';
        
        // FPS表示
        setInterval(function() {
            if (window.game && window.game.loop) {
                document.getElementById('fps').textContent = 
                    Math.round(window.game.loop.actualFps);
            }
        }, 1000);
        
    } else {
        console.error("MainSceneが関数ではありません:", window.MainScene);
        document.getElementById('status').textContent = 'MainSceneエラー';
        document.getElementById('status').style.color = 'red';
        
        // 代替シーンを作成
        window.game.scene.add('FallbackScene', {
            create: function() {
                this.add.text(400, 300, 'MainSceneが読み込めません', {
                    fontSize: '24px',
                    fill: '#ff0000'
                }).setOrigin(0.5);
            }
        });
        window.game.scene.start('FallbackScene');
    }
    
} catch (error) {
    console.error("ゲーム起動エラー:", error);
    document.getElementById('status').textContent = '起動エラー: ' + error.message;
    document.getElementById('status').style.color = 'red';
}
