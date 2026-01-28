// ゲーム設定
const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    width: 800,
    height: 600,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false,
            debugShowVelocity: false,
            debugShowBody: false,
            debugShowStaticBody: false
        }
    },
    scene: window.MainScene ? [window.MainScene] : [],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#000000',
    pixelArt: true,
    roundPixels: false
};

// ゲームインスタンスの作成
let game;

// ページ読み込み完了後にゲームを開始
window.onload = function() {
    if (window.MainScene) {
        game = new Phaser.Game(config);
        
        // リサイズ対応
        window.addEventListener('resize', function() {
            game.scale.refresh();
        });
    } else {
        console.error("MainSceneが見つかりません");
        document.getElementById("game-container").innerHTML = 
            '<div style="color: white; padding: 20px; text-align: center;">' +
            '<h2>エラー: ゲームシーンが見つかりません</h2>' +
            '<p>MainScene.jsが正しく読み込まれているか確認してください。</p>' +
            '</div>';
    }
};
