import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import '../../custom-els/loading-spinner';

import infinity from 'url:./imgs/info-content/infinity-svgrepo-com.svg';
import secure from 'url:./imgs/info-content/secure-shield-password-protect-safe-svgrepo-com.svg';
import thunder from 'url:./imgs/info-content/thunder-bolt-hand-drawn-shape-outline-svgrepo-com.svg';
import security from 'url:./imgs/info-content/security-svgrepo-com.svg';
import quality from 'url:./imgs/info-content/star-emphasis-svgrepo-com.svg';
import tool from 'url:./imgs/info-content/tool-01-svgrepo-com.svg';
import users from 'url:./imgs/info-content/users-svgrepo-com.svg';
import checkedImage from 'url:./imgs/info-content/image-square-check-svgrepo-com.svg';
// import logoWithText from 'data-url-text:./imgs/image.png';
import * as style from './style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import 'shared/custom-els/snack-bar';

const installButtonSource = 'introInstallButton-Purple';

const faqs = [
  {
    question: 'چگونه می‌توانم حجم تصویر را کاهش دهم؟',
    answer:
      'کافیست تصویر یا تصاویر خود را در کادر آپلود، انتخاب یا رها کنید. ابزار ما به طور خودکار بهترین فشرده‌سازی را برای کاهش حجم بدون افت کیفیت محسوس اعمال می‌کند.',
  },
  {
    question: 'آیا استفاده از این ابزار رایگان است؟',
    answer:
      'بله، استفاده از این فشرده‌ساز تصویر کاملاً رایگان است. شما می‌توانید به تعداد نامحدود و بدون هیچ هزینه‌ای تصاویر خود را بهینه کنید.',
  },
  {
    question: 'آیا فایل‌های من پس از آپلود امن هستند؟',
    answer:
      'قطعاً. تمام پردازش‌ها مستقیماً روی مرورگر و دستگاه شما انجام می‌شود. هیچ فایلی به سرورهای ما ارسال نمی‌شود و حریم خصوصی شما ۱۰۰٪ حفظ می‌گردد.',
  },
  {
    question: 'چه فرمت‌های تصویری پشتیبانی می‌شوند؟',
    answer:
      'این ابزار از محبوب‌ترین فرمت‌های تصویر مانند JPEG، PNG، WEBP و SVG پشتیبانی می‌کند. شما می‌توانید هر یک از این فرمت‌ها را برای بهینه‌سازی آپلود کنید.',
  },
  {
    question: 'آیا کیفیت تصویر پس از فشرده‌سازی کاهش می‌یابد؟',
    answer:
      'هدف اصلی ما، کاهش حجم با حفظ حداکثری کیفیت است. الگوریتم‌های ما به گونه‌ای طراحی شده‌اند که افت کیفیت با چشم غیرمسلح قابل تشخیص نباشد.',
  },
];

interface Props {
  onFile?: (file: File) => void;
  showSnack?: SnackBarElement['showSnackbar'];
}
interface State {
  fetchingDemoIndex?: number;
  beforeInstallEvent?: BeforeInstallPromptEvent;
  openFaqIndex: number | null;
}

export default class Intro extends Component<Props, State> {
  state: State = {
    openFaqIndex: null,
  };
  private fileInput?: HTMLInputElement;
  private installingViaButton = false;

  componentDidMount() {
    // Listen for beforeinstallprompt events, indicating Squoosh is installable.
    window.addEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );

    // Listen for the appinstalled event, indicating Squoosh has been installed.
    window.addEventListener('appinstalled', this.onAppInstalled);
  }

  componentWillUnmount() {
    window.removeEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );
    window.removeEventListener('appinstalled', this.onAppInstalled);
  }

  private onFileChange = (event: Event): void => {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    this.fileInput!.value = '';
    this.props.onFile!(file);
  };

  private onOpenClick = () => {
    this.fileInput!.click();
  };

  private toggleFaq = (index: number) => {
    this.setState({
      openFaqIndex: this.state.openFaqIndex === index ? null : index,
    });
  };

  private onBeforeInstallPromptEvent = (event: BeforeInstallPromptEvent) => {
    // Don't show the mini-infobar on mobile
    event.preventDefault();

    // Save the beforeinstallprompt event so it can be called later.
    this.setState({ beforeInstallEvent: event });

    // Log the event.
    const gaEventInfo = {
      eventCategory: 'pwa-install',
      eventAction: 'promo-shown',
      nonInteraction: true,
    };
    ga('send', 'event', gaEventInfo);
  };

  private onAppInstalled = () => {
    // We don't need the install button, if it's shown
    this.setState({ beforeInstallEvent: undefined });

    // Don't log analytics if page is not visible
    if (document.hidden) return;

    // Try to get the install, if it's not set, use 'browser'
    const source = this.installingViaButton ? installButtonSource : 'browser';
    ga('send', 'event', 'pwa-install', 'installed', source);

    // Clear the install method property
    this.installingViaButton = false;
  };

  render({}: Props, { fetchingDemoIndex, openFaqIndex }: State) {
    return (
      <div class={style.intro}>
        <input
          class={style.hide}
          ref={linkRef(this, 'fileInput')}
          type="file"
          onChange={this.onFileChange}
        />

        <div class={style.main}>
          <h1 class={style.logoContainer}>بهینه‌ساز هوشمند تصاویر</h1>
          {/* This is the new upload section.
            The old blob SVG and canvas have been removed. 
          */}
          <div onClick={this.onOpenClick} class={style.uploadBox}>
            <p class={style.dragDropSpan}>
              برای شروع بهینه سازی عکس خود را اینجا رها کنید
            </p>
            <button class={style.selectFileBtn}>انتخاب فایل</button>
            <div class={style.secureDiv}>
              <p class={style.secureSpan}>فایل‌های شما امن هستند </p>
              <img
                src={secure}
                alt="silhouette of a cloud with a 'no' symbol on top"
              />
            </div>
          </div>
        </div>
        <section class={style.infoSection}>
          <div class={style.info}>
            <img
              src={infinity}
              alt="silhouette of a cloud with a 'no' symbol on top"
            />
            <p class={style.infoTitle}>نامحدود</p>
            <p class={style.infoContent}>
              این فشرده‌ساز تصویر رایگان است و به شما امکان می‌دهد به تعداد
              نامحدود از آن استفاده کنید و حجم تصویر را به صورت آنلاین فشرده
              کنید.
            </p>
          </div>
          <div class={style.info}>
            <img
              src={thunder}
              alt="silhouette of a cloud with a 'no' symbol on top"
            />
            <p class={style.infoTitle}>فشرده‌سازی سریع</p>
            <p class={style.infoContent}>
              پردازش فشرده‌سازی آن قدرتمند است. بنابراین، فشرده‌سازی تمام تصاویر
              انتخاب‌شده زمان کمتری می‌برد.{' '}
            </p>
          </div>
          <div class={style.info}>
            <img
              src={security}
              alt="silhouette of a cloud with a 'no' symbol on top"
            />
            <p class={style.infoTitle}>امنیت</p>
            <p class={style.infoContent}>
              {' '}
              تمام پردازش‌ها روی دستگاه شما انجام می‌شود و هیچ تصویری هرگز از
              کامپیوترتان خارج نخواهد شد.
            </p>
          </div>
          <div class={style.info}>
            <img
              src={quality}
              alt="silhouette of a cloud with a 'no' symbol on top"
            />
            <p class={style.infoTitle}>کیفیت</p>
            <p class={style.infoContent}>
              حجم عکس‌هایتان را بدون افت کیفیت محسوس کاهش دهید و سرعت بارگذاری
              را بالا ببرید.{' '}
            </p>
          </div>
          <div class={style.info}>
            <img
              src={tool}
              alt="silhouette of a cloud with a 'no' symbol on top"
            />
            <p class={style.infoTitle}>ابزار قدرتمند</p>
            <p class={style.infoContent}>
              شما می‌توانید با استفاده از هر مرورگری از هر سیستم عاملی، به صورت
              آنلاین به فشرده‌ساز تصویر در اینترنت دسترسی داشته باشید یا از آن
              استفاده کنید.{' '}
            </p>
          </div>
          <div class={style.info}>
            <img
              src={users}
              alt="silhouette of a cloud with a 'no' symbol on top"
            />
            <p class={style.infoTitle}>کاربرپسند</p>
            <p class={style.infoContent}>
              این ابزار برای همه کاربران طراحی شده است، دانش پیشرفته‌ای لازم
              نیست. بنابراین، فشرده‌سازی حجم تصویر آسان است.
            </p>
          </div>
        </section>
        <section class={style.questionSection}>
          <div>
            <h2>چگونه تصویر را به صورت آنلاین فشرده کنیم؟</h2>
            <p>1. تصویری را که می‌خواهید فشرده کنید، انتخاب کنید.</p>
            <p>
              2. پیش‌نمایش تمام تصاویر انتخاب شده را در Image Compressor مشاهده
              کنید
            </p>
            <p>
              3. می‌توانید اندازه تصویر را با استفاده از اسلایدر متناسب تنظیم
              کنید.
            </p>
            <p>4. همچنین، می‌توانید تصاویر را از لیست اضافه یا حذف کنید.</p>
            <p>
              5. در نهایت، تصاویر فشرده شده را از Image Compressor دانلود کنید.
            </p>
          </div>
          <div>
            <img
              src={checkedImage}
              alt="silhouette of a cloud with a 'no' symbol on top"
            />
          </div>
        </section>
        <section class={style.faqSection}>
          <h2 class={style.faqHeader}>سوالات متداول</h2>
          {faqs.map((faq, index) => (
            <div class={style.faqItem}>
              <button
                class={style.faqQuestion}
                onClick={() => this.toggleFaq(index)}
              >
                <span>{faq.question}</span>
                <span
                  class={`${style.faqIcon} ${
                    openFaqIndex === index ? style.faqIconOpen : ''
                  }`}
                >
                  +
                </span>
              </button>
              <div
                class={`${style.faqAnswer} ${
                  openFaqIndex === index ? style.faqAnswerOpen : ''
                }`}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </section>

        <footer class={style.footer}>
          <div class={style.footerContainer}>
            <svg viewBox="0 0 1920 79" class={style.topWave}>
              <path
                d="M0 59l64-11c64-11 192-34 320-43s256-5 384 4 256 23 384 34 256 21 384 14 256-30 320-41l64-11v94H0z"
                class={style.footerWave}
              />
            </svg>
            <div class={style.footerPadding}>
              <footer class={style.footerItems}>
                <a
                  class={style.footerLink}
                  href="https://github.com/GoogleChromeLabs/squoosh/blob/dev/README.md#privacy"
                >
                  حریم خصوصی
                </a>
              </footer>
            </div>
          </div>
        </footer>
      </div>
    );
  }
}
