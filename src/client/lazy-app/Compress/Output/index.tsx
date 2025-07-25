import { h, Component, Fragment } from 'preact';
import type PinchZoom from './custom-els/PinchZoom';
import type { ScaleToOpts } from './custom-els/PinchZoom';
import TwoUp from './custom-els/TwoUp';
import './custom-els/PinchZoom';
import './custom-els/TwoUp';
import * as style from './style.css';
import 'add-css:./style.css';
import { shallowEqual, isSafari } from '../../util';
import {
  ToggleAliasingIcon,
  ToggleAliasingActiveIcon,
  ToggleBackgroundIcon,
  AddIcon,
  RemoveIcon,
  ToggleBackgroundActiveIcon,
  RotateIcon,
} from '../../icons';
import { twoUpHandle } from './custom-els/TwoUp/styles.css';
import type { PreprocessorState } from '../../feature-meta';
import { cleanSet } from '../../util/clean-modify';
import type { SourceImage } from '../../Compress';
import { linkRef } from 'shared/prerendered-app/util';
import { drawDataToCanvas } from 'client/lazy-app/util/canvas';
import prettyBytes from '../Results/pretty-bytes';
interface Props {
  source?: SourceImage;
  preprocessorState?: PreprocessorState;
  mobileView: boolean;
  leftCompressed?: ImageData;
  rightCompressed?: ImageData;
  leftImgContain: boolean;
  rightImgContain: boolean;
  onPreprocessorChange: (newState: PreprocessorState) => void;
  editedFileSize?: number;
}

interface State {
  scale: number;
  editingScale: boolean;
  altBackground: boolean;
  aliasing: boolean;
}

const unitMap: { [key: string]: string } = {
  B: 'بایت',
  kB: 'کیلوبایت',
  mB: 'مگابایت',
};

const scaleToOpts: ScaleToOpts = {
  originX: '50%',
  originY: '50%',
  relativeTo: 'container',
  allowChangeEvent: true,
};

export default class Output extends Component<Props, State> {
  state: State = {
    scale: 1,
    editingScale: false,
    altBackground: false,
    aliasing: false,
  };
  canvasLeft?: HTMLCanvasElement;
  canvasRight?: HTMLCanvasElement;
  pinchZoomLeft?: PinchZoom;
  pinchZoomRight?: PinchZoom;
  scaleInput?: HTMLInputElement;
  retargetedEvents = new WeakSet<Event>();
  coverRef?: HTMLDivElement;
  twoUpRef?: TwoUp;

  // **اصلاح شده:** این تابع حالا فقط پس‌زمینه عنصر cover را آپدیت می‌کند
  private updateCoverBackground = (imageData: ImageData | undefined) => {
    // اگر ref یا عکس وجود نداشت، کاری نکن
    if (!this.coverRef || !imageData) {
      if (this.coverRef) this.coverRef.style.backgroundImage = 'none';
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const ctx = tempCanvas.getContext('2d');

    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
      // پس‌زمینه عنصر cover را با عکس جدید تنظیم می‌کنیم
      this.coverRef.style.backgroundImage = `url(${tempCanvas.toDataURL()})`;
    }
  };

  componentDidMount() {
    const leftDraw = this.leftDrawable();
    const rightDraw = this.rightDrawable();

    // Reset the pinch zoom, which may have an position set from the previous view, after pressing
    // the back button.
    // this.pinchZoomLeft!.setTransform({
    //   allowChangeEvent: true,
    //   x: 0,
    //   y: 0,
    //   scale: 1,
    // });

    if (this.canvasLeft && leftDraw) {
      drawDataToCanvas(this.canvasLeft, leftDraw);
      this.updateCoverBackground(leftDraw);
    }
    if (this.canvasRight && rightDraw) {
      drawDataToCanvas(this.canvasRight, rightDraw);
    }
    if (this.twoUpRef) {
      this.twoUpRef.updateHandleSize();
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const prevLeftDraw = this.leftDrawable(prevProps);
    const prevRightDraw = this.rightDrawable(prevProps);
    const leftDraw = this.leftDrawable();
    const rightDraw = this.rightDrawable();
    const sourceFileChanged =
      // Has the value become (un)defined?
      !!this.props.source !== !!prevProps.source ||
      // Or has the file changed?
      (this.props.source &&
        prevProps.source &&
        this.props.source.file !== prevProps.source.file);

    const oldSourceData = prevProps.source && prevProps.source.preprocessed;
    const newSourceData = this.props.source && this.props.source.preprocessed;
    // const pinchZoom = this.pinchZoomLeft!;

    if (leftDraw && leftDraw !== prevLeftDraw && this.canvasLeft) {
      drawDataToCanvas(this.canvasLeft, leftDraw);
      this.updateCoverBackground(leftDraw);
    }
    if (rightDraw && rightDraw !== prevRightDraw && this.canvasRight) {
      drawDataToCanvas(this.canvasRight, rightDraw);
    }
    if (this.twoUpRef) {
      this.twoUpRef.updateHandleSize();
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return (
      !shallowEqual(this.props, nextProps) ||
      !shallowEqual(this.state, nextState)
    );
  }

  private leftDrawable(props: Props = this.props): ImageData | undefined {
    return props.leftCompressed || (props.source && props.source.preprocessed);
  }

  private rightDrawable(props: Props = this.props): ImageData | undefined {
    return props.rightCompressed || (props.source && props.source.preprocessed);
  }

  private toggleAliasing = () => {
    this.setState((state) => ({
      aliasing: !state.aliasing,
    }));
  };

  private toggleBackground = () => {
    this.setState({
      altBackground: !this.state.altBackground,
    });
  };

  private onRotateClick = () => {
    const { preprocessorState: inputProcessorState } = this.props;
    if (!inputProcessorState) return;

    const newState = cleanSet(
      inputProcessorState,
      'rotate.rotate',
      (inputProcessorState.rotate.rotate + 90) % 360,
    );

    this.props.onPreprocessorChange(newState);
  };

  private onScaleValueFocus = () => {
    this.setState({ editingScale: true }, () => {
      if (this.scaleInput) {
        // Firefox unfocuses the input straight away unless I force a style
        // calculation here. I have no idea why, but it's late and I'm quite
        // tired.
        getComputedStyle(this.scaleInput).transform;
        this.scaleInput.focus();
      }
    });
  };

  private onScaleInputBlur = () => {
    this.setState({ editingScale: false });
  };

  /**
   * We're using two pinch zoom elements, but we want them to stay in sync. When one moves, we
   * update the position of the other. However, this is tricky when it comes to multi-touch, when
   * one finger is on one pinch-zoom, and the other finger is on the other. To overcome this, we
   * redirect all relevant pointer/touch/mouse events to the first pinch zoom element.
   *
   * @param event Event to redirect
   */
  private onRetargetableEvent = (event: Event) => {
    if (event.type === 'wheel') {
      event.stopPropagation();
      return;
    }
    const targetEl = event.target as HTMLElement;
    // If the event is on the handle of the two-up, let it through,
    // unless it's a wheel event, in which case always let it through.
    if (targetEl.closest(`.${twoUpHandle}`)) return;
    // If we've already retargeted this event, let it through.
    if (this.retargetedEvents.has(event)) return;
    // Stop the event in its tracks.
    event.stopImmediatePropagation();
    if (event.type !== 'touchmove') {
      event.preventDefault();
    }
    // Clone the event & dispatch
    // Some TypeScript trickery needed due to https://github.com/Microsoft/TypeScript/issues/3841
    const clonedEvent = new (event.constructor as typeof Event)(
      event.type,
      event,
    );
    this.retargetedEvents.add(clonedEvent);

    // Unfocus any active element on touchend. This fixes an issue on (at least) Android Chrome,
    // where the software keyboard is hidden, but the input remains focused, then after interaction
    // with this element the keyboard reappears for NO GOOD REASON. Thanks Android.
    if (
      event.type === 'touchend' &&
      document.activeElement &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }
  };

  render(
    {
      mobileView,
      leftImgContain,
      rightImgContain,
      source,
      editedFileSize,
    }: Props,
    { scale, editingScale, altBackground, aliasing }: State,
  ) {
    const leftDraw = this.leftDrawable();
    const rightDraw = this.rightDrawable();
    // To keep position stable, the output is put in a square using the longest dimension.
    const originalImage = source && source.preprocessed;

    const originalSize = source && prettyBytes(source.file.size);

    const originalUnit = originalSize
      ? unitMap[originalSize.unit] || originalSize.unit
      : '';

    const editedSize =
      editedFileSize !== undefined && prettyBytes(editedFileSize);

    const editedUnit = editedSize
      ? unitMap[editedSize.unit] || editedSize.unit
      : '';

    return (
      <Fragment>
        <div
          class={`${style.output} ${altBackground ? style.altBackground : ''}`}
        >
          <two-up
            legacy-clip-compat
            class={style.twoUp}
            ref={linkRef(this, 'twoUpRef')}
            orientation={mobileView ? 'vertical' : 'horizontal'}
            // Event redirecting. See onRetargetableEvent.

            onPointerDownCapture={
              // We avoid pointer events in our PinchZoom due to a Safari bug.
              // That means we also need to avoid them here too, else we end up preventing the fallback mouse events.
              isSafari ? undefined : this.onRetargetableEvent
            }
            onMouseDownCapture={this.onRetargetableEvent}
            onWheelCapture={this.onRetargetableEvent}
          >
            <pinch-zoom
              onTouchStart={() => console.log('touch start')}
              onTouchMove={() => console.log('touch move')}
              onTouchEnd={() => console.log('touch end')}
              class={style.pinchZoom}
              ref={linkRef(this, 'pinchZoomLeft')}
            >
              <div class={style.canvasParent}>
                <canvas
                  class={`${style.pinchTarget} ${
                    aliasing ? style.pixelated : ''
                  }`}
                  ref={linkRef(this, 'canvasLeft')}
                  width={leftDraw && leftDraw.width}
                  height={leftDraw && leftDraw.height}
                  style={{
                    width: originalImage ? originalImage.width : '',
                    height: originalImage ? originalImage.height : '',
                    objectFit: leftImgContain ? 'contain' : '',
                  }}
                />
              </div>
            </pinch-zoom>

            <pinch-zoom
              class={style.pinchZoom}
              ref={linkRef(this, 'pinchZoomRight')}
            >
              <div class={style.canvasParent}>
                <canvas
                  class={`${style.pinchTarget} ${
                    aliasing ? style.pixelated : ''
                  }`}
                  ref={linkRef(this, 'canvasRight')}
                  width={rightDraw && rightDraw.width}
                  height={rightDraw && rightDraw.height}
                  style={{
                    width: originalImage ? originalImage.width : '',
                    height: originalImage ? originalImage.height : '',
                    objectFit: rightImgContain ? 'contain' : '',
                  }}
                />
              </div>
            </pinch-zoom>
            <div className={style.cover}>
              <div className={style.sizes}>
                <div className={style.originalSize}>
                  <p>تصویر اصلی</p>
                  {/* **اصلاح شده:** نمایش حجم اصلی به صورت داینامیک */}
                  {originalSize ? (
                    <p>
                      حجم: {originalSize.value} {originalUnit}
                    </p>
                  ) : (
                    <p>حجم: درحال پردازش</p>
                  )}
                </div>
                <div className={style.optimizeSize}>
                  <p>تصویر بهینه‌شده</p>
                  {/* **اصلاح شده:** نمایش حجم ویرایش شده به صورت داینامیک */}
                  {editedSize ? (
                    <p>
                      حجم: {editedSize.value} {editedUnit}
                    </p>
                  ) : (
                    <p>حجم: درحال پردازش</p>
                  )}
                </div>
              </div>
            </div>
          </two-up>
        </div>
      </Fragment>
    );
  }
}
