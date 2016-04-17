var GiftButton = (function(window, undefined) {

  var secure = window.location.protocol === 'https:';
  var apiLocation = 'https' + '@@apiLocation';
  var serverLocation = 'https://simalexan.github.io';
  var cisApiLocation = 'https://stage-cis.giftconnect.com';
  var dashboardLocation = 'http:/stage-app.giftconnect.com';
  var psApiLocation = 'https://stage-ps.giftconnect.com/v1';
  var trackingApiLocation = 'https://stage-ps.giftconnect.com/v1';
  var serverPath = '/gbtn';
  var jsPath = '';
  var cssFile = 'gbtn.min.css';
  var cssPath = '/css/' +  cssFile;
  var sendDataPathExtension = '/issuing/giftbutton/';
  var completeUrl = serverLocation + serverPath;

  var GiftButton = {
    serverUrl: completeUrl,
    promotions: [],
    progressBar: {
      formSteps: 0,
      progPortion: 0,
      progCurrent: 0
    },
    uuid: null,
    giftImageUrl: '',
    giftName: '',
    logoUrl: '',
    currentGift: {},
    data: {
      email: '',
      gender: '',
      age: ''
    },
    positions: ['bl', 'br', 'loose'],
    cookie: null,
    bannerModule: null,
    checker: null,
    ctaText: ''
  };

  function loadScript(url, callback) {
    var script = document.createElement('script');
    script.async = true;
    script.src = url;
    var entry = document.getElementsByTagName('script')[0];
    entry.parentNode.insertBefore(script, entry);
    script.onload = script.onreadystatechange = function() {
      var rdyState = script.readyState;
      if (!rdyState || /complete|loaded/.test(script.readyState)) {
        callback();
        script.onload = null;
        script.onreadystatechange = null;
      }
    };
  }

  function loadStylesheet(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    var entry = document.getElementsByTagName('script')[0];
    entry.parentNode.insertBefore(link, entry);
  }

  function loadSupportingFiles(callback) {
    loadStylesheet(GiftButton.serverUrl + cssPath);
    loadGiftElementTemplate();
    loadScript(GiftButton.serverUrl + jsPath +'/jq.js', function() {
      loadScript(GiftButton.serverUrl + jsPath + '/jq-ea.js', function (){
        loadScript(GiftButton.serverUrl + jsPath + '/bugsnag-2.min.js', function (){

          GiftButton.gbSnag = Bugsnag.noConflict();
          GiftButton.gbSnag.apiKey = '5148ebbc874795d81d0ff61c9982ac9a';
          GiftButton.gbSnag.releaseStage = 'demo-v2-stage';
          GiftButton.gbSnag.beforeNotify = function(payload) {
            var match = payload.file.match(/gbtn\.js|jq\.js|jq-ea\.js/i);
            return !!(match && match[0].length > 0);
          };
          callback();
        });
      });
    });
  }

  function getScriptUrl() {
    var scripts = document.getElementsByTagName('script');
    var element;
    var src;
    for (var i = 0; i < scripts.length; i++) {
      element = scripts[i];
      var gbtn = new RegExp(GiftButton.serverUrl+jsPath+'/gbtn.js');
      src = element.src;
      if (src && gbtn.test(src)) {
        return src;
      }
    }
    return null;
  }

  function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  }

  function setCookie(name,value,days) {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
  }

  function getQueryParameters(query) {
    var args = query.split('&');
    var params = {};
    var pair;
    var key;
    var value;
    function decode(string) {
      return decodeURIComponent(string || "")
        .replace('+', ' ');
    }
    for (var i = 0; i < args.length; i++) {
      pair = args[i].split('=');
      key = decode(pair[0]);
      value = decode(pair[1]);
      params[key] = value;
    }
    return params;
  }

  function getButtonParams() {
    var url = getScriptUrl();
    return getQueryParameters(url.replace(/^.*\?/, ''));
  }

  // vanilla xhRequest method for making requests
  function xhRequest(method, url, data, callback){
    var request = new XMLHttpRequest();
    request.withCredentials = true;
    request.open(method, url, true);
    var sendData = data;

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        var response;
        if (request.responseText == 'OK') {
          callback(null, {});
          return;
        }
        response = request.responseText ? JSON.parse(request.responseText) : {};
        callback(null, response);
      } else {
        response = request.responseText ? JSON.parse(request.responseText) : request.response;
        callback(response, null);
      }
    };

    request.onerror = function() {
      hideButton();
      var response = request.responseText ? JSON.parse(request.responseText) : request.response;
      callback(response, null);
    };
    if (method === 'POST') {
      request.withCredentials = true;
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      if (data != null) {
        sendData = 'email='+ data.email +'&promotionId=' + data.promotionId;
        if (GiftButton.promotions.length >= 1) {
          sendData += ('&cookie=' + data._gc);
          sendData += ('&_gc=' + data._gc);
          sendData += ('&_gct=' + data._gct);
        }
      } else {
        sendData = null;
      }
    }

    request.send(sendData);
  }

  function loadHTMLFile(fileAddress, callback){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        callback(xhr.responseText);
      }
    };
    xhr.open('GET', fileAddress);
    xhr.send();
  }

  function hideButton(){
    document.querySelector('.gButton-button').remove();
  }

  GiftButton.copy = function (o) {
    var output, v, key;
    output = Array.isArray(o) ? [] : {};
    for (key in o) {
      v = o[key];
      output[key] = (typeof v === "object") ? GiftButton.copy(v) : v;
    }
    return output;
  };

  /**
   * get Box data for gift and brand
   * @param callback
   */
  function getGiftBoxData(callback){
    var gbURL = window.location.href;
    xhRequest('GET', psApiLocation + '/giftboxes/'+GiftButton.uuid +'?gbURL='+gbURL, null, function (error, data){
      var hasError = !!error || data.status == 'inactive';
      if (hasError){
        callback(hasError);
        return;
      }
      GiftButton.promotions = data.promotions;
      GiftButton.pms = GiftButton.copy(data.promotions);
      GiftButton.giftIndex = 0;
      setGiftByIndex(GiftButton.giftIndex);
      GiftButton.size = data.size || 'LARGE';    // size
      GiftButton.module = data.modules != null && data.modules != '' ? data.modules : 'E';   // modules - (E-email, G-gender, A-age, EGA-all).
      GiftButton.position = data.position || 'br';
      GiftButton.hasLogo = !!data.hasLogo;  // hasLogo
      GiftButton.externalUrl = data.externalUrl; // externalUrl
      GiftButton.locale = data.locale || 'ENG';
      GiftButton.ctaText = data.ctaText || '';
      GiftButton.thankYouMessage = data.thankYouMessage || '';
      GiftButton.thankYouEvent = data.thankYouEvent || '';
      GiftButton.thankYouFormat = data.thankYouFormat || '';
      GiftButton.hasThankYou = GiftButton.thankYouEvent.length > 1;
      GiftButton.numShowThankYou = data.numShowThankYou || 1;

      callback();
    });
  }

  function getGiftDataByIndex(index){
    var giftData = {};
    if (GiftButton.promotions.length == 0) {
      showNoGiftsModal();
      return;
    }

    giftData.promotionId = GiftButton.promotions[index].promotionId;
    giftData.giftImageUrl = GiftButton.promotions[index].giftImageUrl;
    giftData.giftName = GiftButton.promotions[index].giftName;
    giftData.logoUrl = GiftButton.promotions[index].logoUrl;
    giftData.giftId = GiftButton.promotions[index].giftId;
    giftData.brandId = GiftButton.promotions[index].brandId;
    giftData.musicMode = GiftButton.promotions[index].musicCode;
    giftData._gc = getGiftCookie(GiftButton.data.promotionId);
    if(GiftButton.cookies){
      giftData._gc = GiftButton.cookies[index]._gc;
      giftData.data._gct = GiftButton.cookies[index]._gct;
    }
    return giftData;
  }

  function setGiftByIndex(index){

    if (GiftButton.promotions.length == 0) {
      showNoGiftsModal();
      return;
    }

    GiftButton.data.promotionId = GiftButton.promotions[index].promotionId;
    GiftButton.currentGift.name = GiftButton.promotions[index].giftName;
    GiftButton.giftImageUrl = GiftButton.promotions[index].giftImageUrl;
    GiftButton.giftName = GiftButton.promotions[index].giftName;
    GiftButton.logoUrl = GiftButton.promotions[index].logoUrl;
    GiftButton.giftId = GiftButton.promotions[index].giftId;
    GiftButton.brandId = GiftButton.promotions[index].brandId;
    GiftButton.musicMode = GiftButton.promotions[index].musicCode;
    GiftButton.data._gc = getGiftCookie(GiftButton.data.promotionId);
    if(GiftButton.cookies){
      GiftButton.data._gc = GiftButton.cookies[index]._gc;
      GiftButton.data._gct = GiftButton.cookies[index]._gct;
    }

    if (GiftButton.cookies && !GiftButton.promotions[index].isSeen){
      GiftButton.promotions[index].isSeen = true;
      emitGiftLoad();
    }
  }

  function getGiftCookie (promotionId){
    if (!GiftButton.cookies) return null;
    for (var i = 0; i < GiftButton.cookies.length; i++) {
      var indexItem = GiftButton.cookies[i];
      if (indexItem.promotionId == promotionId) {
        return indexItem._gc;
      }
    }
    return null;
  }


  function trackButtonImpression(){
    xhRequest('POST', trackingApiLocation+'/giftboxes/'+GiftButton.uuid+'/impression', null, function (error, data){
      if (error) {
        hideButton();
      }
    });
  }

  function trackButtonHover(){
    var sentData = {};
    sentData.email = GiftButton.data.email;
    sentData.promotionId = GiftButton.data.promotionId;
    sentData._gct = GiftButton.data._gct;
    xhRequest('POST', trackingApiLocation+'/giftboxes/'+GiftButton.uuid+'/hover', sentData, function (error, data){});
  }

  function trackButtonClick(){
    var sentData = {};
    sentData.email = GiftButton.data.email;
    sentData.promotionId = GiftButton.data.promotionId;
    sentData._gct = GiftButton.data._gct;
    xhRequest('POST', trackingApiLocation+'/giftboxes/'+GiftButton.uuid+'/click', sentData, function (error, data){
        GiftButton.cookies = data;
        GiftButton.data._gc = data[GiftButton.giftIndex]._gc;
        GiftButton.data._gct = data[GiftButton.giftIndex]._gct;
        setGiftByIndex(GiftButton.giftIndex);
      if (!getCookie('_gc')) setCookie('_gc', data._gc, 1);
    });
  }

  function emitGiftLoad(){
    var sentData = {};
    sentData.promotionId = GiftButton.data.promotionId;
    sentData._gc = GiftButton.data._gc;
    sentData._gct = GiftButton.data._gct;
    xhRequest('POST', trackingApiLocation+'/giftboxes/'+GiftButton.uuid+'/load', sentData, function (error, data){
      if(error) console.log(error);
    });
  }

  function insertButtonProperTranslation(markup, callback){
    if (GiftButton.ctaText.length > 1){
      var ctaMarkup = markup.toString()
        .replace(/@@buttonHoverTextLarge/g, GiftButton.ctaText);
      callback(ctaMarkup);
    }

    loadHTMLFile(serverLocation + serverPath +'/translations/'+GiftButton.locale+'.json', function (translationData){
      var translations = JSON.parse(translationData);
      GiftButton.translations = translations;
      var translatedMarkup = markup.toString()
        .replace(/@@buttonHoverTextLarge/g, translations['buttonHoverText']['large'])
        .replace(/@@buttonHoverTextMedium/g, translations['buttonHoverText']['medium'])
        .replace(/@@buttonHoverTextSmall/g, translations['buttonHoverText']['small']);
      callback(translatedMarkup);
    });
  }

  function insertModalProperTranslation(markup){
    var translations = GiftButton.translations;
    return markup.toString()
      .replace(/@@thankYouMessage/g, GiftButton.thankYouMessage)
      .replace(/@@modalNavigationBack/g, translations['modal']['navigation']['back'])
      .replace(/@@modalNavigationContinue/g, translations['modal']['navigation']['continue'])
      .replace(/@@modalNavigationNext/g, translations['modal']['navigation']['next'])
      .replace(/@@modalExplainer/g, translations['modal']['explainer'])
      .replace(/@@modalCongratulationsHeadline/g, translations['modal']['congratulations']['headline'])
      .replace(/@@modalCongratulationsInstructions/g, translations['modal']['congratulations']['instructions'])
      .replace(/@@modalCongratulationsEmail/g, translations['modal']['congratulations']['takeMeToMyEmail'])
      .replace(/@@modalCongratulationsMoreGifts/g, translations['modal']['congratulations']['wantMoreGifts'])
      .replace(/@@modalCongratulationsGreatGiftCode/g, translations['modal']['congratulations']['greatGiftCode'])
      .replace(/@@modalCongratulationsClickToRedeem/g, translations['modal']['congratulations']['clickToRedeem'])
      .replace(/@@modalCongratulationsGetMoreGifts/g, translations['modal']['congratulations']['getMoreGifts'])
      .replace(/@@modalCongratulationsResend/g, translations['modal']['congratulations']['resend'])
      .replace(/@@modalEmailFormHeadline/g, translations['modal']['emailForm']['headline'])
      .replace(/@@modalEmailFormInvalidEmail/g, translations['modal']['emailForm']['invalidEmail'])
      .replace(/@@modalEmailFormGiftedEmail/g, translations['modal']['emailForm']['giftedEmail'])
      .replace(/@@modalEmailFormNoGifts/g, translations['modal']['emailForm']['noGifts'])
      .replace(/@@modalGenderFormHeadline/g, translations['modal']['genderForm']['headline'])
      .replace(/@@modalGenderFormOther/g, translations['modal']['genderForm']['other'])
      .replace(/@@modalAgeFormHeadline/g, translations['modal']['ageForm']['headline']);
  }


  function appendButtonMarkup(html) {
    var elem = GiftButton.$('[data-gift-button]').first();
    if (GiftButton.size == 'LARGE') {
      var pos = GiftButton.position,
        styleClass = 'gButton-position-';
      if (pos == undefined || GiftButton.positions.indexOf(pos) != -1){
        styleClass += pos ? pos : 'br';
        html = GiftButton.$(html).addClass(styleClass);
      }
    }
    elem.removeAttr('data-gift-button')
      .before(html);
  }


  function loadModalMarkup(callback){
    var modalTemplateType = GiftButton.promotions.length > 1 ? 'multi-modal-redesign' : 'modal';
    loadHTMLFile(serverLocation + serverPath +'/templates/' + modalTemplateType + '.html', function (htmlData){

      if (!GiftButton.hasLogo) {
        var tree = GiftButton.$('<div>'+htmlData+'</div>');
        tree.find('.gButton-logo-component').remove();
        htmlData = tree.html();
      }
      var markup = htmlData.toString();
      if (GiftButton.promotions.length >= 1) {
        var pMarkup = GiftButton.$(markup);
        var promoLogosMarkup = '';
        for (var i = 0; i < GiftButton.promotions.length; i++){
          promoLogosMarkup += '<li><img src="'+GiftButton.promotions[i].logoUrl+'"/></li>';
        }
        pMarkup.find('.gButton-img-list').html(promoLogosMarkup);
        markup = pMarkup.wrap('<p/>').parent().html();
      }

      markup = markup.toString()
        .replace(/@@serverUrl/g, GiftButton.serverUrl.toString())
        .replace(/@@giftName/g, GiftButton.giftName.toString())
        .replace(/@@logoUrl/g, GiftButton.logoUrl.toString());
      markup = insertModalProperTranslation(markup);

      if(GiftButton.promotions.length > 1){
        callback(markup);
        return;
      }

      // is single gift modal
      if (GiftButton.musicMode){
        var index = GiftButton.musicMode.indexOf('.js') + 3;
        GiftButton.musicMode = [GiftButton.musicMode.slice(0, index), '?gc_modal=true', GiftButton.musicMode.slice(index)].join('');
        var jMarkup = GiftButton.$('<div>'+markup+'</div>');
        jMarkup.find('.gButton-form-module').html(GiftButton.musicMode);
        markup = jMarkup[0].innerHTML;
      }
      callback(markup);
    });
  }

  function appendModalMarkup(callback){
    loadModalMarkup(function (modalMarkup){
      GiftButton.$('#gift-me').after(modalMarkup);
      callback();
    });
  }

  function renderButton(){
    var btnTmplUrl = serverLocation + serverPath +  '/templates/';
    if (GiftButton.hasThankYou){
      btnTmplUrl += 'button-1px.html';
    } else {
      switch(GiftButton.size) {
        case 'LARGE':
          btnTmplUrl += 'button-l.html';
          break;
        case 'MEDIUM':
          btnTmplUrl += 'button-m.html';
          break;
        case 'SMALL':
          btnTmplUrl += 'button-s.html';
          break;
        case 'SIDE':
          btnTmplUrl += 'button-side.html';
          break;
        default:
          btnTmplUrl += 'button-l.html';
          break;
      }
    }


    loadHTMLFile(btnTmplUrl, function (htmlData){
      var markup = htmlData.toString()
        .replace(/@@serverUrl/g, GiftButton.serverUrl.toString());
      insertButtonProperTranslation(markup, function (translatedMarkup){
        appendButtonMarkup(translatedMarkup);
        var elem = document.getElementById('gift-me');
        mouseEnterLeave(elem, 'mouseenter', trackButtonHover);
      });
    });
  }

  function setUpThankYou(){
    switch(GiftButton.thankYouEvent){
      case 'SCROLL':
        addEvent(document, 'scroll', function(evt) {
          if (evt.toElement == null && evt.relatedTarget == null) {
            if (document.body.scrollHeight == document.body.scrollTop + window.innerHeight) {
              GiftButton.handleScrollBottom();
            }

          }
        });
        break;
      case 'LEAVE':
        addEvent(document, 'mouseout', function(evt) {
          if (evt.toElement == null && evt.relatedTarget == null) {
            GiftButton.handleWindowLeave();
          }
        });
        break;
      case 'CUSTOM':
        break;
      case 'CUSTOM-EMAIL':
        break;
      default:
        break;
    }
  }

  GiftButton.handleScrollBottom = function(){
    if (GiftButton.numShowThankYou > 0){
      GiftButton.numShowThankYou--;
      GiftButton.openGiftModal();
    }

  };

  GiftButton.handleWindowLeave = function (){
    if (GiftButton.numShowThankYou > 0) {
      GiftButton.numShowThankYou--;
      GiftButton.openGiftModal();
    }
  };

  GiftButton.invokeGCModal = function (thankYouMessage, email){

    if (thankYouMessage){
      GiftButton.thankYouMessage = thankYouMessage.toString();
    }
    if(GiftButton.thankYouEvent == 'CUSTOM-EMAIL' && email.length > 0){
      GiftButton.inputtedEmail = email;
    }
    GiftButton.openGiftModal();
  };


  GiftButton.openGiftModal = function (){
    
    GiftButton.promotions = GiftButton.copy(GiftButton.pms);
    GiftButton.$('html').addClass('gButton-body');
    trackButtonClick();
    if(GiftButton.externalUrl){
      window.open(GiftButton.externalUrl, '_blank');
      return;
    }
    appendModalMarkup(function (){
      GiftButton.promotions = GiftButton.copy(GiftButton.pms);
      var allPromotionTpls = prepareAllPromotionTemplates(GiftButton.promotions);
      GiftButton.$('.gButton-slider').html(allPromotionTpls);
      setPromotionTplClasses();
      setTimeout(function (){
        GiftButton.$('.gButton-slider > .current > .gButton-slide').css({'background-image': 'url(' + GiftButton.giftImageUrl + ')'});
        GiftButton.$('.gButton-box, .gButton-popup-overlay').addClass('popup-shown');
        GiftButton.$('.gButton-slider-outer').addClass('in-view');
        addUILogic();
      },0);

      if (window.matchMedia("(max-width: 500px)").matches) {
        var scrollPos = window.scrollY + 40;
        GiftButton.$('.gButton-box').css('top', scrollPos+'px');
      }

      if(GiftButton.thankYouEvent == 'CUSTOM-EMAIL' && GiftButton.inputtedEmail.length > 0){
        GiftButton.$('.gButton-email-input').val(GiftButton.inputtedEmail);
      }

      setTimeout(function (){
        if (window.matchMedia("(min-width: 501px)").matches) {
          GiftButton.$('.gButton-email-input').focus();
        }
      }, 100);

      if(GiftButton.hasThankYou){
        GiftButton.$('.gButton-entry').addClass('in-view');
        setTimeout(function (){
          GiftButton.$('.gButton-entry').removeClass('in-view');
        }, 6000);
      } else {
        GiftButton.$('.gButton-thankyou-module').hide();
      }
    });

  };

  function loadGiftElementTemplate(){
    loadHTMLFile(serverLocation + serverPath +'/templates/gift-element.html', function (htmlData){
      GiftButton.giftTemplate = htmlData.toString();
    });
  }
  
  function prepareGiftTemplate(giftName, giftImageUrl, logoUrl){
    var translations = GiftButton.translations;
    var tpl = GiftButton.giftTemplate;
    tpl = tpl.toString()
      .replace(/@@thankYouMessage/g, GiftButton.thankYouMessage)
      .replace(/@@modalNavigationBack/g, translations['modal']['navigation']['back'])
      .replace(/@@modalNavigationContinue/g, translations['modal']['navigation']['continue'])
      .replace(/@@modalNavigationNext/g, translations['modal']['navigation']['next'])
      .replace(/@@modalExplainer/g, translations['modal']['explainer'])
      .replace(/@@modalCongratulationsHeadline/g, translations['modal']['congratulations']['headline'])
      .replace(/@@modalCongratulationsInstructions/g, translations['modal']['congratulations']['instructions'])
      .replace(/@@modalCongratulationsEmail/g, translations['modal']['congratulations']['takeMeToMyEmail'])
      .replace(/@@modalCongratulationsMoreGifts/g, translations['modal']['congratulations']['wantMoreGifts'])
      .replace(/@@modalCongratulationsGreatGiftCode/g, translations['modal']['congratulations']['greatGiftCode'])
      .replace(/@@modalCongratulationsClickToRedeem/g, translations['modal']['congratulations']['clickToRedeem'])
      .replace(/@@modalCongratulationsGetMoreGifts/g, translations['modal']['congratulations']['getMoreGifts'])
      .replace(/@@modalCongratulationsResend/g, translations['modal']['congratulations']['resend'])
      .replace(/@@modalEmailFormHeadline/g, translations['modal']['emailForm']['headline'])
      .replace(/@@modalEmailFormInvalidEmail/g, translations['modal']['emailForm']['invalidEmail'])
      .replace(/@@modalEmailFormGiftedEmail/g, translations['modal']['emailForm']['giftedEmail'])
      .replace(/@@modalEmailFormNoGifts/g, translations['modal']['emailForm']['noGifts'])
      .replace(/@@modalGenderFormHeadline/g, translations['modal']['genderForm']['headline'])
      .replace(/@@modalGenderFormOther/g, translations['modal']['genderForm']['other'])
      .replace(/@@modalAgeFormHeadline/g, translations['modal']['ageForm']['headline'])
      .replace(/@@serverUrl/g, GiftButton.serverUrl.toString())
      .replace(/@@giftName/g, giftName)
      .replace(/@@giftImageUrl/g, giftImageUrl)
      .replace(/@@logoUrl/g, logoUrl);

    return tpl;
  }

  function prepareAllPromotionTemplates(promos){
    var totalTpls = '';
    for (var i = 0; i<promos.length; i++){
      var promo = promos[i];
      totalTpls += prepareGiftTemplate(promo.giftName, promo.giftImageUrl, promo.logoUrl);
    }
    return totalTpls;
  }

  function setPromotionTplClasses(){
    var allGiftElems = GiftButton.$('.gButton-slider li');

    if (allGiftElems.length == 1){
      GiftButton.$(allGiftElems[0]).addClass('current');
      return;
    }

    if (allGiftElems.length == 2){
      GiftButton.$(allGiftElems[0]).addClass('current');
      GiftButton.$(allGiftElems[1]).addClass('next');
      return;
    }

    if (allGiftElems.length == 3){
      GiftButton.$(allGiftElems[0]).addClass('current');
      GiftButton.$(allGiftElems[1]).addClass('next');
      GiftButton.$(allGiftElems[2]).addClass('prev');
      return;
    }

    if (allGiftElems.length > 3){
      GiftButton.$(allGiftElems[0]).addClass('current');
      GiftButton.$(allGiftElems[1]).addClass('next');
      for(var i = 2; i<allGiftElems.length-1; i++){
        GiftButton.$(allGiftElems[i]).addClass('inactive');
      }
      GiftButton.$(allGiftElems[allGiftElems.length-1]).addClass('prev');
    }
  }

  GiftButton.nextGift = function(){
    removeRedBottomError();


    if (GiftButton.promotions.length == 2) {
      GiftButton.$('.gButton-slider > .next').removeClass('next').addClass('current active');
      GiftButton.$('.gButton-slider > .current').not('.active').removeClass('current').addClass('prev active');
      GiftButton.$('.gButton-slider > .current').removeClass('active');
      GiftButton.$('.gButton-slider > .prev').not('.active').removeClass('prev').addClass('current active');
      GiftButton.$('.gButton-slider > .prev').removeClass('active');

    } else if (GiftButton.promotions.length == 3) {

      GiftButton.$('.gButton-slider > .next').removeClass('next').addClass('current active');
      GiftButton.$('.gButton-slider > .current').not('.active').removeClass('current').addClass('prev active');
      GiftButton.$('.gButton-slider > .current').removeClass('active');
      GiftButton.$('.gButton-slider > .prev').not('.active').removeClass('prev').addClass('next');
      GiftButton.$('.gButton-slider > .prev').removeClass('active');

    } else if (GiftButton.promotions.length > 3){

      GiftButton.$('.gButton-slider > .next').removeClass('next').addClass('current active');
      GiftButton.$('.gButton-slider > .current').not('.active').removeClass('current').addClass('prev active');
      GiftButton.$('.gButton-slider > .current').removeClass('active');
      GiftButton.$('.gButton-slider > .prev').not('.active').removeClass('prev').addClass('inactive');
      GiftButton.$('.gButton-slider > .prev').removeClass('active');

      if (GiftButton.$('.gButton-slider > .current').prev('li.inactive').length) {
        GiftButton.$('.gButton-slider > .current').prev('li.inactive').removeClass('inactive').addClass('next');
      } else {
        GiftButton.$('.gButton-slider > li.inactive:last').removeClass('inactive').addClass('next');
      }

    }

    /*GiftButton.$('.gButton-slider .prev').addClass('move-right');
    GiftButton.$('.gButton-slider .current').addClass('move-right');
    GiftButton.$('.gButton-slider .next').addClass('move-right');

    setTimeout(function(){


     GiftButton.$('.gButton-slider .prev').removeClass('prev').addClass('next');
     GiftButton.$('.gButton-slider .current').removeClass('current').addClass('next');
     GiftButton.$('.gButton-slider .next').removeClass('next').addClass('inactive');
     }, 1000);*/

    /*GiftButton.$('.gButton-slider .next').addClass('move-right');
    GiftButton.$('.gButton-slider .current').addClass('move-right');
    GiftButton.$('.gButton-slider .prev').addClass('remove-from-view');
    GiftButton.$('.gButton-slider .next-in-line').removeClass('inactive').addClass('next');*/

    if (GiftButton.$('.gButton-overlay').hasClass('show-congradulation')) removeCongratsModalMoreGifts();
    if (GiftButton.$('#klickpush_iframe').contents().find('#kp_email').val()) {
      var inputEmailVal = GiftButton.$('#klickpush_iframe').contents().find('#kp_email').val();
      GiftButton.inputtedEmail = inputEmailVal;
    } else {
      GiftButton.inputtedEmail = GiftButton.$('.gButton-email-input').val();
    }
    GiftButton.giftIndex++;
    if (GiftButton.giftIndex >= GiftButton.promotions.length) GiftButton.giftIndex = 0;
    setGiftByIndex(GiftButton.giftIndex);
    if(GiftButton.checker) clearInterval(GiftButton.checker);
    this.changeModalGift();
  };

  function removeCongratsModalMoreGifts(){
    GiftButton.$('.gButton-form-module').show();

    GiftButton.promotions.splice(GiftButton.giftIndex, 1);
    GiftButton.cookies.splice(GiftButton.giftIndex, 1);

    resetCongratulations();
    GiftButton.$('.gButton-overlay').removeClass('show-congradulation');

    if (GiftButton.promotions.length < 1){
      showNoGiftsModal();
    }
  }


  GiftButton.previousGift = function (){
    removeRedBottomError();

    if (GiftButton.promotions.length == 2) {
      GiftButton.$('.gButton-slider > .prev').removeClass('prev').addClass('current active');
      GiftButton.$('.gButton-slider > .current').not('.active').removeClass('current').addClass('next active');
      GiftButton.$('.gButton-slider > .current').removeClass('active');
      GiftButton.$('.gButton-slider > .prev').not('.active').removeClass('prev').addClass('current active');
      GiftButton.$('.gButton-slider > .prev').removeClass('active');

    } else if (GiftButton.promotions.length == 3) {

      GiftButton.$('.gButton-slider > .prev').removeClass('prev').addClass('current active');
      GiftButton.$('.gButton-slider > .current').not('.active').removeClass('current').addClass('next active');
      GiftButton.$('.gButton-slider > .current').removeClass('active');
      GiftButton.$('.gButton-slider > .next').not('.active').removeClass('next').addClass('prev');
      GiftButton.$('.gButton-slider > .next').removeClass('active');

    } else if (GiftButton.promotions.length > 3){

      GiftButton.$('.gButton-slider > .prev').removeClass('prev').addClass('current active');
      GiftButton.$('.gButton-slider > .current').not('.active').removeClass('current').addClass('next active');
      GiftButton.$('.gButton-slider > .current').removeClass('active');
      GiftButton.$('.gButton-slider > .next').not('.active').removeClass('next').addClass('inactive');
      GiftButton.$('.gButton-slider > .next').removeClass('active');
      if (GiftButton.$('.gButton-slider > .current').next('li.inactive').length) {
        GiftButton.$('.gButton-slider > .current').next('li.inactive').removeClass('inactive').addClass('prev');
      } else {
        GiftButton.$('.gButton-slider > li.inactive:first').removeClass('inactive').addClass('prev');
      }
    }


    if (GiftButton.$('.gButton-overlay').hasClass('show-congradulation')) removeCongratsModalMoreGifts();
    if (GiftButton.$('#klickpush_iframe').contents().find('#kp_email').val()) {
      var inputEmailVal = GiftButton.$('#klickpush_iframe').contents().find('#kp_email').val();
      GiftButton.inputtedEmail = inputEmailVal;
    } else {
      GiftButton.inputtedEmail = GiftButton.$('.gButton-email-input').val();
    }
    GiftButton.giftIndex--;
    if (GiftButton.giftIndex <= -1) GiftButton.giftIndex = GiftButton.promotions.length - 1;
    setGiftByIndex(GiftButton.giftIndex);
    if(GiftButton.checker) clearInterval(GiftButton.checker);
    this.changeModalGift();
  };

  function sentMusicGiftEmail(){
    GiftButton.$('.gButton-explainer-component').hide();
    GiftButton.$('.gButton-congradulations-module > .gButton-main-headline').html(GiftButton.translations['modal']['congratulations']['headline']);
    removeBannerComponents();
    showCongradulations();
  }

  function isEmailSubmitted(){
    var moduleBox = GiftButton.$('.gButton-multi-box');
    GiftButton.checker = setInterval(function (){
      var callbackVal = moduleBox.find('#kp_wrapper').attr('callback-action');
      if (callbackVal == 'emailSubmit'){
        hideMusicView(moduleBox, moduleBox.find('.gButton-music-module'));
        clearInterval(GiftButton.checker);
        sentMusicGiftEmail();
      }
    }, 500);
  }

  GiftButton.changeModalGift = function() {
    var moduleBox = GiftButton.$('.gButton-multi-box');
    var musicModule = moduleBox.find('.gButton-music-module');
    var bannerElm = GiftButton.$('section.gButton-banner-module');
    moduleBox.addClass('gButton-gift-loading');
    setTimeout(function(){
      if (GiftButton.musicMode) {
        if (GiftButton.musicMode.indexOf('gc_modal=true') == -1 && GiftButton.$('#klickpush_iframe').length > 0) {
          var searchString = '?empty_css=true';
          var index = GiftButton.musicMode.indexOf(searchString) + searchString.length;
          GiftButton.musicMode = [GiftButton.musicMode.slice(0, index), '&gc_modal=true', GiftButton.musicMode.slice(index)].join('');
          GiftButton.musicMode = '<div id="svedka-player">'+ GiftButton.musicMode +'</div>';
        }
        moduleBox.find('.gButton-form-module').hide();
        moduleBox.find('.gButton-banner-module').hide();
        musicModule.html(GiftButton.musicMode);
        musicModule.addClass('music');
        musicModule.show();

        setTimeout(function (){
          GiftButton.$('#klickpush_iframe').contents().find('#kp_email').val(GiftButton.inputtedEmail);
          isEmailSubmitted();
        }, 3000);
      } else {
        if (musicModule.hasClass('music')) {
          moduleBox.find('.gButton-form-module').show();
          GiftButton.musicMode = null;
          hideMusicView(moduleBox, musicModule);
        }
      }
      bannerElm.find('.gButton-main-headline > span').html(GiftButton.giftName);
      GiftButton.$('.gButton-multi-logo-component img').attr('src', GiftButton.logoUrl);
      bannerElm.css({'background-image': 'url(' + GiftButton.giftImageUrl + ')'});
      GiftButton.$('.gButton-email-input').val(GiftButton.inputtedEmail);
      moduleBox.removeClass('gButton-gift-loading');
    }, 1000);
  };

  /**
   *
   * @param moduleBox - jq main module elem
   * @param musicModule - jq music module elm
   */
  function hideMusicView(moduleBox, musicModule){
    moduleBox.find('.gButton-banner-module').show();
    moduleBox.find('.gButton-music-module').hide();
    musicModule.removeClass('music');
    moduleBox.find('.gButton-music-module').html(null);
  }

  var addEvent = window.addEventListener ? function (elem, type, method) {
    elem.addEventListener(type, method, false);
  } : function (elem, type, method) {
    elem.attachEvent('on' + type, method);
  };

  var removeEvent = window.removeEventListener ? function (elem, type, method) {
    elem.removeEventListener(type, method, false);
  } : function (elem, type, method) {
    elem.detachEvent('on' + type, method);
  };

  function contains(container, maybe) {
    return container.contains ? container.contains(maybe) :
      !!(container.compareDocumentPosition(maybe) && 16);
  }

  function mouseEnterLeave(elem, type, method) {
    var mouseEnter = type === 'mouseenter',
      ie = mouseEnter ? 'fromElement' : 'toElement',
      method2 = function (e) {
        e = e || window.event;
        var target = e.target || e.srcElement,
          related = e.relatedTarget || e[ie];
        if ((elem === target || contains(elem, target)) &&
          !contains(elem, related)) {
          method();
        }
      };
    type = mouseEnter ? 'mouseover' : 'mouseout';
    addEvent(elem, type, method2);
    return method2;
  }

  function isEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
  }

  function removeBannerComponents(){
    GiftButton.$('.gButton-explainer-component, .gButton-logo-component').addClass('remove-from-view');
  }

  function showBannerComponents(){
    GiftButton.$('.gButton-explainer-component, .gButton-logo-component').removeClass('remove-from-view');
  }

  function showCongradulations(){

    GiftButton.promotions = [GiftButton.promotions[0]];
    if(GiftButton.promotions.length < 2){
      GiftButton.$('.congrats-box .congrats-bottom').hide();
    }
    setTimeout(function () {
      GiftButton.$('.gButton-slide').addClass('congrats-in-view');
    }, 20);

    if(GiftButton.promotions.length < 1){
      //GiftButton.$('.gButton-prev-arrow, .gButton-next-arrow, .gButton-resend-email').hide();
    }
  }

  function showNoGiftsModal(){
    var descriptionText = GiftButton.translations['modal']['noCodesError'];
    var headlineText = GiftButton.translations['modal']['congratulations']['sorryHeadline'];
    removeBannerComponents();
    showCongradulations();

    var congModule = GiftButton.$('.gButton-congradulations-module');
    congModule.find('.gButton-main-headline').html(headlineText);
    congModule.find('.congrats-box.gButton-entry > h4').html(descriptionText);

    GiftButton.$('.gButton-banner-module > .gButton-explainer-component').hide();

    var okBtn = congModule.find('.gButton-to-email');
    okBtn.html(GiftButton.translations['modal']['navigation']['ok']);
    okBtn.removeAttr('onclick');
    okBtn.bind('click', resetNoGiftModifications);

    congModule.find('.gButton-resend-email').hide();
  }

  function resetNoGiftModifications() {
    var congModule = GiftButton.$('.gButton-congradulations-module');
    congModule.find('.gButton-main-headline').html(GiftButton.translations['modal']['congratulations']['greatGiftCode']);
    congModule.find('.congrats-box.gButton-entry > h4').html(GiftButton.redeemLink);
    GiftButton.$('.gButton-banner-module > .gButton-explainer-component').show();
    var sendEmailBtn = congModule.find('.gButton-to-email');
    sendEmailBtn.html(GiftButton.translations['modal']['congratulations']['clickToRedeem']);
    sendEmailBtn.unbind('click', resetNoGiftModifications);
    sendEmailBtn.bind('click', GiftButton.redeemLink);
    congModule.find('.gButton-resend-email').show();
    GiftButton.$('.gButton-prev-arrow, .gButton-next-arrow, .gButton-resend-email').show();
    GiftButton.closeGiftModal();
  }

  /**
   *
   * @param text String
   * @param [headline] String
   */
  function showErrorModal(text, headline){
    var errorText = text || GiftButton.translations['modal']['congratulations']['errorText'];
    var headlineText = headline || GiftButton.translations['modal']['congratulations']['errorHeadline'];
    removeBannerComponents();
    showCongradulations();

    var congModule = GiftButton.$('.gButton-congradulations-module');
    var congIcon  = congModule.find('.gButton-congratulations-icon');
    var imgSrc = congIcon.attr('src').replace('gift-icon', 'error-icon');
    congIcon.attr('src', imgSrc);
    congModule.find('.gButton-main-headline').html(headlineText);
    congModule.find('.congrats-box.gButton-entry > h4').html(errorText);
    GiftButton.$('.gButton-progress-component').css('background', '#F94F48');

    var sendEmailBtn = congModule.find('.gButton-to-email');
    sendEmailBtn.html(GiftButton.translations['modal']['congratulations']['retry']);
    sendEmailBtn.removeAttr('onclick');
    sendEmailBtn.bind('click', resetCongratulations);
    congModule.find('.gButton-resend-email').hide();

  }

  function resetCongratulations(){

    if (GiftButton.promotions.length >= 2) {
      GiftButton.$('.congrats-box .congrats-bottom').show();
    }
    GiftButton.$('.gButton-slide').removeClass('congrats-in-view');
    /*showBannerComponents();
    var congModule = GiftButton.$('.gButton-congradulations-module');
    var congIcon  = congModule.find('.gButton-congratulations-icon');
    //var imgSrc = congIcon.attr('src').replace('error-icon', 'gift-icon');
    //congIcon.attr('src', imgSrc);
    congModule.find('.gButton-main-headline').html(GiftButton.translations['modal']['congratulations']['headline']);
    congModule.find('.congrats-box.gButton-entry > h4').html(GiftButton.translations['modal']['congratulations']['instructions']);
    GiftButton.$('.gButton-progress-component').removeAttr('style');

    GiftButton.progressBar.progCurrent = 0;
    GiftButton.$('.gButton-progress-component').animate({
      width: '0%'
    }, 500, 'easeOutBounce');

    var sendEmailBtn = congModule.find('.gButton-to-email');
    sendEmailBtn.html(GiftButton.translations['modal']['congratulations']['clickToRedeem']);
    sendEmailBtn.unbind('click', resetCongratulations);
    sendEmailBtn.bind('click', GiftButton.redeemLink);

    congModule.find('.gButton-resend-email').show();
    GiftButton.$('.gButton-nav, .gButton-explainer-component').show();
    GiftButton.$('.gButton-prev-arrow, .gButton-next-arrow, .gButton-resend-email, .gButton-form-module').show();

    GiftButton.$('.gButton-form-module .active').removeClass('active');
    GiftButton.$('.gButton-input-wrapper').first().addClass('active');
    congModule.hide();
    GiftButton.$('.gButton-congradulations-module, .gButton-overlay').removeClass('show-congradulation');*/
  }

  GiftButton.keyUpEmailInput = function (e) {
    if (e.keyCode == 13){
      GiftButton.$('.gButton-get-gift').click();
    }
  };

  GiftButton.emailInputFocus = function (e){
    if (window.matchMedia("(max-width: 500px)").matches) {
      GiftButton.$('.gButton-box').addClass('gButton-email-focus');
      var scrollPos = window.scrollY - 130;
      GiftButton.$('.gButton-box').css('top', scrollPos+'px');
    }
  };

  GiftButton.emailInputBlur = function (e) {
    GiftButton.$('.gButton-box').removeClass('gButton-email-focus');
    if (window.matchMedia("(max-width: 500px)").matches) {
      var scrollPos = window.scrollY + 40;
      GiftButton.$('.gButton-box').css('top', scrollPos+'px');
    }
  };

  function showErrorMsg(){
    var errElem = document.querySelector('.gButton-slide-content > fieldset');
    var errClass = GiftButton.promotions.length > 1 ? 'has-error' : 'has-error';
    addClass(errElem, errClass);
  }

  function removeErrorMsg(){
    var errElem = document.querySelector('.gButton-slide-content > fieldset');
    var errClass = GiftButton.promotions.length > 1 ? 'has-error' : 'has-error';
    removeClass(errElem, errClass);
  }

  function showRedBottomError(errorCode){
    var errElem = errorCode == 2009 ? document.querySelector('.gifted-email') : document.querySelector('.no-gifts');
    var errClass = GiftButton.promotions.length > 1 ? 'show-error' : 'show-error';
    addClass(errElem, errClass);
  }

  function removeRedBottomError(){
    //var errElem = document.querySelector('.gButton-error-msg');
    var errClass = GiftButton.promotions.length > 1 ? 'show-error' : 'show-error';
    GiftButton.$('.gButton-error-msg').removeClass(errClass);
  }

  function addClass(el, className){
    if (el.classList)
      el.classList.add(className);
    else
      el.className += ' ' + className;
  }

  function removeClass(el, className){
    if (el.classList)
      el.classList.remove(className);
    else
      el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }

  function addUILogic() {
    GiftButton.progressBar.formSteps = GiftButton.$('.gButton-box').first().find('.gButton-input-wrapper').length;
    GiftButton.progressBar.progPortion = 100 / GiftButton.progressBar.formSteps;

    GiftButton.$('.gButton-banner-module').on('mouseenter', function () {
      removeBannerComponents();
      if (!GiftButton.promotions.length > 1) GiftButton.$('.gButton-overlay').addClass('remove-from-view');
    }).on('mouseleave', function () {
      if (GiftButton.progressBar.progCurrent < 100) {
        showBannerComponents();
        if (!GiftButton.promotions.length > 1) GiftButton.$('.gButton-overlay').removeClass('remove-from-view');
      }
    });


// REMOVE ERRORS ON INPUT
    GiftButton.$('.gButton-email-input').on('input', function () {
      removeErrorMsg();
      removeRedBottomError();
    });

  }

    GiftButton.getGift = function(){
      var inputEmail = GiftButton.$('.gButton-gift-email-input').val();

      if(!isEmail(inputEmail)) {
        showErrorMsg();
      } else {
        GiftButton.data.email = inputEmail;

        if (GiftButton.module == 'E'){
          sendGatheredData(function (error, response){
            if(error != null ){
              error = error.error ? error.error : error;
              if (error.code && error.code == '2009') {
                showRedBottomError(2009);
                return;
              } else if (error.messages && error.messages[0].indexOf('gift code not issued') != -1 ||
                (error.messages && error.messages[0].indexOf('gift code not issued') != -1)){
                showErrorModal(GiftButton.translations['modal']['issuingError']);
              } else if (error.code && error.code == '2006'){
                showRedBottomError(2006);
                return;
              } else {
                showErrorModal(GiftButton.translations['modal']['issuingError']);
              }
              return;
            } else {
              GiftButton.redeemLink = response.redeemLink;
              GiftButton.giftCode = response.giftCode;
              GiftButton.$('.gButton-slide > .congrats-box > p').html(GiftButton.giftCode);
            }

            showCongradulations();
          });
        }
      }
    };


    

  GiftButton.goBack = function (){
    GiftButton.$('.gButton-form-module .active').removeClass('active').prev('.gButton-input-wrapper').addClass('active');

    GiftButton.progressBar.progCurrent = GiftButton.progressBar.progCurrent - GiftButton.progressBar.progPortion;

    var progCurrent = GiftButton.progressBar.progCurrent;
    GiftButton.$('.gButton-progress-component').animate({
      width: progCurrent+'%'
    }, 500, 'easeOutBounce');
  };

  GiftButton.getMoreGifts = function (){
    removeCongratsModalMoreGifts();
    GiftButton.nextGift();
  };

  GiftButton.openRedeemLink = function (){
    window.open(GiftButton.redeemLink, '_blank');
  };

  GiftButton.goToEmail = function (){
    var win;
    if(this.data.email.indexOf('@gmail.com') > 0){
      win = window.open('http://mail.google.com', '_blank');
      win.focus();
    } else if (this.data.email.indexOf('@yahoo.com') > 0){
      win = window.open('http://mail.yahoo.com', '_blank');
      win.focus();
    } else if (this.data.email.indexOf('@outlook.com') > 0 ||
      this.data.email.indexOf('@live.com') > 0 ||
      this.data.email.indexOf('@hotmail.com') > 0){
      win = window.open('http://mail.live.com', '_blank');
      win.focus();
    } else {
      window.location.href = 'mailto:'+this.data.email;
    }
  };

  function sendGatheredData(callback) {
    GiftButton.data.uuid = GiftButton.uuid;
    xhRequest('POST', cisApiLocation + sendDataPathExtension + GiftButton.uuid, GiftButton.data, callback);
  }

  GiftButton.closeGiftModal = function (){
    GiftButton.$('.gButton-prev-arrow, .gButton-next-arrow, .gButton-resend-email, .gButton-form-module').show();
    GiftButton.$('html').removeClass('gButton-body');
    clearInterval(GiftButton.checker);
    var elms = GiftButton.$('.gButton-box, .gButton-popup-overlay');
    elms.removeClass('popup-shown');
    setTimeout(function(){
      resetCongratulations();
    }, 0);
    GiftButton.progressBar = {
      formSteps: 0,
      progPortion: 0,
      progCurrent: 0
    };
    GiftButton.data.email = '';
    GiftButton.data.gender = '';
    GiftButton.data.age = '';
    setTimeout(function (){
      elms.remove();
    }, 1000);
    var index;
    for (index = 0; index < GiftButton.promotions.length; index++){
      GiftButton.promotions[index].isSeen = false;
    }
  };

  loadSupportingFiles(function() {
    var params = getButtonParams();
    GiftButton.uuid = params.uuid; // uuid
    GiftButton.thankYouEvent = params.t; // uuid

    getGiftBoxData(function (hasError){
      if (hasError) {
        GiftButton.gbSnag.notify("Gift button promotion ended", "The gift button " + GiftButton.uuid + " promotion has ended.", {}, "warning");
        return;
      }

      if (GiftButton.hasThankYou){
        setUpThankYou();
      }
      renderButton();
      trackButtonImpression();
    });
  });

  return GiftButton;
})(window);


function _gcGBCustomInvoke(){
  if (GiftButton.thankYouEvent == 'CUSTOM' && arguments.length == 1
    && typeof arguments[0] == 'string'){
    GiftButton.invokeGCModal(arguments[0]);
  } else if (GiftButton.thankYouEvent == 'CUSTOM-EMAIL' && arguments.length == 1
    && typeof arguments[0] == 'string' && typeof arguments[1] == 'string'){
    GiftButton.invokeGCModal(arguments[0], arguments[1]);
  } else {
    GiftButton.invokeGCModal();
  }
}