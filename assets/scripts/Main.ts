// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.ScrollView)
    scrollview: cc.ScrollView = null;
    
    @property(cc.Label)
    itemCountLabel: cc.Label = null;

    @property(cc.Camera)
    itemCamera: cc.Camera = null;

    @property(cc.Prefab)
    itemTemplet: cc.Prefab = null;

    @property(cc.Prefab)
    item2Templet: cc.Prefab = null;

    texture: cc.RenderTexture = null;

    _canvas: HTMLCanvasElement = null;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    onButton_0_Clicked () {
        this.scrollview.content.destroyAllChildren();
        this.scrollview.content.getComponent(cc.Layout).enabled = true;
        this.scrollview.content.getComponent(cc.Layout).type = cc.Layout.Type.VERTICAL;
        for (let i = 0; i < 500; i++) {
            let itemNode = cc.instantiate(this.itemTemplet);
            this.scrollview.content.addChild(itemNode);
        }
    }

    onButton_1_Clicked () {
        this.scrollview.content.destroyAllChildren();
        this.scrollview.content.getComponent(cc.Layout).enabled = true;
        this.scrollview.content.getComponent(cc.Layout).type = cc.Layout.Type.GRID;
        for (let i = 0; i < 500; i++) {
            let itemNode = cc.instantiate(this.item2Templet);
            this.scrollview.content.addChild(itemNode);
        }
    }

    onButton_2_Clicked () {
        this.scrollview.content.destroyAllChildren();
        this.scrollview.content.getComponent(cc.Layout).enabled = false;
        this.scrollview.node.getComponent("ListViewCtrl").init();
    }

    /**
	 * 分帧执行 Generator 逻辑
	 *
	 * @param generator 生成器
	 * @param duration 持续时间（ms），每次执行 Generator 的操作时，最长可持续执行时长。假设值为8ms，那么表示1帧（总共16ms）下，分出8ms时间给此逻辑执行
	 */

	private executePreFrame(generator: Generator, duration: number) {
		return new Promise((resolve, reject) => {
			let gen = generator;
			// 创建执行函数
			let execute = () => {
				// 执行之前，先记录开始时间
				let startTime = new Date().getTime();

				// 然后一直从 Generator 中获取已经拆分好的代码段出来执行
				for (let iter = gen.next(); ; iter = gen.next()) {
					// 判断是否已经执行完所有 Generator 的小代码段，如果是的话，那么就表示任务完成
					if (iter == null || iter.done) {
						resolve();
						return;
					}

					// 每执行完一段小代码段，都检查一下是否已经超过我们分配的本帧，这些小代码端的最大可执行时间
					if (new Date().getTime() - startTime > duration) {
						// 如果超过了，那么本帧就不在执行，开定时器，让下一帧再执行
						this.scheduleOnce(() => {
							execute();
						});
						return;
					}
				}
			};

			// 运行执行函数
			execute();
		});
	}

	private *_getItemGenerator(itemNode: cc.Node, length: number) {
        this.init(itemNode);
		for (let i = 0; i < length; i++) {
			yield this.renderTextureItem(itemNode, i);
        }
        itemNode.destroy();
    }
    
    renderTextureItem (itemNode: cc.Node, i) {
        itemNode.getChildByName("title").getComponent(cc.Label).string = "cocos_" + i;
        this.createCanvas(itemNode);
        var img = this.createImg();
        this.addItem(img);
    }

    async onButton_3_Clicked () {
        this.scrollview.content.destroyAllChildren();
        this.scrollview.content.getComponent(cc.Layout).enabled = true;
        this.scrollview.content.getComponent(cc.Layout).type = cc.Layout.Type.GRID;
        let itemNode = cc.instantiate(this.item2Templet);
        itemNode.group = "Item";
        this.node.addChild(itemNode);
        await this.executePreFrame(this._getItemGenerator(itemNode, 500), 1);
    }

    init (item: cc.Node) {
        let texture = new cc.RenderTexture();
        let gl = cc.game._renderContext;
        texture.initWithSize(item.width, item.height, gl.STENCIL_INDEX8);
        this.itemCamera.targetTexture = texture;
        this.texture = texture;
    }

    // create the img element
    createImg () {
        // return the type and dataUrl
        var dataURL = this._canvas.toDataURL("image/png");
        var img = document.createElement("img");
        img.src = dataURL;
        return img;
    }

    // create the canvas and context, filpY the image Data
    createCanvas (visitNode: cc.Node) {
        let width = this.texture.width;
        let height = this.texture.height;
        if (!this._canvas) {
            this._canvas = document.createElement('canvas');

            this._canvas.width = width;
            this._canvas.height = height;
        }
        let ctx = this._canvas.getContext('2d');
        this.itemCamera.render(visitNode);
        let data = this.texture.readPixels();
        // write the render data
        let rowBytes = width * 4; 
        for (let row = 0; row < height; row++) {
            let srow = height - 1 - row;
            let imageData = ctx.createImageData(width, 1);
            let start = srow * width * 4;
            for (let i = 0; i < rowBytes; i++) {
                imageData.data[i] = data[start + i];
            }

            ctx.putImageData(imageData, 0, row);
        }
        return this._canvas;
    }

    // show on the canvas
    addItem (img) {
        let texture = new cc.Texture2D();
        texture.initWithElement(img);

        let spriteFrame = new cc.SpriteFrame();
        spriteFrame.setTexture(texture);

        let node = new cc.Node();
        let sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = spriteFrame;

        node.parent = this.scrollview.content;
    }
}
