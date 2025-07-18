import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { Arrow } from 'client/lazy-app/icons';

interface Props extends preact.JSX.HTMLAttributes {
  large?: boolean;
  largeInput?: boolean;
}
interface State {}

export default class Select extends Component<Props, State> {
  render(props: Props) {
    const { large, largeInput = false, ...otherProps } = props;

    return (
      <div class={style.select}>
        {/* @ts-ignore - TS bug https://github.com/microsoft/TypeScript/issues/16019 */}
        <select
          class={largeInput ? style.largeBuiltinSelect : style.builtinSelect}
          {...otherProps}
        />
        <div class={largeInput ? style.largeInputArrow : style.arrow}>
          <Arrow />
        </div>
      </div>
    );
  }
}
