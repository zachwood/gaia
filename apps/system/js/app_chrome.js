'use strict';

(function(window) {
  var _id = 0;
  var _ = navigator.mozL10n.get;
  var BUTTONBAR_TIMEOUT = 5000;
  var BUTTONBAR_INITIAL_OPEN_TIMEOUT = 1500;

  /**
   * The chrome UI of the appWindow.
   *
   * @class AppChrome
   * @param {AppWindow} app The app window instance this chrome belongs to.
   */
  window.AppChrome = function AppChrome(app) {
    this.app = app;
    this.instanceID = _id++;
    this.containerElement = app.element;
    this.render();

    if (this.app.config.chrome && this.app.config.chrome.navigation) {
      this.app.element.classList.add('navigation');
    }

    if (this.app.config.chrome && this.app.config.chrome.rocketbar) {
      this.app.element.classList.add('rocketbar');
    }
  };

  AppChrome.prototype.__proto__ = window.BaseUI.prototype;

  AppChrome.prototype.CLASS_NAME = 'AppChrome';

  AppChrome.prototype.EVENT_PREFIX = 'chrome';

  AppChrome.prototype._DEBUG = true;

  AppChrome.prototype.hidingNavigation = false;

  AppChrome.prototype.view = function an_view() {
    return '<div class="chrome" id="' +
            this.CLASS_NAME + this.instanceID + '">' +
            '<header class="progress"></header>' +
            '<footer class="navigation closed visible">' +
              '<div class="handler"></div>' +
              '<menu type="buttonbar">' +
                '<button type="button" class="back-button"' +
                ' alt="Back" data-disabled="disabled"></button>' +
                '<button type="button" class="forward-button"' +
                ' alt="Forward" data-disabled="disabled"></button>' +
                '<button type="button" class="reload-button"' +
                ' alt="Reload"></button>' +
                '<button type="button" class="bookmark-button"' +
                ' alt="Bookmark" data-disabled="disabled"></button>' +
                '<button type="button" class="close-button"' +
                ' alt="Close"></button>' +
              '</menu>' +
            '</footer>' +
          '</div>';
  };

  AppChrome.prototype._fetchElements = function ac__fetchElements() {
    this.element = this.containerElement.querySelector('.chrome');
    this.navigation = this.element.querySelector('.navigation');
    this.progress = this.element.querySelector('.progress');
    this.openButton = this.element.querySelector('.handler');
    this.bookmarkButton = this.element.querySelector('.bookmark-button');
    this.reloadButton = this.element.querySelector('.reload-button');
    this.forwardButton = this.element.querySelector('.forward-button');
    this.backButton = this.element.querySelector('.back-button');
    this.closeButton = this.element.querySelector('.close-button');
  };

  AppChrome.prototype.handleEvent = function ac_handleEvent(evt) {
    switch (evt.type) {
      case 'click':
        this.handleClickEvent(evt);
        break;

      case '_loading':
        this.show(this.progress);
        break;

      case '_loaded':
        this.hide(this.progress);
        break;

      case 'mozbrowserlocationchange':
        this.handleLocationChanged(evt);
        break;

      case '_opened':
        this.handleOpened(evt);
        break;

      case '_closing':
        this.handleClosing(evt);
        break;

      case '_withkeyboard':
        if (this.app && this.app.isActive()) {
          this.hide(this.navigation);
          this.hidingNavigation = true;
        }
        break;

      case '_withoutkeyboard':
        if (this.app) {
          this.show(this.navigation);
          this.hidingNavigation = false;
        }
        break;

      case '_homegesture-enabled':
        this.holdNavigation();
        break;

      case '_homegesture-disabled':
        this.releaseNavigation();
        break;
    }
  };

  AppChrome.prototype.handleClickEvent = function ac_handleClickEvent(evt) {
    switch (evt.target) {
      case this.openButton:
        if (this.closingTimer)
          window.clearTimeout(this.closingTimer);
        this.navigation.classList.remove('closed');
        this.closingTimer = setTimeout(function() {
          this.navigation.classList.add('closed');
        }.bind(this), BUTTONBAR_TIMEOUT);
        break;

      case this.reloadButton:
        this.clearButtonBarTimeout();
        this.app.reload();
        break;

      case this.backButton:
        this.clearButtonBarTimeout();
        this.app.back();
        break;

      case this.forwardButton:
        this.clearButtonBarTimeout();
        this.app.forward();
        break;

      case this.bookmarkButton:
        this.addBookmark();
        break;

      case this.closeButton:
        if (this.closingTimer)
          window.clearTimeout(this.closingTimer);
        this.navigation.classList.add('closed');
        break;
    }
  };

  AppChrome.prototype._registerEvents = function ac__registerEvents() {
    this.openButton.addEventListener('click', this);
    this.closeButton.addEventListener('click', this);
    this.reloadButton.addEventListener('click', this);
    this.forwardButton.addEventListener('click', this);
    this.backButton.addEventListener('click', this);
    this.bookmarkButton.addEventListener('click', this);
    this.app.element.addEventListener('mozbrowserlocationchange', this);
    this.app.element.addEventListener('_loading', this);
    this.app.element.addEventListener('_loaded', this);
    this.app.element.addEventListener('_opened', this);
    this.app.element.addEventListener('_closing', this);
    this.app.element.addEventListener('_withkeyboard', this);
    this.app.element.addEventListener('_withoutkeyboard', this);
    this.app.element.addEventListener('_homegesture-enabled', this);
    this.app.element.addEventListener('_homegesture-disabled', this);
  };

  AppChrome.prototype._unregisterEvents = function ac__unregisterEvents() {
    this.openButton.removeEventListener('click', this);
    this.closeButton.removeEventListener('click', this);
    this.reloadButton.removeEventListener('click', this);
    this.forwardButton.removeEventListener('click', this);
    this.backButton.removeEventListener('click', this);
    this.bookmarkButton.removeEventListener('click', this);
    if (!this.app)
      return;
    this.app.element.removeEventListener('mozbrowserlocationchange', this);
    this.app.element.removeEventListener('_loading', this);
    this.app.element.removeEventListener('_loaded', this);
    this.app.element.removeEventListener('_opened', this);
    this.app.element.removeEventListener('_closing', this);
    this.app.element.removeEventListener('_withkeyboard', this);
    this.app.element.removeEventListener('_withoutkeyboard', this);
    this.app.element.removeEventListener('_homegesture-enabled', this);
    this.app.element.removeEventListener('_homegesture-disabled', this);
    this.app = null;
  };

  /**
   * Force the navigation to stay opened,
   * because we don't want to conflict with home gesture.
   */
  AppChrome.prototype.holdNavigation = function ac_holdNavigation() {
    if (this.closeButton.style.visibility !== 'hidden') {
      this.closeButton.style.visibility = 'hidden';
    }
    if (this.navigation.classList.contains('closed')) {
      this.navigation.classList.remove('closed');
    }
  };

  /**
   * Release the navigation opened state.
   */
  AppChrome.prototype.releaseNavigation = function ac_releaseNavigation() {
    if (this.closeButton.style.visibility !== 'visible') {
      this.closeButton.style.visibility = 'visible';
    }
    if (!this.navigation.classList.contains('closed')) {
      this.navigation.classList.add('closed');
    }
  };

  AppChrome.prototype.isButtonBarDisplayed = false;

  AppChrome.prototype.toggleButtonBar = function ac_toggleButtonBar(time) {
    clearTimeout(this.buttonBarTimeout);
    if (!HomeGesture.enable) {
      this.navigation.classList.toggle('closed');
    }
    this.isButtonBarDisplayed = !this.isButtonBarDisplayed;
    if (this.isButtonBarDisplayed) {
      this.buttonBarTimeout = setTimeout(this.toggleButtonBar.bind(this),
        time || BUTTONBAR_TIMEOUT);
    }
  };

  AppChrome.prototype.clearButtonBarTimeout =
    function ac_clearButtonBarTimeout() {
      clearTimeout(this.buttonBarTimeout);
      this.buttonBarTimeout =
        setTimeout(this.toggleButtonBar.bind(this), BUTTONBAR_TIMEOUT);
    };

  AppChrome.prototype.handleClosing = function ac_handleClosing() {
    clearTimeout(this.buttonBarTimeout);
    if (!HomeGesture.enable) {
      this.navigation.classList.add('closed');
    }
    this.isButtonBarDisplayed = false;
  };

  AppChrome.prototype.handleOpened =
    function ac_handleOpened() {
      this.toggleButtonBar(BUTTONBAR_INITIAL_OPEN_TIMEOUT);

      var dataset = this.app.config;
      if (dataset.originURL || dataset.searchURL) {
        delete this.bookmarkButton.dataset.disabled;
        return;
      }

      this.bookmarkButton.dataset.disabled = true;
    };

  AppChrome.prototype.handleLocationChanged =
    function ac_handleLocationChange() {
      if (!this.app)
        return;
      this.app.canGoForward(function forwardSuccess(result) {
        if (result === true) {
          delete this.forwardButton.dataset.disabled;
        } else {
          this.forwardButton.dataset.disabled = true;
        }
      }.bind(this));

      this.app.canGoBack(function backSuccess(result) {
        if (result === true) {
          delete this.backButton.dataset.disabled;
        } else {
          this.backButton.dataset.disabled = true;
        }
      }.bind(this));
    };

  AppChrome.prototype.addBookmark = function ac_addBookmark() {
    if (this.bookmarkButton.dataset.disabled)
      return;

    this.clearButtonBarTimeout();
    var dataset = this.app.config;
    var self = this;

    function selected(value) {
      if (!value)
        return;

      var name, url;
      if (value === 'origin') {
        name = dataset.originName;
        url = dataset.originURL;
      }

      if (value === 'search') {
        name = dataset.searchName;
        url = dataset.searchURL;
      }

      var activity = new MozActivity({
        name: 'save-bookmark',
        data: {
          type: 'url',
          url: url,
          name: name,
          icon: dataset.icon,
          useAsyncPanZoom: dataset.useAsyncPanZoom,
          iconable: false
        }
      });

      activity.onsuccess = function onsuccess() {
        if (value === 'origin') {
          delete self.app.config.originURL;
        }

        if (value === 'search') {
          delete self.app.config.searchURL;
        }

        if (!self.app.config.originURL &&
          !self.app.config.searchURL) {
          self.bookmarkButton.dataset.disabled = true;
        }
      };
    };

    var data = {
      title: _('add-to-home-screen'),
      options: []
    };

    if (dataset.originURL) {
      data.options.push({ id: 'origin', text: dataset.originName });
    }

    if (dataset.searchURL) {
      data.options.push({ id: 'search', text: dataset.searchName });
    }

    ModalDialog.selectOne(data, selected);
  };
}(this));
