const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    @property(cc.Label)
    itemCountLabel: cc.Label = null;

    @property(cc.Prefab)
    prefabCell: cc.Prefab = null;

    @property(cc.Integer)
    itemCount: number = 0;

    @property(cc.Integer)
    prefabCellHeight: number = 0;

    @property(cc.Integer)
    prefabCellWidth: number = 0;

    @property(cc.ScrollView)
    scrollView:cc.ScrollView = null;

    @property(cc.Integer)
    spacing: number = 0;

    @property(cc.String)
    cellScriptName: string = "";

    @property(cc.Node)
    content: cc.Node = null;

    items: cc.Node[] = [];

    updateTimer: number = 0;
    
    updateInterval: number = 0.1;
    
    lastContentPosX: number = 0;
    
    lastContentPosY: number = 0;
    
    _bufferZone: number = 0; //when item is away from bufferZone, we relocate it
    _spawnCount: number = 0; // how many items we actually spawn
    _totalCount: number = 0; // how many items we need for the whole list

    onLoad () {
        this._bufferZone = this.scrollView.node.height;
        this.content.anchorX = 0.5;
        this.content.anchorY = 1;
        if (this.scrollView.horizontal) {
            this._bufferZone = this.scrollView.node.width;
            this.content.anchorX = 0;
            this.content.anchorY = 0.5;
        }
    }

    init () {
        this.items = [];
        this.lastContentPosY = 0;
        this.lastContentPosX = 0;

        if (this.scrollView.vertical && this.scrollView.horizontal) {
            return;
        }

        this._totalCount = this.itemCount;

        this._spawnCount = Math.floor(this._bufferZone / (this.prefabCellHeight + this.spacing)) + 4;
        if (this.scrollView.horizontal) {
            this._spawnCount = Math.floor(this._bufferZone / (this.prefabCellWidth + this.spacing)) + 4;
        }

        if (this._spawnCount > this._totalCount) {
            this._spawnCount = this._totalCount;
        }

        if (this.scrollView.vertical) {
            this.content.height = this._totalCount * (this.prefabCellHeight + this.spacing) + this.spacing; // get total content height
        } else if (this.scrollView.horizontal) {
            this.content.width = this._totalCount * (this.prefabCellWidth + this.spacing) + this.spacing; // get total content width
        }
        for (let i = 0; i < this._spawnCount; ++i) { // spawn items, we only need to do this once
            let item = cc.instantiate(this.prefabCell);
            this.content.addChild(item);

            if (this.scrollView.vertical) {
                item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
            } else if (this.scrollView.horizontal) {
                item.setPosition(item.width * (i + 0.5) + this.spacing * (i + 1), 0);
            }
            this.items.push(item);
        }
        this.scheduleOnce(()=>{
            this.itemCountLabel.string = `总需浏览数： ${this._totalCount}，实际节点数： ${this.content.childrenCount}`;
        }, 0);
    }

    getPositionInView (item) { // get item position in scrollview's node space
        let worldPos = item.parent.convertToWorldSpaceAR(item.position);
        let viewPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
        return viewPos;
    }

    update (dt) {
        this.updateTimer += dt;
        if (this.updateTimer < this.updateInterval) return; // we don't need to do the math every frame
        this.updateTimer = 0;
        let items = this.items;
        let buffer = this._bufferZone;
        if (this.scrollView.vertical) {
            let isDown = this.scrollView.content.y < this.lastContentPosY; // scrolling direction
            let offset = (this.prefabCellHeight + this.spacing) * items.length;
            for (let i = 0; i < items.length; ++i) {
                let viewPos = this.getPositionInView(items[i]);
                if (isDown) {
                    // if away from buffer zone and not reaching top of content
                    if (viewPos.y < -buffer && items[i].y + offset < 0) {
                        items[i].y = items[i].y + offset;
                    }
                } else {
                    // if away from buffer zone and not reaching bottom of content
                    if (viewPos.y > buffer / 2 + (this.prefabCellHeight + this.spacing) / 2 && items[i].y - offset > -this.content.height) {
                        items[i].y = items[i].y - offset;
                    }
                }
            }
            // update lastContentPosY
            this.lastContentPosY = this.scrollView.content.y;
        } else if (this.scrollView.horizontal) {
            let isRight = this.scrollView.content.x > this.lastContentPosX; // scrolling direction
            let offset = (this.prefabCellWidth + this.spacing) * items.length;
            for (let i = 0; i < items.length; ++i) {
                let viewPos = this.getPositionInView(items[i]);
                if (isRight) {
                    // if away from buffer zone and not reaching top of content
                    if (viewPos.x > buffer / 2 + (this.prefabCellWidth + this.spacing) / 2 && items[i].x - offset > 0) {
                        items[i].x = items[i].x - offset;
                    }
                } else {
                    // if away from buffer zone and not reaching bottom of content
                    if (viewPos.x < -buffer / 2 - (this.prefabCellWidth + this.spacing) / 2 && items[i].x + offset < this.content.width) {
                        items[i].x = items[i].x + offset;
                    }
                }
            }
            // update lastContentPosX
            this.lastContentPosX = this.scrollView.content.x;
        }
    }
};
