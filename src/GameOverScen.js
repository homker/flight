/**
 * GG
 * Created by homker on 15/10/29.
 */
var GameOverLy = cc.Layer.extend({
    _size: null,
    _label: null,
    _baseLayer: null,
    ctor: function () {
        var self = this;
        this._super();
        this.setColor(cc.color(126, 126, 126, 126));
        this._size = cc.winSize;
        this._baseLayer = cc.Layer.create();
        this.addChild(this._baseLayer, 0);
        this._label = cc.LabelTTF.create('Game Over !', "Arial", 60);
        this._label.setPosition(this._size.width / 2, this._size.height / 2);
        this._baseLayer.addChild(this._label, 1);
        console.log(this.onNewGame);
        var newGameNormal = cc.Sprite.create(res.s_menu, cc.rect(0, 0, 126, 33)),
            newGameSelected = cc.Sprite.create(res.s_menu, cc.rect(0, 33, 126, 33)),
            newGameDisabled = cc.Sprite.create(res.s_menu, cc.rect(0, 33 * 2, 126, 33)),
            newGame = cc.MenuItemSprite.create(newGameNormal, newGameSelected, newGameDisabled, this.onNewGame, this),
            newGameButton = cc.Menu.create(newGame);
        newGameButton.setAnchorPoint(cc.p(0.5, 0.5));
        newGameButton.setPosition(this._size.width / 2, this._size.height / 2 + 100);
        newGameButton.alignItemsVerticallyWithPadding(10);
        this._baseLayer.addChild(newGameButton, 2, 2);
        return true;
    },
    onNewGame: function () {
        console.log("this");
        this._size = cc.winSize;
        var scene = cc.Scene.create(),
            gsl = new GameSceneLayer();
        gsl.init();
        scene.addChild(gsl, 1);
        var bgLayer = cc.Layer.create(),
            bgImage = cc.Sprite.create();
        bgLayer.addChild(bgImage);
        bgImage.setAnchorPoint(cc.p(0.5, 0.5));
        bgImage.setPosition(this._size.width / 2, this._size.height / 2);
        scene.addChild(bgLayer, 0);
        cc.director.runScene(cc.TransitionFade.create(1.2, scene));
    }
});

var GameOver = cc.Scene.extend({
    _layer: null,
    onEnter: function () {
        this._super();
        this._layer = new GameOverLy();
        this.addChild(this._layer);
    }
});

