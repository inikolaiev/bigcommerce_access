import PageManager from '../page-manager';
import { fabric } from 'fabric';

export default class ProductGrave extends PageManager {
    onReady() {
        this.openModal();
        this.openTimes = 0;
        this.oText = null;
        this.canvas = null;
        this.canvasContainer = null;
    }
    openModal() {
        $('#open-engrave-modal').click(() => {
            $('#modal-grave').addClass('modal-grave-open');
            $('.modal-background').css('display', 'block');
            this.createCanvas();
            this.openTimes++;
        });

        $('#close').click(() => {
            $('#modal-grave').removeClass('modal-grave-open');
            $('.modal-background').css('display', 'none');
        });
    }

    createCanvas() {
        // get data from product custom fields
        const [engravePosition, engravePositionWidth, engravePositionHeight] = this.context.customFields;
        const [marginLeftFromImage, marginTopFromImage] = engravePosition.value.split(',');
        const canvasImageWidth = engravePositionWidth.value;
        const canvasImageHeight = engravePositionHeight.value;

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
            this.canvas.setDimensions({ width: imageToEngraveWidth * canvasImageWidth / 100, height: imageToEngraveHeight * canvasImageHeight / 100 });
        }
        this.addText(this.canvas);
        this.changeFont(this.canvas);

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
            const existImgInstance = new fabric.Image(graveImg, {
                left: this.canvasContainer.offsetLeft * imageToEngrave.naturalWidth / imageToEngrave.clientWidth,
                top: this.canvasContainer.offsetTop * imageToEngrave.naturalWidth / imageToEngrave.clientWidth,
                width: imageToEngrave.naturalWidth * canvasImageWidth / 100,
                height: imageToEngrave.naturalHeight * canvasImageHeight / 100,
            });
            combinedCanvas.add(existImgInstance);
            combinedCanvas.requestRenderAll();

            // collaborate product image and engrave for image
            this.createResultImage(combinedCanvas, combinedCanvasElement);
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
            const obj = canvas.getActiveObject();
            obj.set('fontFamily', this.value);
            canvas.renderAll();
        });
    }

    createResultImage(combinedCanvas, combinedCanvasElement) {
        const timeout = setTimeout(() => {
            document.querySelector('body').appendChild(combinedCanvasElement);
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
        }, 5000);
    }
}
