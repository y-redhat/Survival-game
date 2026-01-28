// タイル定義
window.TILE = {
    AIR: 0,
    DIRT: 1,
    GRASS: 2,
    TREE: 3,
    STONE: 4,
    BRICK: 5,
    IRON: 6,
    ROAD: 7,
    FARM: 8,
    FIRE: 9
};

// タイル名
window.TILE_NAMES = {
    0: "空気",
    1: "土",
    2: "草",
    3: "木",
    4: "石",
    5: "レンガ",
    6: "鉄",
    7: "道",
    8: "畑",
    9: "炎"
};

// 採集ドロップ
window.TILE_DROPS = {
    1: { type: "dirt", name: "土", icon: "dirt_icon" },
    2: { type: "grass", name: "草", icon: "dirt_icon" },
    3: { type: "wood", name: "木材", icon: "wood_icon", count: 2 },
    4: { type: "stone", name: "石材", icon: "stone_icon" },
    5: { type: "brick", name: "レンガ", icon: "stone_icon" },
    6: { type: "iron", name: "鉄", icon: "stone_icon" },
    8: { type: "farm", name: "畑", icon: "dirt_icon" }
};
