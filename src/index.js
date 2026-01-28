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
            debug: false
        }
    },
    backgroundColor: '#000000',
    scene: null,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: false,
    roundPixels: false
};

// ゲーム起動
window.onload = function() {
    console.log("ページ読み込み完了");
    
    // 必要な変数が定義されているか確認
    if (!window.MainScene) {
        console.error("MainSceneが定義されていません");
        document.getElementById('game-container').innerHTML = 
            '<div style="color:white;padding:20px;">MainSceneが見つかりません</div>';
        return;
    }
    
    // ゲームインスタンス作成
    try {
        window.game = new Phaser.Game(config);
        
        // シーン追加
        window.game.scene.add('MainScene', window.MainScene);
        
        // シーン開始
        window.game.scene.start('MainScene');
        
        console.log("ゲーム起動成功");
        
        // リサイズ対応
        window.addEventListener('resize', () => {
            if (window.game) {
                window.game.scale.refresh();
            }
        });
        
    } catch (error) {
        console.error("ゲーム起動エラー:", error);
        document.getElementById('game-container').innerHTML = 
            '<div style="color:white;padding:20px;">起動エラー: ' + error.message + '</div>';
    }
};
