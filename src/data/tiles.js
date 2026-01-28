// タイル定数定義
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

// タイルのプロパティ（採集可能か、何がドロップするかなど）
window.TILE_PROPERTIES = {
    0: { name: "空気", harvestable: false, drops: null },
    1: { name: "土", harvestable: true, drops: { type: "dirt", icon: "tiles" } },
    2: { name: "草", harvestable: true, drops: { type: "grass", icon: "tiles" } },
    3: { name: "木", harvestable: true, drops: { type: "wood", icon: "wood_icon", count: 2 } },
    4: { name: "石", harvestable: true, drops: { type: "stone", icon: "stone_icon" } },
    5: { name: "レンガ", harvestable: true, drops: { type: "brick", icon: "tiles" } },
    6: { name: "鉄", harvestable: true, drops: { type: "iron", icon: "tiles" } },
    7: { name: "道", harvestable: false, drops: null },
    8: { name: "畑", harvestable: true, drops: { type: "farm", icon: "tiles" } },
    9: { name: "炎", harvestable: false, drops: null, damage: 10 }
};
