import PageManager from '../page-manager';
import { fabric } from 'fabric';

export default class ProductGrave extends PageManager {
    onReady() {
        this.openModal();
        this.openTimes = 0;
        this.oText = null;
        this.canvas = null;
        this.canvasContainer = null;
        this.context.customFields.forEach(field => {
            if (field.name === 'engrave_positionXY') {
                this.engravePosition = field.value;
            } else if (field.name === 'engrave_position_width') {
                this.engravePositionWidth = field.value;
            } else if (field.name === 'engrave_position_height') {
                this.engravePositionHeight = field.value;
            }
        });
    }
    openModal() {
        $('#open-engrave-modal').click(() => {
            $('#modal-grave').addClass('modal-grave-open');
            $('.modal-background').css('display', 'block');
            this.createCanvas(...this.engravePosition.split(','));
            this.openTimes++;
        });

        $('#close').click(() => {
            $('#modal-grave').removeClass('modal-grave-open');
            $('.modal-background').css('display', 'none');
        });
    }

    createCanvas(marginLeftFromImage, marginTopFromImage) {
        const imageToEngrave = document.querySelector('.canvas-image');
        const imageToEngraveWidth = imageToEngrave.clientWidth;
        const imageToEngraveHeight = imageToEngrave.clientHeight;
        const canvasElement = document.getElementById('grave-canvas');
        // create canvas area for engraving
        if (this.openTimes < 1) {
            this.canvas = new fabric.Canvas(canvasElement, {
                containerClass: 'grave-canvas-container',
            });
            this.canvasContainer = document.querySelector('.grave-canvas-container');
            this.canvasContainer.style.top = `${marginTopFromImage}%`;
            this.canvasContainer.style.left = `${marginLeftFromImage}%`;
            this.setCanvasDimensions(imageToEngraveWidth, imageToEngraveHeight);
        }
        this.addText(this.canvas);
        this.changeFont(this.canvas);
        this.changeFontSize(this.canvas);
        this.changeFontColor(this.canvas);
        this.changeFontStyle(this.canvas);
        this.changeTextAngle(this.canvas);
        this.changeText(this.canvas);
        this.changeTextCords(this.canvas);
        this.changeCords();
        this.changeCanvasWidth(imageToEngraveWidth, imageToEngraveHeight);
        this.changeCanvasHeight(imageToEngraveWidth, imageToEngraveHeight);

        // save engraving
        document.getElementById('saveImage').addEventListener('click', () => {
            const graveUrl = this.canvas.toDataURL('image/png', 1.0);
            const graveImg = document.createElement('img');
            const combinedCanvasElement = document.createElement('canvas');
            const combinedCanvas = new fabric.Canvas(combinedCanvasElement);
            combinedCanvas.setDimensions({ width: imageToEngrave.naturalWidth, height: imageToEngrave.naturalHeight });
            graveImg.src = graveUrl;

            // add product image to combined canvas
            combinedCanvas.setBackgroundImage(new fabric.Image(imageToEngrave, {
                width: imageToEngrave.naturalWidth,
                height: imageToEngrave.naturalHeight,
                left: 0,
                top: 0,
            }));

            // add engraving to combined canvas
            graveImg.onload = () => {
                const existImgInstance = new fabric.Image(graveImg, {
                    left: this.canvasContainer.offsetLeft * imageToEngrave.naturalWidth / imageToEngrave.clientWidth,
                    top: this.canvasContainer.offsetTop * imageToEngrave.naturalWidth / imageToEngrave.clientWidth,
                    scaleX: (imageToEngrave.naturalWidth * this.engravePositionWidth / 100) / graveImg.naturalWidth,
                    scaleY: (imageToEngrave.naturalHeight * this.engravePositionHeight / 100) / graveImg.naturalHeight,
                });
                combinedCanvas.add(existImgInstance);
                combinedCanvas.requestRenderAll();
                // collaborate product image and engrave for image
                this.createResultImage(combinedCanvas, combinedCanvasElement);
            };
        });
    }
    addText(canvas) {
        if (this.openTimes < 1) {
            this.oText = new fabric.IText('Tap and Type', {
                left: 10,
                top: 10,
                fontSize: 12,
            });
            canvas.add(this.oText);
        }
        this.oText.bringToFront();
        canvas.setActiveObject(this.oText);
        $('#font').trigger('change');
    }

    changeFont(canvas) {
        $('#font').change(function () {
            canvas.getObjects().forEach(item => {
                if (item.hasOwnProperty('text')) {
                    item.set({ fontFamily: this.value });
                }
            });
            canvas.renderAll();
        });
    }

    createResultImage(combinedCanvas, combinedCanvasElement) {
        const timeout = setTimeout(() => {
            const resultImage = document.createElement('img');
            resultImage.src = combinedCanvas.toDataURL('image/png');
            const resultImageContainer = document.querySelector('.result-image');
            resultImageContainer.innerHTML = null;
            resultImageContainer.appendChild(resultImage);
            $('#close').trigger('click');

            combinedCanvasElement.toBlob(blob => {
                const file = new File([blob], 'image.png');
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                document.querySelector('.form-file').files = dataTransfer.files;
            });
            clearTimeout(timeout);
        }, 1000);
    }

    changeFontSize(canvas) {
        $('#textSize').change(function () {
            canvas.getObjects().forEach(item => {
                if (item.hasOwnProperty('text')) {
                    item.set({ fontSize: this.value });
                }
            });
            canvas.renderAll();
        });
    }
    changeFontColor(canvas) {
        $('#textColor').change(function () {
            canvas.getObjects().forEach(item => {
                if (item.hasOwnProperty('text')) {
                    item.set({ fill: this.value });
                }
            });
            canvas.renderAll();
        });
    }
    changeFontStyle(canvas) {
        $('#setFontStyle').change(function () {
            canvas.getObjects().forEach(item => {
                if (item.hasOwnProperty('text')) {
                    item.set({ fontStyle: this.value });
                }
            });
            canvas.renderAll();
        });
    }

    changeTextAngle(canvas) {
        $('#angle').change(function () {
            canvas.getObjects().forEach(item => {
                if (item.hasOwnProperty('text')) {
                    item.set({ angle: this.value });
                }
            });
            canvas.renderAll();
        });
    }
    changeText(canvas) {
        $('#setText').keyup(function () {
            canvas.getObjects().forEach(item => {
                if (item.hasOwnProperty('text')) {
                    item.set({ text: this.value });
                }
            });
            canvas.renderAll();
        });
    }
    changeCords() {
        $('#canvasCord').keyup((e) => {
            const [marginLeftFromImage, marginTopFromImage] = e.target.value.split(',');
            this.canvasContainer.style.top = `${marginTopFromImage}%`;
            this.canvasContainer.style.left = `${marginLeftFromImage}%`;
        });
    }

    changeTextCords(canvas) {
        $('#textPosition').change((e) => {
            const [left, top] = e.target.value.split(',');
            canvas.getObjects().forEach(item => {
                if (item.hasOwnProperty('text')) {
                    item.set({ left: +left });
                    item.set({ top: +top });
                }
            });
            canvas.renderAll();
        });
    }
    changeCanvasHeight(imageToEngraveWidth, imageToEngraveHeight) {
        $('#canvasHeight').change((e) => {
            this.engravePositionHeight = e.target.value;
            this.setCanvasDimensions(imageToEngraveWidth, imageToEngraveHeight);
        });
    }
    changeCanvasWidth(imageToEngraveWidth, imageToEngraveHeight) {
        $('#canvasWidth').change((e) => {
            this.engravePositionWidth = e.target.value;
            this.setCanvasDimensions(imageToEngraveWidth, imageToEngraveHeight);
        });
    }
    setCanvasDimensions(imageToEngraveWidth, imageToEngraveHeight) {
        this.canvas.setDimensions({
            width: imageToEngraveWidth * this.engravePositionWidth / 100,
            height: imageToEngraveHeight * this.engravePositionHeight / 100,
        });
    }
}
