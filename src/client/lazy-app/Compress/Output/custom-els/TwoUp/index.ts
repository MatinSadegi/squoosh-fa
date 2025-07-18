import PointerTracker, { Pointer } from 'pointer-tracker';
import * as styles from './styles.css';
import 'add-css:./styles.css';

const legacyClipCompatAttr = 'legacy-clip-compat';
const orientationAttr = 'orientation';

type TwoUpOrientation = 'horizontal' | 'vertical';

/**
 * A split view that the user can adjust. The first child becomes
 * the left-hand side, and the second child becomes the right-hand side.
 */
export default class TwoUp extends HTMLElement {
  static get observedAttributes() {
    return [orientationAttr];
  }

  private readonly _handle = document.createElement('div');
  private _position = 0;
  private _relativePosition = 0.5;
  private _positionOnPointerStart = 0;
  private _everConnected = false;
  private _resizeObserver?: ResizeObserver;

  constructor() {
    super();
    this._handle.className = styles.twoUpHandle;

    new MutationObserver(() => this._childrenChange()).observe(this, {
      childList: true,
    });

    const pointerTracker: PointerTracker = new PointerTracker(this._handle, {
      start: (_, event) => {
        if (pointerTracker.currentPointers.length === 1) return false;
        event.preventDefault();
        this._positionOnPointerStart = this._position;
        return true;
      },
      move: () => {
        this._pointerChange(
          pointerTracker.startPointers[0],
          pointerTracker.currentPointers[0],
        );
      },
    });
  }

  connectedCallback() {
    this._childrenChange();

    this._handle.innerHTML = `<div class="${styles.scrubber}"><svg width="25px" height="25px" viewBox="0 0 24 24" fill="#ffff" xmlns="http://www.w3.org/2000/svg"><path d="M16.1359 18.2928C16.5264 18.6833 17.1596 18.6833 17.5501 18.2928L22.4375 13.4006C23.2179 12.6194 23.2176 11.3536 22.4369 10.5728L17.5465 5.68247C17.156 5.29195 16.5228 5.29195 16.1323 5.68247C15.7418 6.073 15.7418 6.70616 16.1323 7.09669L20.3179 11.2823C20.7085 11.6729 20.7085 12.306 20.3179 12.6965L16.1359 16.8786C15.7454 17.2691 15.7454 17.9023 16.1359 18.2928Z" fill="#0F0F0F"/><path d="M7.88675 5.68247C7.49623 5.29195 6.86307 5.29195 6.47254 5.68247L1.58509 10.5747C0.804698 11.3559 0.805008 12.6217 1.58579 13.4024L6.47615 18.2928C6.86667 18.6833 7.49984 18.6833 7.89036 18.2928C8.28089 17.9023 8.28089 17.2691 7.89036 16.8786L3.70471 12.6929C3.31419 12.3024 3.31419 11.6692 3.70472 11.2787L7.88675 7.09669C8.27728 6.70616 8.27728 6.073 7.88675 5.68247Z" fill="#0F0F0F"/></svg></div>`;

    this._resizeObserver = new ResizeObserver(() => this._resetPosition());
    this._resizeObserver.observe(this);

    window.addEventListener('keydown', this._onKeyDown);

    if (!this._everConnected) {
      this._resetPosition();
      this._everConnected = true;
    }
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this._onKeyDown);
    if (this._resizeObserver) this._resizeObserver.disconnect();
  }

  attributeChangedCallback(name: string) {
    if (name === orientationAttr) {
      this._resetPosition();
    }
  }

  /**
   * **اصلاح نهایی:** این متد حالا هم اندازه و هم موقعیت استاتیک خط جداکننده را تنظیم می‌کند
   */
  public updateHandleSize() {
    requestAnimationFrame(() => {
      const renderedBounds = this._getRenderedImageBounds();

      if (renderedBounds) {
        if (this.orientation === 'vertical') {
          this._handle.style.width = `${renderedBounds.width}px`;
          this._handle.style.left = `${renderedBounds.x}px`;
          this._handle.style.height = ''; // Reset
          this._handle.style.top = ''; // Reset
        } else { // horizontal
          this._handle.style.height = `${renderedBounds.height}px`;
          this._handle.style.top = `${renderedBounds.y}px`;
          this._handle.style.width = ''; // Reset
          this._handle.style.left = ''; // Reset
        }
      }
    });
  }

  private _getRenderedImageBounds(): { x: number; y: number; width: number; height: number } | null {
    const canvas = this.querySelector('canvas');
    if (!canvas) return null;

    const twoUpBounds = this.getBoundingClientRect();
    const canvasBounds = canvas.getBoundingClientRect();

    const canvasClientWidth = canvas.clientWidth;
    const canvasClientHeight = canvas.clientHeight;
    const imageIntrinsicWidth = canvas.width;
    const imageIntrinsicHeight = canvas.height;

    if (!imageIntrinsicWidth || !imageIntrinsicHeight) return null;

    const containerRatio = canvasClientWidth / canvasClientHeight;
    const imageRatio = imageIntrinsicWidth / imageIntrinsicHeight;

    let renderedWidth: number;
    let renderedHeight: number;

    if (imageRatio > containerRatio) {
      renderedWidth = canvasClientWidth;
      renderedHeight = canvasClientWidth / imageRatio;
    } else {
      renderedHeight = canvasClientHeight;
      renderedWidth = canvasClientHeight * imageRatio;
    }

    const offsetX = (canvasClientWidth - renderedWidth) / 2;
    const offsetY = (canvasClientHeight - renderedHeight) / 2;

    const x = canvasBounds.left - twoUpBounds.left + offsetX;
    const y = canvasBounds.top - twoUpBounds.top + offsetY;

    return { x, y, width: renderedWidth, height: renderedHeight };
  }

  private _onKeyDown = (event: KeyboardEvent) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('input')) return;

    const renderedBounds = this._getRenderedImageBounds();
    if (!renderedBounds) return;

    const twoUpBounds = this.getBoundingClientRect();
    const dimensionAxis = this.orientation === 'vertical' ? 'height' : 'width';

    let minPosition: number, maxPosition: number;

    if (this.orientation === 'vertical') {
      minPosition = renderedBounds.y;
      maxPosition = renderedBounds.y + renderedBounds.height;
    } else {
      minPosition = renderedBounds.x;
      maxPosition = renderedBounds.x + renderedBounds.width;
    }

    if (event.code === 'Digit1' || event.code === 'Numpad1') {
      this._position = minPosition;
    } else if (event.code === 'Digit2' || event.code === 'Numpad2') {
      this._position = minPosition + (maxPosition - minPosition) / 2;
    } else if (event.code === 'Digit3' || event.code === 'Numpad3') {
      this._position = maxPosition;
    } else {
      return;
    }

    this._relativePosition = this._position / twoUpBounds[dimensionAxis];
    this._setPosition();
  };

  private _resetPosition() {
    requestAnimationFrame(() => {
      this.updateHandleSize();

      const renderedBounds = this._getRenderedImageBounds();
      const twoUpBounds = this.getBoundingClientRect();
      const dimensionAxis = this.orientation === 'vertical' ? 'height' : 'width';

      if (!renderedBounds) {
        this._position = twoUpBounds[dimensionAxis] * this._relativePosition;
      } else {
        if (this.orientation === 'vertical') {
          this._position = renderedBounds.y + renderedBounds.height * this._relativePosition;
        } else {
          this._position = renderedBounds.x + renderedBounds.width * this._relativePosition;
        }
      }
      this._setPosition();
    });
  }

  get legacyClipCompat() {
    return this.hasAttribute(legacyClipCompatAttr);
  }

  set legacyClipCompat(val: boolean) {
    if (val) this.setAttribute(legacyClipCompatAttr, '');
    else this.removeAttribute(legacyClipCompatAttr);
  }

  get orientation(): TwoUpOrientation {
    const value = this.getAttribute(orientationAttr);
    if (value && value.toLowerCase() === 'vertical') return 'vertical';
    return 'horizontal';
  }

  set orientation(val: TwoUpOrientation) {
    this.setAttribute(orientationAttr, val);
  }

  private _childrenChange() {
    if (this.lastElementChild !== this._handle) {
      this.appendChild(this._handle);
    }
  }

  private _pointerChange(startPoint: Pointer, currentPoint: Pointer) {
    const pointAxis = this.orientation === 'vertical' ? 'clientY' : 'clientX';
    const dimensionAxis = this.orientation === 'vertical' ? 'height' : 'width';

    const renderedBounds = this._getRenderedImageBounds();
    const twoUpBounds = this.getBoundingClientRect();

    if (!renderedBounds) {
      this._position =
        this._positionOnPointerStart +
        (currentPoint[pointAxis] - startPoint[pointAxis]);
      this._position = Math.max(0, Math.min(this._position, twoUpBounds[dimensionAxis]));
      this._relativePosition = this._position / twoUpBounds[dimensionAxis];
      this._setPosition();
      return;
    }

    let minPosition: number, maxPosition: number;

    if (this.orientation === 'horizontal') {
      minPosition = renderedBounds.x;
      maxPosition = renderedBounds.x + renderedBounds.width;
    } else {
      minPosition = renderedBounds.y;
      maxPosition = renderedBounds.y + renderedBounds.height;
    }

    this._position =
      this._positionOnPointerStart +
      (currentPoint[pointAxis] - startPoint[pointAxis]);

    this._position = Math.max(
      minPosition,
      Math.min(this._position, maxPosition),
    );

    this._relativePosition = this._position / twoUpBounds[dimensionAxis];
    this._setPosition();
  }

  private _setPosition() {
    this.style.setProperty('--split-point', `${this._position}px`);
  }
}

customElements.define('two-up', TwoUp);
