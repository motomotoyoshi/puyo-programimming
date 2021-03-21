"use strict";

class Player {

  // static centerPuyo;
  // static movablePuyo;
  // static puyoStatus;
  // static centerPuyoElement;
  // static movablePuyoElement;

  // static groundFrame;
  // static ketStatus;

  // static actionStartFrame;
  // static moveSource;
  // static moceDestination;
  // static ratateBeforeLeft;
  // static ratateAfterLeft;
  // static ratateFromRotaion;

  static initialize() {
    this.ketStatus = {
      right: false,
      left: false,
      up: false,
      down: false
    };


    document.addEventListener('keydown', e => {
      switch (e.keyCode) {
        case 37: // 左キー
          this.ketStatus.left = true;
          e.preventDefault(); return false;
        case 38: // 上キー
          this.ketStatus.up = true;
          e.preventDefault(); return false;
        case 39: // 右キー
          this.ketStatus.right = true;
          e.preventDefault(); return false;
        case 40: // 下キー
          this.ketStatus.down = true;
          e.preventDefault(); return false;
      }
    });


    document.addEventListener('keyup', e => {
      switch (e.keyCode) {
        case 37: // 左キー
          this.ketStatus.left = false;
          e.preventDefault(); return false;
        case 38: // 上キー
          this.ketStatus.up = false;
          e.preventDefault(); return false;
        case 39: // 右キー
          this.ketStatus.right = false;
          e.preventDefault(); return false;
        case 40: // 下キー
          this.ketStatus.down = false;
          e.preventDefault(); return false;
      }
    });

    this.touchPoint = {
      xs: 0,
      ys: 0,
      xe: 0,
      ye: 0
    }


    document.addEventListener('touchstart', e => {
      this.touchPoint.xs = e.touches[0].clientX;
      this.touchPoint.ys = e.touches[0].clientY;
    });


    document.addEventListener('touchmove', e => {
      if(Math.abs(e.touches[0].clientX - this.touchPointxs) < 20 &&
        Math.abs(e.touches[0].clientY - this.touchPoint.ys) < 20
      ) {
        return;
      }

      this.touchPoint.xe = e.touches[0].clientX;
      this.touchPoint.ye = e.touches[0].clientY;
      const { xs, ys, xe, ye} = this.touchPoint;
      gesture(xs, ys, xe, ye);

      this.touchPoint.xs = this.touchPoint.xe;
      this.touchPoint.ys = this.touchPoint.ye;

    });

    document.addEventListener('touchend', e => {
      this.keyStatus.up = false;
      this.keyStatus.down = false;
      this.keyStatus.left = false;
      this.keyStatus.right = false;
    });


    const geture = (xs, ys, xe, ye) => {
      const horizonDirection = xe - xs;
      const verticalDirection = ye - ys;

      if(Math.abs(horizonDirection) < Math.abs(verticalDirection)) {
        // 縦
        if(verticalDirection < 0) {
          this.ketStatus.up = true;
          this.ketStatus.down = false;
          this.ketStatus.left = false;
          this.ketStatus.right = false;
        } else if (0 <= verticalDirection) {
          this.ketStatus.up = false;
          this.ketStatus.down = true;
          this.ketStatus.left = false;
          this.ketStatus.right = false;
        }
      } else {
        // 横
        if(horizonDirection < 0) {
          this.ketStatus.up = false;
          this.ketStatus.down = false;
          this.ketStatus.left = true;
          this.ketStatus.right = false;
        } else if (0 <= horizonDirection) {
          this.ketStatus.up = false;
          this.ketStatus.down = false;
          this.ketStatus.left = false;
          this.ketStatus.right = true;
        }
      }
    }
  }


  // 設置確認
  static createNewPuyo() {
    // 設置可否を最上段左から3つ目で確認
    if(Stage.board[0][2]) {
      return false; // 空白でない場合は置けない
    }

    // 新しいぷよの色を決める
    const puyoColors = Math.max(1, Math.min(5, Config.puyoColors));
    this.centerPuyo = Math.floor(Math.random() * puyoColors) + 1;
    this.movablePuyo = Math.floor(Math.random() * puyoColors) + 1;

    // 新しいぷよ画像を作成する
    this.centerPuyoElement = PuyoImage.getPuyo(this.centerPuyo);
    this.movablePuyoElement = PuyoImage.getPuyo(this.movablePuyo);
    Stage.stageElement.appendChild(this.centerPuyoElement);
    Stage.stageElement.appendChild(this.movablePuyoElement);

    // ぷよの初期配置
    this.puyoStatus = {
      x: 2, //中心ぷよの位置: 左から2列目
      y: -1, //画面上部ギリギリから出てくる
      left: 2 * Config.puyoImgWidth,
      top: -1 * Config.puyoImgHeight,
      dx: 0, //動くぷよの相対位置: 動くぷよは上方向にある
      dy: -1,
      rotation: 90 //動くぷよの角度は90度（上向き）
    };
    //接地時間はゼロ
    this.groundFrame = 0;
    //ぷよを描画
    this.setPuyoPosition();
    return true;
  }


  static setPuyoPosition() {
    this.centerPuyoElement.style.left = this.puyoStatus.left + 'px';
    this.centerPuyoElement.style.top = this.puyoStatus.top + 'px';
    const x = this.puyoStatus.left + Math.cos(this.puyoStatus.rotation * Math.PI / 180) * Config.puyoImgWidth;
    const y = this.puyoStatus.top + Math.sin(this.puyoStatus.rotation * Math.PI / 180) * Config.puyoImgHeight;
    this.movablePuyoElement.style.left = x + 'px';
    this.movablePuyoElement.style.top = y + 'px';
  }


  static falling(isDownPressed) {
    //現状の場所の下にブロックがあるかどうか確認
    let isBlocked = false;
    let x = this.puyoStatus.x;
    let y = this.puyoStatus.y;
    let dx = this.puyoStatus.dx;
    let dy = this.puyoStatus.dy;
    if(y + 1 >= Config.stageRows || Stage.board[y + 1][x] || (y + dy + 1 >= 0 && (y + dy + 1 >= Config.stageRows || Stage.board[y + dy][x + dx]))){
      isBlocked = true;
    }

    if(!isBlocked){
      //下にブロックがないなら自由落下してよい。操作中の自由落下処理
      this.puyoStatus.top += Config.playerFallingSpeed;
      if(isDownPressed){
        //下キーがおされていたらもっと加速
        this.puyoStatus.top += Config.playerFallingSpeed;
      }
      if(Math.floor(this.puyoStatus.top / Config.puyoImgHeight) != y){
        //ブロックの境を超えたので再チェック
        //下キーが押されていたら得点を加算
        if(isDownPressed){
          Score.addScore(1);
        }
        y += 1;
        this.puyoStatus.y = y;
        if( + 1 >= Config.stageRows || Stage.board[y + 1][x] || (y + dy + 1 >= 0 && (y + dy + 1 >= Config.stageRows || Stage.board[y + dy][x + dx]))){
          isBlocked = true;
        }
        if(!isBlocked){
          //境を超えたが問題なし、次回も自由落下を継続
          this.groundFrame = 0;
          return;
        } else {
          //境を超えたらブロックにぶつかった。位置を調節して設置を開始
          this.puyoStatus.top = y * Config.puyoImgHeight;
          this.groundFrame = 1;
          return;
        }
      } else {
        //自由落下で問題なし、次回も自由落下を継続
        this.groundFrame = 0;
        return;
      }
    }
    if(this.groundFrame == 0){
      //接地を開始
      this.groundFrame = 1;
      return;
    } else {
      this.groundFrame = 1;
      if(this.groundFrame > Config.playerGroundFrame){
        return true;
      }
    }
  }


  static playing(frame) {
    //自由落下を確認する
    //下キーが押されていたらそれも込みで自由落下
    if(this.falling(this.ketStatus.down)){
      //落下が終わっていたらぷよを固定
      this.setPuyoPosition();
      return 'fix';
    }
    this.setPuyoPosition();
    if(this.ketStatus.right || this.ketStatus.left){
      //左右の確認
      const cx = (this.ketStatus.right)? 1: -1;
      const x = this.puyoStatus.x;
      const y = this.puyoStatus.y;
      const mx = this.puyoStatus.mx;
      const my = this.puyoStatus.dy;
      //その方向にブロックがないことを確認
      //自分の左右を確認
      let canMove = true;
      if(y < 0 || x + cx < 0 || x + cx >= Config.stageCols || Stage.board[y][x + cx]){
        if(y >= 0){
          canMove = false;
        }
      }
      if(my < 0 || mx + cx < 0 || mx + cx >= Config.stageCols || Stage.board[my][mx + cx]){
        if(my >= 0){
          canMove = false;
        }
      }
      //接地してない場合はさらに1個下のブロックの左右も確認
      if(this.groundFrame === 0){
        if(y + 1 < 0 || x + cx < 0 || x + cx >= Config.stageCols || Stage.board[y + 1][x + cx]){
          if(y + 1 >= 0){
            canMove = false;
          }
        }
        if(my + 1 < 0 || mx + cx < 0 || mx + cx >= Config.stageCols || Stage.board[my + 1][mx + cx]){
          if(my + 1 >= 0){
            canMove = false;
          }
        }
      }

      if(canMove){
        //動かすことができるので移動先情報をセットして移動状態にする
        this.actionStartFrame = frame;
        this.moveSource = x * Config.puyoImgWidth;
        this.moveDestination = (x + cx) * Config.puyoImgWidth;
        this.puyoStatus.x += cx;
        return 'moving';
      }
    } else if(this.keyStatus.up){
      //回転を確認
      //回せるかどうかはあとで確認,まわす
      const x = this.puyoStatus.x;
      const y = this.puyoStatus.y;
      const mx = x + this.puyoStatus.dx;
      const my = y + this.puyoStatus.dy;
      const rotation = this.puyoStatus.rotation;
      let canRotate = true;

      let cx = 0;
      let cy = 0;
      if(rotation === 0){
        //右から上には100%回せる、何もしない
      } else if(rotation === 90){
        //上から左に回すときに左にブロックがあれば右に移動する必要があるので確認
        if(y + 1 < 0 || x - 1 < 0 || x -1 >= Config.stageCols || Stage.board[y + 1][x - 1]){
          if(y + 1 >= 0){
            //ブロックがある、右に1個ずれる
            cx = 1;
          }
        }
        //　右にずれる必要があるとき、右にもブロックがあれば回転できないので確認
        if(cx === 1){
          if(y + 1 < 0 || x - 1 < 0 || x + 1 >= Config.stageRows || Stage.board[y + 1][x + 1]){
            if(y + 1 >= 0){
              //　ブロックがある、回転できない
              canMove = false;
            }
          }
        }
      } else if(rotation === 180){
        //左から下に回すときには自分のしたか左下にブロックがあれば1個上に引き上げる、まずは下を確認
        if(y + 2 < 0 || y + 2 >= Config.stageRows || Stage.board[y + 2][x]){
          if(y + 2 >= 0){
            //ブロックがある、上に引き上げる
            cy = -1;
          }
        }
      } else if(rotation === 270){
        //下から右に回す時は右にブロックがあれば左に移動する必要があるので確認
        if(y + 1 < 0 || x + 1 < 0 || x + 1 >= Config.stageCols || Stage.board[y + 1][x + 1]){
          if(y + 1 >= 0){
            //ブロックがある、左に1個ずれる
            cx = -1;
          }
        }
        //左にずれる必要があるとき、左にもブロックがあれば回転できないので確認
        if(cx === -1){
          if(y + 1 < 0 || x - 1 < 0 || x - 1 >= Config.stageCols || Stage.board[y + 1][x =1]){
            if(y + 1 >= 0){
              //ブロックがある、回転できない
              canRotate = false;
            }
          }
        }
      }

      if(canRotate){
        //上に移動する必要があるときは一気にあげる
        if(cy === -1){
          if(this.groundFrame > 0){
            //接地しているなら1段引き揚げ
            this.puyoStatus.y -= 1;
            this.groundFrame = 0;
          }
          this.puyoStatus.top = this.puyoStatus.y * Config.puyoImgHeight;
        }
        //回すことができないので開店後の情報をセットして回転状態にする
        this.actionStartFrame = frame;
        this.rotateBeforeLeft = x + Config.puyoImgHeight;
        this.rotateAfterLeft = (x + cx) * Config.puyoImgHeight;
        this.rotateFromRotation = this.puyoStatus.rotation;
        //次の状態に先に設定しておく
        this.puyoStatus.x += cx;
        const distRotation = (this.puyoStatus.rotation + 90) % 360;
        const dCombi = [[1, 0], [0, -1], [-1, 0], [0, 1], [distRotation / 90]];
        this.puyoStatus.dx = dCombi[0];
        this.puyoStatus.dy = dCombi[1];
        return 'rotating';
      }
    }
    return 'playing';
  }


  static moving(frame) {
    //移動中も自然落下させる
    this.falling();
    const ratio = Math.min(1, (frame - this.actionStartFrame) / Config.playerRotateFrame);
    this.puyoStatus.left = ratio * (this.moveDestination - this.moveSource) + this.moveSource;
    this.setPuyoPosition();
    if(ratio === 1){
      return false;
    }
    return true;
  }


  static rotating(frame) {
    //回転中も自然落下させる
    this.falling();
    const ratio = Math.min(1, (frame - this.actionStartFrame) / Config.playerRotateFrame);
    this.puyoStatus.left = (this.rotateAfterLeft - this.rotateBeforeLeft) * ratio + this.rotateBeforeLeft;
    this.puyoStatus.rotation = this.rotateFromRotation + ratio * 90;
    this.setPuyoPosition();
    if(ratio === 1){
      this.puyoStatus.rotation = (this.rotateFromRotation + 90) % 360;
      return false;
    }
    return true;
  }


  static fix(){
    //現在のぷよをステージ上に配置する
    const x = this.puyoStatus.x;
    const y = this.puyoStatus.y;
    const dx = this.puyoStatus.dx;
    const dy = this.puyoStatus.dy;
    if(y >= 0){
      //画面外のぷよは消す
      Stage.setPuyo(x, y, this.centerPuyo);
      Stage.puyoCount++;
    }
    if(y + dy >= 0){
      //画面外のぷよは消す
      Stage.setPuyo(x + dx, y + dy, this.movablePuyo);
      Stage.puyoCount++;
    }
    //操作用に作成したぷよ画像を消す
    Stage.stageElement.removeChild(this.centerPuyoElement);
    Stage.stageElement.removeChild(this.movablePuyoElement);
    this.centerPuyoElement = null;
    this.movablePuyoElement = null;
  }


  static batankyu() {
    if(this.keyStatus.up) {
      location.reload();
    }
  }
}