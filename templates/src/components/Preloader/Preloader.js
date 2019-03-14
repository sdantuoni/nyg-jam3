import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import preloader from 'preloader';
import noop from 'no-op';
import wait from '@jam3/wait';
import checkProps from '@jam3/react-check-extra-props';
import { withNamespaces } from 'react-i18next';

import './Preloader.scss';

import { ReactComponent as LoaderIcon } from '../../assets/svg/loader.svg';

import animate from '../../util/gsap-animate';
import { setProgress, setReady } from '../../redux/modules/preloader';
import preloadAssets from '../../data/preload-assets';
import i18PropsList from '../../data/i18n-props-list';

class Preloader extends React.PureComponent {
  async componentDidMount() {
    this.copyPromise = new Promise(resolve => (this.copyPromiseResolve = resolve));
    await Promise.all([this.setTimer(), this.setLoader(), this.copyPromise]);
    this.setDone();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.copy && this.props.copy) {
      this.copyPromiseResolve();
    }
  }

  animateOut(onComplete) {
    return animate.to(this.container, 0.3, { autoAlpha: 0, onComplete });
  }

  async setTimer() {
    return await wait(this.props.minDisplayTime);
  }

  setLoader() {
    return this.props.assets.length
      ? new Promise((resolve, reject) => {
          this.loader = preloader(this.props.options);
          this.props.assets.forEach(file => this.add(file));
          this.loader.on('progress', this.onProgress);
          this.loader.on('complete', () => this.onComplete(resolve));
          this.load();
        })
      : Promise.resolve();
  }

  add(url, options = {}) {
    this.loader.add(url, options);
  }

  load() {
    this.loader.load();
  }

  onProgress = val => {
    this.props.setProgress(val);
  };

  onComplete = done => {
    this.props.setProgress(1);
    done();
  };

  setDone = async () => {
    await this.animateOut();
    this.props.setReady(true);
  };

  render() {
    return (
      <section id="Preloader" ref={r => (this.container = r)}>
        <LoaderIcon className="loader-icon" />
      </section>
    );
  }
}

Preloader.propTypes = checkProps(
  {
    className: PropTypes.string,
    assets: PropTypes.array.isRequired,
    setProgress: PropTypes.func.isRequired,
    setReady: PropTypes.func.isRequired,
    minDisplayTime: PropTypes.number,
    options: PropTypes.object,
    progress: PropTypes.number,
    transitionState: PropTypes.string,
    copy: PropTypes.oneOfType([PropTypes.object, PropTypes.array])
  },
  [...i18PropsList]
);

Preloader.defaultProps = {
  className: '',
  assets: [],
  minDisplayTime: 300, // in milliseconds
  options: {
    xhrImages: false,
    loadFullAudio: false,
    loadFullVideo: false,
    onProgress: noop,
    onComplete: noop
  }
};

const mapStateToProps = (state, ownProps) => {
  const copy = ownProps.i18n.getDataByLanguage(ownProps.i18n.language);
  return {
    progress: state.preloader.progress,
    assets: preloadAssets || [],
    copy: copy ? copy[state.i18next.defaultNS] : null
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setProgress: val => dispatch(setProgress(val)),
    setReady: val => dispatch(setReady(val))
  };
};

export default withNamespaces('default')(
  connect(
    mapStateToProps,
    mapDispatchToProps,
    undefined,
    { withRef: true }
  )(Preloader)
);
